import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('partners')
@ApiBearerAuth()
@Controller('partners')
@UseGuards(RolesGuard)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cadastrar parceiro financeiro' })
  async create(@Body() data: any) {
    return this.partnersService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Listar parceiros' })
  async findAll(@Query('page') page?: number, @Query('perPage') perPage?: number) {
    return this.partnersService.findAll(page, perPage);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar parceiro' })
  async findById(@Param('id') id: string) {
    return this.partnersService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.FINANCIAL_INSTITUTION)
  @ApiOperation({ summary: 'Atualizar parceiro' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.partnersService.update(id, data);
  }

  @Get(':id/dashboard')
  @Roles(UserRole.ADMIN, UserRole.FINANCIAL_INSTITUTION)
  @ApiOperation({ summary: 'Dashboard do parceiro' })
  async getDashboard(@Param('id') id: string) {
    return this.partnersService.getDashboard(id);
  }
}
