import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MailService } from '../mail/mail.service';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailService: MailService) {}

  /** Envio genérico enfileirado por MailService.send(). */
  @Process('send')
  async handleSend(job: Job<{ to: string; subject: string; html: string }>) {
    await this.mailService.deliver(job.data.to, job.data.subject, job.data.html);
  }

  @Process('welcome')
  async handleWelcome(job: Job<{ email: string; name: string }>) {
    this.logger.log(`Sending welcome email to ${job.data.email}`);
    await this.mailService.sendWelcome(job.data.email, job.data.name);
  }

  @Process('verification')
  async handleVerification(
    job: Job<{ email: string; name: string; token: string }>,
  ) {
    this.logger.log(`Sending verification email to ${job.data.email}`);
    await this.mailService.sendEmailVerification(
      job.data.email,
      job.data.name,
      job.data.token,
    );
  }

  @Process('password-reset')
  async handlePasswordReset(
    job: Job<{ email: string; name: string; token: string }>,
  ) {
    this.logger.log(`Sending password reset email to ${job.data.email}`);
    await this.mailService.sendPasswordReset(
      job.data.email,
      job.data.name,
      job.data.token,
    );
  }

  @Process('password-changed')
  async handlePasswordChanged(job: Job<{ email: string; name: string }>) {
    this.logger.log(`Sending password changed email to ${job.data.email}`);
    await this.mailService.sendPasswordChanged(job.data.email, job.data.name);
  }
}
