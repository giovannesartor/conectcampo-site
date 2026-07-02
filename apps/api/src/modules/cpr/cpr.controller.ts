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
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { CprService } from './cpr.service';
import { CreateCprDto } from './dto/create-cpr.dto';
import { UpdateCprDto } from './dto/update-cpr.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('cpr')
@ApiBearerAuth()
@Controller('cpr')
@UseGuards(RolesGuard)
export class CprController {
  constructor(private readonly service: CprService) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────

  @Get('summary')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Resumo das CPRs do usuário' })
  async getSummary(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.getSummary(userId, role);
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Criar nova CPR (rascunho)',
    description:
      'Cria uma CPR em rascunho. Use purpose=EMISSAO para emitir uma CPR física/financeira, ' +
      'ou purpose=CAPTACAO para usar a CPR como garantia numa operação de crédito.',
  })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateCprDto,
  ) {
    return this.service.create(userId, dto);
  }

  @Get()
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar CPRs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  async findAll(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(10), ParseIntPipe) perPage: number,
  ) {
    const safePage = Math.max(1, page);
    const safePerPage = Math.min(100, Math.max(1, perPage));
    return this.service.findAll(userId, role, safePage, safePerPage);
  }

  @Get(':id')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Buscar CPR por ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.findOne(id, userId, role);
  }

  @Get(':id/document')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Gerar minuta imprimível da CPR (HTML)' })
  async getDocument(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.getDocumentHtml(id, userId, role);
  }

  @Patch(':id')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar CPR (apenas rascunhos)' })
  async update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateCprDto,
  ) {
    return this.service.update(id, userId, role, dto);
  }

  @Delete(':id')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancelar / remover CPR' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.delete(id, userId, role);
  }

  // ─── Fluxo de vida ────────────────────────────────────────────────────────

  @Post(':id/emit')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Emitir CPR',
    description: 'Muda status de RASCUNHO para EMITIDA e gera número único da CPR.',
  })
  async emit(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.emit(id, userId, role);
  }

  @Post(':id/signature/request')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Solicitar assinatura eletrônica (gera links de emitente e credor)' })
  async requestSignature(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.requestSignature(id, userId, role);
  }

  @Get(':id/signature')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Status da assinatura da CPR' })
  async signatureStatus(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.getSignatureStatus(id, userId, role);
  }

  @Get(':id/signed-file')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Link do PDF assinado da CPR' })
  async signedFile(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.getSignedFileUrl(id, userId, role);
  }

  @Post(':id/register')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Registrar CPR em cartório' })
  async register(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body('cartorioNome') cartorioNome: string,
    @Body('cartorioRegistroNum') cartorioRegistroNum: string,
  ) {
    return this.service.register(id, userId, role, cartorioNome, cartorioRegistroNum);
  }

  @Post(':id/liquidate')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Liquidar CPR' })
  async liquidate(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.liquidate(id, userId, role);
  }
}
