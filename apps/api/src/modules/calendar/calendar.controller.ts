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
import { CalendarService } from './calendar.service';
import {
  CreateFinancialEventDto,
  UpdateFinancialEventDto,
} from './dto/financial-event.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ALL_ROLES } from '../../common/constants/roles';

@ApiTags('calendar')
@ApiBearerAuth()
@Controller('calendar')
@UseGuards(RolesGuard)
@Roles(...ALL_ROLES)
export class CalendarController {
  constructor(private readonly service: CalendarService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumo de vencimentos (a vencer, atrasados, próximos 30d)' })
  getSummary(@CurrentUser('sub') userId: string, @CurrentUser('role') role: string) {
    return this.service.getSummary(userId, role);
  }

  @Get()
  @ApiOperation({ summary: 'Listar eventos financeiros' })
  findAll(@CurrentUser('sub') userId: string, @CurrentUser('role') role: string) {
    return this.service.findAll(userId, role);
  }

  @Post()
  @ApiOperation({ summary: 'Criar evento de vencimento' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateFinancialEventDto) {
    return this.service.create(userId, dto);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Gerar vencimentos automaticamente a partir de CPRs e contratos' })
  sync(@CurrentUser('sub') userId: string) {
    return this.service.syncFromSources(userId);
  }

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Marcar como pago' })
  markPaid(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.markPaid(id, userId, role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar evento' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateFinancialEventDto,
  ) {
    return this.service.update(id, userId, role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover evento' })
  remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.remove(id, userId, role);
  }
}
