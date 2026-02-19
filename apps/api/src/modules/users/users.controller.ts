import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obter perfil do usuário logado' })
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualizar perfil' })
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() data: { name?: string; phone?: string },
  ) {
    return this.usersService.updateProfile(userId, data);
  }
}
