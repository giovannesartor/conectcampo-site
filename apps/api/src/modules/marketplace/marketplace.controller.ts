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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MarketplaceService } from './marketplace.service';
import {
  CreateGrainListingDto,
  UpdateGrainListingDto,
} from './dto/grain-listing.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ALL_ROLES } from '../../common/constants/roles';

@ApiTags('marketplace')
@ApiBearerAuth()
@Controller('marketplace')
@UseGuards(RolesGuard)
@Roles(...ALL_ROLES)
export class MarketplaceController {
  constructor(private readonly service: MarketplaceService) {}

  @Get()
  @ApiOperation({ summary: 'Vitrine de ofertas de grãos (todas ativas)' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'product', required: false })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'page', required: false, description: 'Habilita paginação (envelope { data, meta })' })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiResponse({ status: 200, description: 'Array de ofertas, ou { data, meta } quando paginado' })
  browse(
    @Query('type') type?: string,
    @Query('product') product?: string,
    @Query('state') state?: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.service.browse({ type, product, state, page, perPage });
  }

  @Get('mine')
  @ApiOperation({ summary: 'Minhas ofertas' })
  findMine(@CurrentUser('sub') userId: string, @CurrentUser('role') role: string) {
    return this.service.findMine(userId, role);
  }

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 15 } })
  @ApiOperation({ summary: 'Publicar oferta de grãos' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateGrainListingDto) {
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar oferta' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateGrainListingDto,
  ) {
    return this.service.update(id, userId, role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover oferta' })
  remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.remove(id, userId, role);
  }
}
