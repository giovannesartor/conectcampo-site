import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly config: ConfigService,
    @InjectQueue('email') private readonly emailQueue: Queue,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.config.get<number>('SMTP_PORT', 587),
      secure: false, // STARTTLS
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  // ─── Envio ────────────────────────────────────────────────────────────────
  // send() enfileira (fila Redis) para não bloquear o request; se a fila
  // estiver indisponível, envia direto como fallback.

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.emailQueue.add(
        'send',
        { to, subject, html },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: true, removeOnFail: 100 },
      );
    } catch (err) {
      this.logger.warn(`Fila de e-mail indisponível — enviando direto. (${(err as Error).message})`);
      await this.deliver(to, subject, html);
    }
  }

  /** Envio real (chamado pelo processor da fila ou pelo fallback). */
  async deliver(to: string, subject: string, html: string): Promise<void> {
    // Preferência: Resend (HTTP API) quando configurado; senão SMTP (nodemailer).
    if (this.config.get<string>('RESEND_API_KEY')) {
      return this.deliverViaResend(to, subject, html);
    }
    const from = `"ConectCampo" <${this.config.get<string>('MAIL_FROM', 'conectcampodigital@gmail.com')}>`;
    try {
      await this.transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
    }
  }

  /** Envio via Resend (https://resend.com) usando a HTTP API. */
  private async deliverViaResend(to: string, subject: string, html: string): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY') as string;
    const from =
      this.config.get<string>('RESEND_FROM') ??
      this.config.get<string>('MAIL_FROM', 'ConectCampo <no-reply@conectcampo.digital>');
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, html }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Resend ${res.status}: ${text}`);
      }
      this.logger.log(`Email sent via Resend to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`Resend falhou para ${to}: ${(err as Error).message}`);
    }
  }

  /** Notificação transacional genérica (usada por outros módulos). */
  async sendNotification(
    to: string,
    title: string,
    message: string,
    ctaPath?: string,
    ctaLabel = 'Abrir no painel',
  ): Promise<void> {
    const html = this.layout(`
      <h1 style="font-size:20px;color:#166534;margin:0 0 12px">${title}</h1>
      <p style="margin:0 0 16px;color:#374151;line-height:1.5">${message}</p>
      ${ctaPath ? this.button(ctaLabel, `${this.appUrl()}${ctaPath}`) : ''}
    `);
    await this.send(to, title, html);
  }

  // ─── Templates ──────────────────────────────────────────────────────────────

  async sendWelcome(to: string, name: string): Promise<void> {
    const subject = 'Bem-vindo à ConectCampo! 🌱';
    const html = this.layout(`
      <h1 style="font-size:22px;color:#166534;margin:0 0 12px">Olá, ${name}! 🎉</h1>
      <p style="margin:0 0 16px;color:#374151">
        Sua conta na <strong>ConectCampo</strong> foi criada com sucesso.
        Estamos muito felizes em ter você na plataforma!
      </p>
      <p style="margin:0 0 16px;color:#374151">
        A ConectCampo conecta produtores rurais a parceiros financeiros de forma simples, segura e eficiente.
        Explore a plataforma e inicie sua jornada no crédito agro.
      </p>
      ${this.button('Acessar plataforma', `${this.appUrl()}/dashboard`)}
      <p style="margin:20px 0 0;font-size:13px;color:#6b7280">
        Dúvidas? Responda este e-mail ou acesse nossa <a href="${this.appUrl()}/contato" style="color:#16a34a">página de contato</a>.
      </p>
    `);
    await this.send(to, subject, html);
  }

  async sendEmailVerification(to: string, name: string, token: string): Promise<void> {
    const link = `${this.appUrl()}/verify-email?token=${token}`;
    const subject = 'Confirme seu e-mail — ConectCampo';
    const html = this.layout(`
      <h1 style="font-size:22px;color:#166534;margin:0 0 12px">Confirme seu e-mail</h1>
      <p style="margin:0 0 16px;color:#374151">Olá, <strong>${name}</strong>!</p>
      <p style="margin:0 0 24px;color:#374151">
        Clique no botão abaixo para confirmar seu endereço de e-mail.
        Este link expira em <strong>24 horas</strong>.
      </p>
      ${this.button('Confirmar e-mail', link)}
      <p style="margin:20px 0 0;font-size:12px;color:#9ca3af">
        Caso não consiga clicar, copie e cole este link no navegador:<br/>
        <a href="${link}" style="color:#16a34a;word-break:break-all">${link}</a>
      </p>
      <p style="margin:16px 0 0;font-size:12px;color:#9ca3af">
        Se você não criou uma conta, ignore este e-mail.
      </p>
    `);
    await this.send(to, subject, html);
  }

  async sendPasswordReset(to: string, name: string, token: string): Promise<void> {
    const link = `${this.appUrl()}/reset-password?token=${token}`;
    const subject = 'Redefinição de senha — ConectCampo';
    const html = this.layout(`
      <h1 style="font-size:22px;color:#166534;margin:0 0 12px">Redefinir senha</h1>
      <p style="margin:0 0 16px;color:#374151">Olá, <strong>${name}</strong>!</p>
      <p style="margin:0 0 8px;color:#374151">
        Recebemos uma solicitação para redefinir a senha da sua conta.
        Clique no botão abaixo para criar uma nova senha.
      </p>
      <p style="margin:0 0 24px;font-size:13px;color:#6b7280">
        Este link expira em <strong>1 hora</strong>.
      </p>
      ${this.button('Redefinir minha senha', link)}
      <p style="margin:20px 0 0;font-size:12px;color:#9ca3af">
        Caso não consiga clicar, copie e cole este link no navegador:<br/>
        <a href="${link}" style="color:#16a34a;word-break:break-all">${link}</a>
      </p>
      <p style="margin:16px 0 0;font-size:12px;color:#9ca3af">
        Se você não solicitou a redefinição, ignore este e-mail. Sua senha permanece a mesma.
      </p>
    `);
    await this.send(to, subject, html);
  }

  async sendPasswordChanged(to: string, name: string): Promise<void> {
    const subject = 'Senha alterada com sucesso — ConectCampo';
    const html = this.layout(`
      <h1 style="font-size:22px;color:#166534;margin:0 0 12px">Senha alterada ✅</h1>
      <p style="margin:0 0 16px;color:#374151">Olá, <strong>${name}</strong>!</p>
      <p style="margin:0 0 16px;color:#374151">
        Sua senha foi alterada com sucesso em ${new Date().toLocaleString('pt-BR')}.
      </p>
      <p style="margin:0 0 24px;color:#374151">
        Se não foi você, entre em contato com a nossa equipe imediatamente.
      </p>
      ${this.button('Acessar minha conta', `${this.appUrl()}/login`)}
      <p style="margin:20px 0 0;font-size:12px;color:#9ca3af">
        Precisa de ajuda? <a href="${this.appUrl()}/contato" style="color:#16a34a">Fale conosco</a>.
      </p>
    `);
    await this.send(to, subject, html);
  }

  async sendPaymentConfirmation(to: string, name: string): Promise<void> {
    const subject = 'Pagamento confirmado — ConectCampo ✅';
    const html = this.layout(`
      <h1 style="font-size:22px;color:#166534;margin:0 0 12px">Pagamento confirmado! 🎉</h1>
      <p style="margin:0 0 16px;color:#374151">Olá, <strong>${name}</strong>!</p>
      <p style="margin:0 0 16px;color:#374151">
        Recebemos a confirmação do seu pagamento. Sua assinatura na <strong>ConectCampo</strong> está ativa!
      </p>
      <p style="margin:0 0 24px;color:#374151">
        Para acessar a plataforma, verifique seu e-mail clicando no link que também
        enviamos hoje. Após confirmar seu e-mail, faça login e aproveite tudo que
        a ConectCampo tem para oferecer.
      </p>
      ${this.button('Fazer login', `${this.appUrl()}/login`)}
      <p style="margin:20px 0 0;font-size:13px;color:#6b7280">
        Dúvidas ou problemas? <a href="${this.appUrl()}/contato" style="color:#16a34a">Fale com nosso suporte</a>.
      </p>
      <p style="margin:12px 0 0;font-size:11px;color:#d1d5db">
        Pagamentos processados por AG Digital · AG PARTICIPACOES SOCIETARIAS LTDA · CNPJ 54.079.299/0001-40
      </p>
    `);
    await this.send(to, subject, html);
  }

  // ─── Layout helpers ─────────────────────────────────────────────────────────

  private appUrl(): string {
    return this.config.get<string>('FRONTEND_URL', 'https://conectcampo.digital');
  }

  private button(label: string, url: string): string {
    return `
      <div style="text-align:center;margin:24px 0">
        <a href="${url}"
           style="background:#16a34a;color:#ffffff;text-decoration:none;font-weight:600;
                  font-size:15px;padding:14px 32px;border-radius:8px;display:inline-block">
          ${label}
        </a>
      </div>`;
  }

  private layout(content: string): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:12px;overflow:hidden;
                    box-shadow:0 1px 3px rgba(0,0,0,.08)">
        <!-- Header -->
        <tr>
          <td style="background:#16a34a;padding:28px 40px;text-align:center">
            <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">
              🌱 ConectCampo
            </span>
            <p style="margin:4px 0 0;font-size:12px;color:#bbf7d0">
              Crédito agro conectado
            </p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 28px">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center">
            <p style="margin:0;font-size:12px;color:#9ca3af">
              © ${new Date().getFullYear()} ConectCampo · 
              <a href="https://conectcampo.digital" style="color:#16a34a;text-decoration:none">conectcampo.digital</a>
            </p>
            <p style="margin:6px 0 0;font-size:11px;color:#d1d5db">
              Você está recebendo este e-mail por ter uma conta na ConectCampo.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}
