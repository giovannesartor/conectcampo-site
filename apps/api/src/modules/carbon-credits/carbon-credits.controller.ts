import {
  Controller,
  Post,
  Get,
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
import { CarbonCreditsService } from './carbon-credits.service';
import { CreateCarbonProjectDto } from './dto/create-carbon-project.dto';
import { CreateCarbonInventoryDto } from './dto/create-carbon-inventory.dto';
import { IssueCreditsDto } from './dto/issue-credits.dto';
import { TransactCreditsDto } from './dto/transact-credits.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { CarbonProjectStatus } from './carbon-enums';

@ApiTags('carbon-credits')
@ApiBearerAuth()
@Controller('carbon-credits')
@UseGuards(RolesGuard)
export class CarbonCreditsController {
  constructor(private readonly service: CarbonCreditsService) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────

  @Get('dashboard')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Resumo executivo de Crédito de Carbono do produtor' })
  async getDashboard(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.getDashboardSummary(userId, role);
  }

  @Get('market-prices')
  @ApiOperation({ summary: 'Preços de referência do mercado de carbono' })
  async getMarketPrices() {
    return this.service.getMarketPrices();
  }

  @Get('featured-projects')
  @ApiOperation({ summary: 'Projetos brasileiros em destaque (com imagem de satélite)' })
  async getFeaturedProjects() {
    return this.service.getFeaturedProjects();
  }

  // ─── Projects ─────────────────────────────────────────────────────────────

  @Post('projects')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar projeto de crédito de carbono' })
  async createProject(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateCarbonProjectDto,
  ) {
    return this.service.createProject(userId, dto);
  }

  @Get('projects')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar projetos de carbono' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  async findProjects(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(10), ParseIntPipe) perPage: number,
  ) {
    const safePage = Math.max(1, page);
    const safePerPage = Math.min(100, Math.max(1, perPage));
    return this.service.findAllProjects(userId, role, safePage, safePerPage);
  }

  @Get('projects/:id')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Detalhar projeto de carbono' })
  async findProjectById(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.findProjectById(id, userId, role);
  }

  @Patch('projects/:id/status')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar status do projeto' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body('status') status: CarbonProjectStatus,
  ) {
    return this.service.updateProjectStatus(id, userId, role, status);
  }

  @Delete('projects/:id')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancelar / excluir projeto (soft delete)' })
  async deleteProject(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.deleteProject(id, userId, role);
  }

  // ─── Inventory ────────────────────────────────────────────────────────────

  @Post('projects/:id/inventories')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Adicionar inventário de emissões ao projeto' })
  async addInventory(
    @Param('id') projectId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: CreateCarbonInventoryDto,
  ) {
    return this.service.addInventory(projectId, userId, role, dto);
  }

  @Get('projects/:id/inventories')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar inventários do projeto' })
  async getInventories(
    @Param('id') projectId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.getInventories(projectId, userId, role);
  }

  // ─── Credits ──────────────────────────────────────────────────────────────

  @Post('projects/:id/credits/issue')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Emitir créditos de carbono para o projeto' })
  async issueCredits(
    @Param('id') projectId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: IssueCreditsDto,
  ) {
    return this.service.issueCredits(projectId, userId, role, dto);
  }

  @Get('projects/:id/credits')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar créditos do projeto' })
  async getCredits(
    @Param('id') projectId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.getCredits(projectId, userId, role);
  }

  @Post('credits/:creditId/transact')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Registrar transação de crédito (venda, aposentadoria, transferência)' })
  async transactCredit(
    @Param('creditId') creditId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: TransactCreditsDto,
  ) {
    return this.service.transactCredit(creditId, userId, role, dto);
  }

  // ─── Setup Fee ────────────────────────────────────────────────────────────

  @Post('projects/:id/setup-fee')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Gerar cobrança de setup carbono (R$ 5.000 + 6% ConectCampo)',
    description: 'Cria a cobrança única de onboarding do projeto de carbono via Asaas. Retorna link de pagamento (PIX/boleto/cartão).',
  })
  async chargeSetupFee(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.chargeSetupFee(id, userId, role);
  }

  @Patch('projects/:id/setup-fee/confirm')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Confirmar manualmente o pagamento do setup fee' })
  async confirmSetupFee(@Param('id') id: string) {
    return this.service.confirmSetupFee(id);
  }

  @Patch('projects/:id/setup-fee/waive')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Isentar projeto do setup fee' })
  async waiveSetupFee(@Param('id') id: string) {
    return this.service.waiveSetupFee(id);
  }
}
