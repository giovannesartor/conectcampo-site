import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FieldJournalService } from './field-journal.service';
import { CreateFieldEntryDto, UpdateFieldEntryDto } from './dto/field-entry.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ALL_ROLES } from '../../common/constants/roles';

@ApiTags('field-journal')
@ApiBearerAuth()
@Controller('field-journal')
@UseGuards(RolesGuard)
@Roles(...ALL_ROLES)
export class FieldJournalController {
  constructor(private readonly service: FieldJournalService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumo do diário de safra' })
  getSummary(@CurrentUser('sub') userId: string, @CurrentUser('role') role: string) {
    return this.service.getSummary(userId, role);
  }

  @Get()
  @ApiOperation({ summary: 'Listar registros do caderno de campo' })
  @ApiQuery({ name: 'farmId', required: false })
  findAll(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.service.findAll(userId, role, farmId);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar atividade de campo' })
  create(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: CreateFieldEntryDto,
  ) {
    return this.service.create(userId, role, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar registro' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateFieldEntryDto,
  ) {
    return this.service.update(id, userId, role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover registro' })
  remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.remove(id, userId, role);
  }
}
