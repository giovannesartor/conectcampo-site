import { Body, Controller, Get, Headers, Ip, Post, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AppleIdentityService } from './apple-identity.service';
import { AppleAuthDto, AppleDeleteDto, AppleLinkDto } from './dto/apple-auth.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('auth/apple')
export class AppleAuthController {
  constructor(private readonly apple: AppleIdentityService, private readonly auth: AuthService, private readonly prisma: PrismaService) {}

  @Public() @Get('config')
  config() { return { available: this.apple.available, platform: 'ios', minimumBuild: 6 }; }

  @Public() @Post('challenge') @Throttle({ default: { ttl: 60000, limit: 10 } })
  challenge() { return this.apple.challenge('AUTH'); }

  @Public() @Post('authenticate') @Throttle({ default: { ttl: 60000, limit: 10 } })
  authenticate(@Body() dto: AppleAuthDto, @Ip() ip: string, @Headers('user-agent') userAgent: string) { return this.auth.appleAuthenticate(dto, { ip, userAgent }); }

  @UseGuards(JwtAuthGuard) @Get('connection')
  async connection(@Request() req: any) {
    const [identity, user] = await Promise.all([
      this.prisma.appleIdentity.findUnique({ where: { userId: req.user.sub }, select: { id: true } }),
      this.prisma.user.findUnique({ where: { id: req.user.sub }, select: { passwordEnabled: true } }),
    ]);
    return { linked: !!identity, passwordEnabled: user?.passwordEnabled ?? true, available: this.apple.available };
  }

  @UseGuards(JwtAuthGuard) @Post('link/challenge') @Throttle({ default: { ttl: 60000, limit: 5 } })
  linkChallenge(@Request() req: any) { return this.apple.challenge('LINK', req.user.sub); }

  @UseGuards(JwtAuthGuard) @Post('link') @Throttle({ default: { ttl: 60000, limit: 5 } })
  link(@Request() req: any, @Body() dto: AppleLinkDto) { return this.auth.appleLink(req.user.sub, dto); }

  @UseGuards(JwtAuthGuard) @Post('delete/challenge') @Throttle({ default: { ttl: 60000, limit: 5 } })
  deleteChallenge(@Request() req: any) { return this.apple.challenge('DELETE', req.user.sub); }

  @UseGuards(JwtAuthGuard) @Post('delete-account') @Throttle({ default: { ttl: 60000, limit: 5 } })
  delete(@Request() req: any, @Body() dto: AppleDeleteDto, @Ip() ip: string, @Headers('user-agent') userAgent: string) { return this.auth.deleteWithApple(req.user.sub, dto, { ip, userAgent }); }
}
