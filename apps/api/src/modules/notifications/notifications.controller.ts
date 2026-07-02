import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { Observable, merge, interval, EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(RolesGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Stream em tempo real (SSE). EventSource não envia header Authorization,
   * então o token vai na query. Validado manualmente aqui.
   */
  @Public()
  @Sse('stream')
  @ApiOperation({ summary: 'Stream de notificações em tempo real (SSE)' })
  stream(@Query('token') token: string): Observable<MessageEvent> {
    let userId: string | null = null;
    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      userId = payload?.sub ?? null;
    } catch {
      userId = null;
    }
    if (!userId) return EMPTY; // token inválido → encerra o stream

    const notifications$ = this.notificationsService
      .streamFor(userId)
      .pipe(map((data): MessageEvent => ({ type: 'notification', data })));

    // heartbeat a cada 25s para manter a conexão viva atrás de proxies
    const heartbeat$ = interval(25000).pipe(
      map((): MessageEvent => ({ type: 'ping', data: { t: Date.now() } })),
    );

    return merge(notifications$, heartbeat$);
  }

  @Get()
  @ApiOperation({ summary: 'Listar minhas notificações' })
  async findMine(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.notificationsService.findByUser(
      userId,
      page ? Math.max(1, parseInt(page, 10)) : 1,
      perPage ? Math.min(100, parseInt(perPage, 10)) : 20,
    );
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar todas como lidas' })
  async markAllRead(@CurrentUser('sub') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Minhas preferências de notificação' })
  async getPreferences(@CurrentUser('sub') userId: string) {
    return this.notificationsService.getPreferences(userId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Atualizar preferências de notificação (e-mail, in-app, tipos silenciados)' })
  async updatePreferences(
    @CurrentUser('sub') userId: string,
    @Body() body: { email?: boolean; inApp?: boolean; mutedTypes?: string[] },
  ) {
    return this.notificationsService.updatePreferences(userId, body);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  async markRead(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Descartar notificação' })
  async dismiss(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.notificationsService.dismiss(id, userId);
  }
}
