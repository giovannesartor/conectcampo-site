import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@ApiTags('api-keys')
@ApiBearerAuth('bearer')
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly service: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'Listar minhas API keys' })
  @ApiResponse({ status: 200, description: 'Lista de chaves (sem o segredo)' })
  list(@CurrentUser('sub') userId: string) {
    return this.service.list(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar API key (o segredo é exibido uma única vez)' })
  @ApiResponse({ status: 201, description: 'Chave criada; campo "secret" retornado apenas nesta resposta' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateApiKeyDto) {
    return this.service.create(userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revogar API key' })
  @ApiResponse({ status: 200, description: 'Chave revogada' })
  revoke(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.revoke(userId, id, role);
  }
}
