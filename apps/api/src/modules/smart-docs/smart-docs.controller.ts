import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SmartDocsService } from './smart-docs.service';
import { CreateExtractionDto } from './dto/create-extraction.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ALL_ROLES } from '../../common/constants/roles';

@ApiTags('smart-docs')
@ApiBearerAuth()
@Controller('smart-docs')
@UseGuards(RolesGuard)
@Roles(...ALL_ROLES)
export class SmartDocsController {
  constructor(private readonly service: SmartDocsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar extrações de documentos' })
  findAll(@CurrentUser('sub') userId: string, @CurrentUser('role') role: string) {
    return this.service.findAll(userId, role);
  }

  @Post()
  @ApiOperation({ summary: 'Extrair campos-chave de um documento (OCR/IA)' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateExtractionDto) {
    return this.service.create(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar extração' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.findOne(id, userId, role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover extração' })
  remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.remove(id, userId, role);
  }
}
