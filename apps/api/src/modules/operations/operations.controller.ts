import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OperationsService } from './operations.service';
import { CreateOperationDto } from './dto/create-operation.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('operations')
@ApiBearerAuth()
@Controller('operations')
@UseGuards(RolesGuard)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Post()
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar nova operação de crédito' })
  async create(@CurrentUser('sub') userId: string, @Body() data: CreateOperationDto) {
    return this.operationsService.create(userId, data);
  }

  @Get('available')
  @Roles(UserRole.FINANCIAL_INSTITUTION, UserRole.CREDIT_ANALYST, UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Deal flow: operações disponíveis para instituições financeiras' })
  async findAvailable(
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.operationsService.findAvailable(page, perPage);
  }

  @Get()
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar operações do produtor' })
  async findAll(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
    @Query('status') status?: string,
  ) {
    return this.operationsService.findAll(userId, page, perPage, role, status);
  }

  @Get('proposals')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Propostas recebidas pelo produtor' })
  async getProposals(@CurrentUser('sub') userId: string) {
    return this.operationsService.getUserProposals(userId);
  }

  @Get('portfolio')
  @Roles(UserRole.FINANCIAL_INSTITUTION, UserRole.ADMIN)
  @ApiOperation({ summary: 'Portfólio de propostas da instituição financeira' })
  async getPartnerPortfolio(@CurrentUser('sub') userId: string) {
    return this.operationsService.getPartnerPortfolio(userId);
  }

  @Post('proposals')
  @Roles(UserRole.FINANCIAL_INSTITUTION, UserRole.ADMIN)
  @ApiOperation({ summary: 'Instituição financeira envia proposta para uma operação' })
  async createProposal(
    @CurrentUser('sub') userId: string,
    @Body() data: CreateProposalDto,
  ) {
    return this.operationsService.createProposal(userId, data);
  }

  @Patch('proposals/:id/accept')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Produtor aceita uma proposta' })
  async acceptProposal(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.operationsService.acceptProposal(id, userId, role, body?.reason);
  }

  @Patch('proposals/:id/reject')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Produtor recusa uma proposta' })
  async rejectProposal(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.operationsService.rejectProposal(id, userId, role, body?.reason);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar operação' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.operationsService.findById(id, userId, role);
  }

  @Patch(':id/submit')
  @Roles(UserRole.PRODUCER, UserRole.COMPANY)
  @ApiOperation({ summary: 'Submeter operação para análise' })
  async submit(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.operationsService.submit(id, userId);
  }
}
