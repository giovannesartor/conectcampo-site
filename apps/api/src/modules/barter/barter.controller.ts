import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BarterService } from './barter.service';
import { CreateBarterDto, UpdateBarterDto } from './dto/barter.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ALL_ROLES } from '../../common/constants/roles';

@ApiTags('barter')
@ApiBearerAuth()
@Controller('barter')
@UseGuards(RolesGuard)
@Roles(...ALL_ROLES)
export class BarterController {
  constructor(private readonly service: BarterService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumo das operações de barter' })
  getSummary(@CurrentUser('sub') userId: string, @CurrentUser('role') role: string) {
    return this.service.getSummary(userId, role);
  }

  @Get()
  @ApiOperation({ summary: 'Listar operações de troca (insumo por grão)' })
  findAll(@CurrentUser('sub') userId: string, @CurrentUser('role') role: string) {
    return this.service.findAll(userId, role);
  }

  @Post()
  @ApiOperation({ summary: 'Criar operação de barter' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateBarterDto) {
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar operação de barter' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateBarterDto,
  ) {
    return this.service.update(id, userId, role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover operação de barter' })
  remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.remove(id, userId, role);
  }
}
