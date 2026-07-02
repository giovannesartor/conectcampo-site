import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

interface NotificationEvent {
  userId: string;
  data: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // Event bus em memória para push em tempo real (SSE).
  // Para múltiplas instâncias, trocar por Redis pub/sub.
  private readonly events$ = new Subject<NotificationEvent>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /** Stream de notificações de um usuário (para SSE). */
  streamFor(userId: string): Observable<Record<string, unknown>> {
    return this.events$.asObservable().pipe(
      filter((e) => e.userId === userId),
      map((e) => e.data),
    );
  }

  async findByUser(userId: string, page = 1, perPage = 20) {
    const where = { userId };

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      data: data.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        readAt: n.readAt ?? null,
        link: n.link,
      })),
      unreadCount,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new NotFoundException('Notificação não encontrada');

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { marked: result.count };
  }

  async dismiss(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new NotFoundException('Notificação não encontrada');

    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Cria notificação (chamado internamente por outros services)
   */
  async create(params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
      },
    });

    // Push em tempo real (SSE)
    this.events$.next({
      userId: params.userId,
      data: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        createdAt: notification.createdAt,
      },
    });

    this.logger.log(`Notification created for user ${params.userId}: ${params.title}`);
    return notification;
  }

  /**
   * Cria notificação in-app e, conforme as preferências do usuário, também
   * envia e-mail (via MailService — Resend ou SMTP). Não bloqueia o fluxo.
   */
  async notify(params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    email?: boolean; // força/desliga e-mail; default = respeita preferências
  }) {
    await this.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
    });

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: params.userId },
        select: { email: true, notificationPreferences: true },
      });
      if (!user?.email) return;

      const prefs = (user.notificationPreferences as Record<string, any>) ?? {};
      const emailEnabled = params.email ?? prefs.email !== false; // e-mail ligado por padrão
      const typeMuted = Array.isArray(prefs.mutedTypes) && prefs.mutedTypes.includes(params.type);

      if (emailEnabled && !typeMuted) {
        this.mail
          .sendNotification(user.email, params.title, params.message, params.link)
          .catch(() => null);
      }
    } catch (err) {
      this.logger.warn(`Falha ao enviar e-mail de notificação: ${(err as Error).message}`);
    }
  }

  // ─── Preferências de notificação ──────────────────────────────────────────────

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });
    const prefs = (user?.notificationPreferences as Record<string, any>) ?? {};
    return {
      email: prefs.email !== false,
      inApp: prefs.inApp !== false,
      mutedTypes: Array.isArray(prefs.mutedTypes) ? prefs.mutedTypes : [],
    };
  }

  async updatePreferences(
    userId: string,
    prefs: { email?: boolean; inApp?: boolean; mutedTypes?: string[] },
  ) {
    const current = await this.getPreferences(userId);
    const merged = { ...current, ...prefs };
    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: merged },
    });
    return merged;
  }
}
