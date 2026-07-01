import { Controller, Post, Get, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { Public } from '../auth/decorators/public.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  @Public()
  @Post()
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Capturar lead (público — simulador/contato)' })
  create(@Body() dto: CreateLeadDto) {
    return this.service.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar leads (admin)' })
  findAll(
    @Query('page') page = 1,
    @Query('perPage') perPage = 50,
    @Query('status') status?: string,
  ) {
    return this.service.findAll(+page, +perPage, status);
  }
}
