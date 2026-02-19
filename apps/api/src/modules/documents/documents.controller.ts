import { Controller, Post, Get, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar upload de documento' })
  async upload(@CurrentUser('sub') userId: string, @Body() data: any) {
    return this.documentsService.upload(userId, data);
  }

  @Get('operation/:operationId')
  @ApiOperation({ summary: 'Documentos de uma operação' })
  async findByOperation(@Param('operationId') operationId: string) {
    return this.documentsService.findByOperation(operationId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Meus documentos' })
  async findMine(@CurrentUser('sub') userId: string) {
    return this.documentsService.findByUser(userId);
  }

  @Post(':id/grant-access')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Conceder acesso a parceiro' })
  async grantAccess(
    @Param('id') id: string,
    @Body() body: { partnerId: string; expiresAt?: string },
  ) {
    return this.documentsService.grantAccess(
      id,
      body.partnerId,
      body.expiresAt ? new Date(body.expiresAt) : undefined,
    );
  }

  @Post(':id/verify')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_ANALYST)
  @ApiOperation({ summary: 'Verificar documento' })
  async verify(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.documentsService.verify(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir documento (soft delete)' })
  async delete(@Param('id') id: string) {
    return this.documentsService.softDelete(id);
  }
}
