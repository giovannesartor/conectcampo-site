import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect } from 'http2';
import { createPrivateKey, sign } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterPushDeviceDto } from './dto/push-device.dto';

type PushPayload = {
  title: string;
  message: string;
  link?: string;
  type?: string;
};

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);
  private cachedProviderToken: { value: string; createdAt: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async register(userId: string, dto: RegisterPushDeviceDto) {
    const token = dto.token.toLowerCase();
    await this.prisma.pushDevice.upsert({
      where: { token },
      create: {
        userId,
        token,
        platform: dto.platform,
        environment: dto.environment,
        appVersion: dto.appVersion,
      },
      update: {
        userId,
        platform: dto.platform,
        environment: dto.environment,
        appVersion: dto.appVersion,
        enabled: true,
        lastSeenAt: new Date(),
      },
    });
    return { registered: true };
  }

  async unregister(userId: string, token: string) {
    const result = await this.prisma.pushDevice.updateMany({
      where: { userId, token: token.toLowerCase() },
      data: { enabled: false, lastSeenAt: new Date() },
    });
    return { unregistered: result.count > 0 };
  }

  async sendToUser(userId: string, payload: PushPayload) {
    if (!this.isConfigured()) return { sent: 0, skipped: true };

    const devices = await this.prisma.pushDevice.findMany({
      where: { userId, enabled: true, platform: 'ios' },
      select: { id: true, token: true, environment: true },
    });

    const results = await Promise.allSettled(
      devices.map(async (device) => {
        const response = await this.send(device.token, device.environment, payload);
        if (response.status === 410 || ['BadDeviceToken', 'Unregistered'].includes(response.reason ?? '')) {
          await this.prisma.pushDevice.update({
            where: { id: device.id },
            data: { enabled: false },
          });
        }
        return response.status >= 200 && response.status < 300;
      }),
    );

    const sent = results.filter((result) => result.status === 'fulfilled' && result.value).length;
    if (devices.length > 0) this.logger.log(`Push APNs entregue a ${sent}/${devices.length} dispositivo(s)`);
    return { sent, attempted: devices.length };
  }

  private async send(token: string, environment: string, payload: PushPayload) {
    const host = environment === 'SANDBOX'
      ? 'https://api.sandbox.push.apple.com'
      : 'https://api.push.apple.com';
    const topic = this.config.get<string>('APNS_BUNDLE_ID', 'digital.conectcampo.app');
    const client = connect(host);

    return new Promise<{ status: number; reason?: string }>((resolve, reject) => {
      let settled = false;
      let status = 0;
      let body = '';
      const finish = (result: { status: number; reason?: string }) => {
        if (settled) return;
        settled = true;
        client.close();
        resolve(result);
      };
      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        client.close();
        reject(error);
      };
      const request = client.request({
        ':method': 'POST',
        ':path': `/3/device/${token}`,
        authorization: `bearer ${this.providerToken()}`,
        'apns-topic': topic,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'apns-expiration': '0',
        'content-type': 'application/json',
      });

      request.setEncoding('utf8');
      request.on('response', (headers) => {
        status = Number(headers[':status'] ?? 0);
      });
      request.on('data', (chunk) => { body += chunk; });
      request.on('end', () => {
        let reason: string | undefined;
        try { reason = body ? JSON.parse(body).reason : undefined; } catch { reason = undefined; }
        finish({ status, reason });
      });
      request.on('error', fail);
      client.on('error', fail);

      request.end(JSON.stringify({
        aps: {
          alert: { title: payload.title, body: payload.message },
          sound: 'default',
        },
        link: payload.link,
        type: payload.type,
      }));
    });
  }

  private providerToken(): string {
    const now = Math.floor(Date.now() / 1000);
    if (this.cachedProviderToken && now - this.cachedProviderToken.createdAt < 45 * 60) {
      return this.cachedProviderToken.value;
    }

    const teamId = this.config.getOrThrow<string>('APNS_TEAM_ID');
    const keyId = this.config.getOrThrow<string>('APNS_KEY_ID');
    const rawKey = this.config.getOrThrow<string>('APNS_PRIVATE_KEY');
    const privateKey = rawKey.replace(/\\n/g, '\n');
    const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId })).toString('base64url');
    const claims = Buffer.from(JSON.stringify({ iss: teamId, iat: now })).toString('base64url');
    const unsigned = `${header}.${claims}`;
    const signature = sign('sha256', Buffer.from(unsigned), {
      key: createPrivateKey(privateKey),
      dsaEncoding: 'ieee-p1363',
    }).toString('base64url');
    const value = `${unsigned}.${signature}`;

    this.cachedProviderToken = { value, createdAt: now };
    return value;
  }

  private isConfigured(): boolean {
    return !!(
      this.config.get<string>('APNS_TEAM_ID') &&
      this.config.get<string>('APNS_KEY_ID') &&
      this.config.get<string>('APNS_PRIVATE_KEY')
    );
  }
}
