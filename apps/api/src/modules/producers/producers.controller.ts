import { Controller, Post, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProducersService } from './producers.service';
import { CreateProducerProfileDto } from './dto/create-producer-profile.dto';
import { CreateFinancialProfileDto } from './dto/create-financial-profile.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('producers')
@ApiBearerAuth()
@Controller('producers')
@UseGuards(RolesGuard)
export class ProducersController {
  constructor(private readonly producersService: ProducersService) {}

  @Post('profile')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY)
  @ApiOperation({ summary: 'Criar perfil de produtor' })
  async createProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateProducerProfileDto,
  ) {
    return this.producersService.createProfile(userId, dto);
  }

  @Get('profile')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obter perfil de produtor' })
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.producersService.getProfile(userId);
  }

  @Patch('profile')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY)
  @ApiOperation({ summary: 'Atualizar perfil de produtor' })
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: Partial<CreateProducerProfileDto>,
  ) {
    return this.producersService.updateProfile(userId, dto);
  }

  @Post('financial')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY)
  @ApiOperation({ summary: 'Criar/atualizar perfil financeiro' })
  async createFinancialProfile(
    @CurrentUser('sub') userId: string,
    @Body() data: CreateFinancialProfileDto,
  ) {
    return this.producersService.createFinancialProfile(userId, data);
  }
}
