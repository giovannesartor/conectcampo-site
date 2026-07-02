import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MarketplaceOrdersService } from './marketplace-orders.service';
import { CreateOrderDto, ShipOrderDto, DisputeOrderDto, CreateReviewDto, SellerKycDto } from './dto/order.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ALL_ROLES } from '../../common/constants/roles';
import { UserRole } from '@prisma/client';

@ApiTags('marketplace-orders')
@ApiBearerAuth()
@Controller('marketplace/orders')
@UseGuards(RolesGuard)
@Roles(...ALL_ROLES)
export class MarketplaceOrdersController {
  constructor(private readonly service: MarketplaceOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Meus pedidos (compras e vendas)' })
  listMine(@CurrentUser('sub') userId: string) {
    return this.service.listMine(userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumo financeiro dos pedidos' })
  summary(@CurrentUser('sub') userId: string) {
    return this.service.summary(userId);
  }

  @Get('fees')
  @ApiOperation({ summary: 'Prévia do detalhamento de taxas (1% ConectCampo)' })
  @ApiQuery({ name: 'subtotal', required: true, type: Number })
  fees(@Query('subtotal') subtotal: string) {
    return this.service.computeFees(Number(subtotal) || 0);
  }

  @Get('reputation/:userId')
  @ApiOperation({ summary: 'Reputação e avaliações de um usuário' })
  reputation(@Param('userId') userId: string) {
    return this.service.getReputation(userId);
  }

  @Get('kyc')
  @ApiOperation({ summary: 'Status de KYC do vendedor (chave PIX)' })
  getKyc(@CurrentUser('sub') userId: string) {
    return this.service.getSellerKyc(userId);
  }

  @Patch('kyc')
  @ApiOperation({ summary: 'Cadastrar/atualizar chave PIX do vendedor (KYC)' })
  updateKyc(@CurrentUser('sub') userId: string, @Body() dto: SellerKycDto) {
    return this.service.updateSellerKyc(userId, dto);
  }

  @Get('admin/disputes')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Fila de disputas' })
  adminDisputes() {
    return this.service.adminListDisputes();
  }

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Criar pedido de compra e gerar link de pagamento (ValsaPay, em custódia)' })
  create(@CurrentUser('sub') buyerId: string, @Body() dto: CreateOrderDto) {
    return this.service.createOrder(buyerId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar pedido' })
  getOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.getOwned(id, userId, role);
  }

  @Patch(':id/ship')
  @ApiOperation({ summary: '[Vendedor] Marcar como enviado/entregue' })
  ship(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: ShipOrderDto,
  ) {
    return this.service.markShipped(id, userId, role, dto.shippingInfo);
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: '[Comprador] Confirmar recebimento e liberar valor ao vendedor' })
  confirm(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.confirmReceipt(id, userId, role);
  }

  @Patch(':id/dispute')
  @ApiOperation({ summary: '[Comprador] Abrir disputa' })
  dispute(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: DisputeOrderDto,
  ) {
    return this.service.openDispute(id, userId, role, dto.reason);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar pedido (antes do pagamento)' })
  cancel(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.cancel(id, userId, role);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Avaliar a outra parte após pedido concluído' })
  review(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.service.createReview(id, userId, role, dto);
  }

  @Patch(':id/payout')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Confirmar repasse ao vendedor' })
  payout(@Param('id') id: string) {
    return this.service.markPaidOut(id);
  }

  @Patch(':id/refund')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Reembolsar comprador' })
  refund(@Param('id') id: string) {
    return this.service.refund(id);
  }
}
