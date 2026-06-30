import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('api-keys')
@ApiBearerAuth()
@Controller('api-keys')
@UseGuards(RolesGuard)
@Roles(UserRole.FINANCIAL_INSTITUTION, UserRole.ADMIN)
export class ApiKeysController {
  constructor(private readonly service: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'Listar minhas API keys' })
  list(@CurrentUser('sub') userId: string) {
    return this.service.list(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar API key (o segredo é exibido uma única vez)' })
  create(@CurrentUser('sub') userId: string, @Body('name') name: string) {
    return this.service.create(userId, name);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revogar API key' })
  revoke(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.revoke(userId, id, role);
  }
}
