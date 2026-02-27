import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
  Header,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Overview / KPIs ────────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'KPIs executivos da plataforma' })
  async getStats() {
    return this.adminService.getStats();
  }

  // ─── Users ──────────────────────────────────────────────────────────
  @Get('users')
  @ApiOperation({ summary: 'Listar todos os usuários' })
  async getUsers(
    @Query('page') page = 1,
    @Query('perPage') perPage = 20,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(+page, +perPage, role, search);
  }

  @Patch('users/:id/toggle-active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ativar/desativar usuário' })
  async toggleUserActive(@Param('id') id: string) {
    return this.adminService.toggleUserActive(id);
  }

  @Patch('users/:id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alterar role do usuário' })
  async changeUserRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
  ) {
    return this.adminService.changeUserRole(id, role);
  }

  // ─── Operations ─────────────────────────────────────────────────────
  @Get('operations')
  @ApiOperation({ summary: 'Todas as operações da plataforma' })
  async getOperations(
    @Query('page') page = 1,
    @Query('perPage') perPage = 20,
    @Query('status') status?: string,
  ) {
    return this.adminService.getOperations(+page, +perPage, status);
  }

  // ─── Partners ───────────────────────────────────────────────────────
  @Get('partners')
  @ApiOperation({ summary: 'Todos os parceiros financeiros' })
  async getPartners() {
    return this.adminService.getPartners();
  }

  // ─── Audit ──────────────────────────────────────────────────────────
  @Get('audit-logs')
  @ApiOperation({ summary: 'Logs de auditoria com filtros' })
  @ApiQuery({ name: 'page',     required: false })
  @ApiQuery({ name: 'perPage',  required: false })
  @ApiQuery({ name: 'userId',   required: false })
  @ApiQuery({ name: 'action',   required: false })
  @ApiQuery({ name: 'entity',   required: false })
  @ApiQuery({ name: 'search',   required: false, description: 'Filtrar por nome ou email do usuário' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'dateTo',   required: false, description: 'YYYY-MM-DD' })
  async getAuditLogs(
    @Query('page')     page    = 1,
    @Query('perPage')  perPage = 50,
    @Query('userId')   userId?:   string,
    @Query('action')   action?:   string,
    @Query('entity')   entity?:   string,
    @Query('search')   search?:   string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo')   dateTo?:   string,
  ) {
    return this.adminService.getAuditLogs({
      page: +page, perPage: +perPage,
      userId, action, entity, search, dateFrom, dateTo,
    });
  }

  @Get('audit-logs/stats')
  @ApiOperation({ summary: 'Contagem de logs por tipo de ação' })
  async getAuditStats() {
    return this.adminService.getAuditStats();
  }

  @Get('audit-logs/export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="audit-logs.csv"')
  @ApiOperation({ summary: 'Exportar logs de auditoria em CSV' })
  async exportAuditLogs(
    @Res() res: Response,
    @Query('userId')   userId?:   string,
    @Query('action')   action?:   string,
    @Query('entity')   entity?:   string,
    @Query('search')   search?:   string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo')   dateTo?:   string,
  ) {
    const csv = await this.adminService.exportAuditLogs({ userId, action, entity, search, dateFrom, dateTo });
    res.send(csv);
  }

  // ─── Revenue ────────────────────────────────────────────────────────
  @Get('revenue')
  @ApiOperation({ summary: 'Dados de receita e comissões' })
  async getRevenue() {
    return this.adminService.getRevenue();
  }
}
