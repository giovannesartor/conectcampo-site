import { Body, Controller, Get, Headers, Ip, Post, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { GoogleIdentityService } from './google-identity.service';
import { GoogleAuthDto, GoogleLinkDto } from './dto/google-auth.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('auth/google')
export class GoogleAuthController {
  constructor(private readonly google: GoogleIdentityService, private readonly auth: AuthService, private readonly prisma: PrismaService) {}
  @Public() @Get('config')
  config() { return { available: this.google.available, clientId: this.google.available ? this.google.clientId : null, platform: 'web' }; }
  @Public() @Post('challenge') @Throttle({ default: { ttl: 60000, limit: 10 } })
  challenge() { return this.google.challenge('AUTH'); }
  @Public() @Post('authenticate') @Throttle({ default: { ttl: 60000, limit: 10 } })
  authenticate(@Body() dto: GoogleAuthDto, @Ip() ip: string, @Headers('user-agent') userAgent: string) { return this.auth.googleAuthenticate(dto, { ip, userAgent }); }
  @UseGuards(JwtAuthGuard) @Get('connection')
  async connection(@Request() req: any) {
    const [identity, user] = await Promise.all([
      this.prisma.googleIdentity.findUnique({ where: { userId: req.user.sub }, select: { id: true } }),
      this.prisma.user.findUnique({ where: { id: req.user.sub }, select: { passwordEnabled: true } }),
    ]);
    return { linked: !!identity, passwordEnabled: user?.passwordEnabled ?? true, available: this.google.available };
  }
  @UseGuards(JwtAuthGuard) @Post('link/challenge') @Throttle({ default: { ttl: 60000, limit: 5 } })
  linkChallenge(@Request() req: any) { return this.google.challenge('LINK', req.user.sub); }
  @UseGuards(JwtAuthGuard) @Post('link') @Throttle({ default: { ttl: 60000, limit: 5 } })
  link(@Request() req: any, @Body() dto: GoogleLinkDto) { return this.auth.googleLink(req.user.sub, dto); }
}
