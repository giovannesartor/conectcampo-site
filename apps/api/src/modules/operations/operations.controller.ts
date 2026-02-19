import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OperationsService } from './operations.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('operations')
@ApiBearerAuth()
@Controller('operations')
@UseGuards(RolesGuard)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Post()
  @Roles(UserRole.PRODUCER, UserRole.COMPANY)
  @ApiOperation({ summary: 'Criar nova operação de crédito' })
  async create(@CurrentUser('sub') userId: string, @Body() data: any) {
    return this.operationsService.create(userId, data);
  }

  @Get()
  @Roles(UserRole.PRODUCER, UserRole.COMPANY)
  @ApiOperation({ summary: 'Listar operações do produtor' })
  async findAll(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.operationsService.findAll(userId, page, perPage);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar operação' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.operationsService.findById(id, userId);
  }

  @Patch(':id/submit')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY)
  @ApiOperation({ summary: 'Submeter operação para análise' })
  async submit(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.operationsService.submit(id, userId);
  }
}
