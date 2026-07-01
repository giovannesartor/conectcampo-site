import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

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

  constructor(private readonly prisma: PrismaService) {}

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
}
