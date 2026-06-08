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
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN)
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

  // ─── Projects ─────────────────────────────────────────────────────────────

  @Post('projects')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar projeto de crédito de carbono' })
  async createProject(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateCarbonProjectDto,
  ) {
    return this.service.createProject(userId, dto);
  }

  @Get('projects')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar projetos de carbono' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  async findProjects(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(10), ParseIntPipe) perPage: number,
  ) {
    return this.service.findAllProjects(userId, role, page, perPage);
  }

  @Get('projects/:id')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Detalhar projeto de carbono' })
  async findProjectById(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.findProjectById(id, userId, role);
  }

  @Patch('projects/:id/status')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN)
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
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN)
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
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN)
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
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN)
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
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN)
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
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar créditos do projeto' })
  async getCredits(
    @Param('id') projectId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.getCredits(projectId, userId, role);
  }

  @Post('credits/:creditId/transact')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Registrar transação de crédito (venda, aposentadoria, transferência)' })
  async transactCredit(
    @Param('creditId') creditId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: TransactCreditsDto,
  ) {
    return this.service.transactCredit(creditId, userId, role, dto);
  }
}
