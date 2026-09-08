import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as bcrypt from 'bcrypt';
import { RefreshJwtPayload } from '../interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';

const extractRefreshTokenFromBody = (req: Request): string | null => {
  return req.body?.refreshToken ?? null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractRefreshTokenFromBody]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: RefreshJwtPayload) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or has expired.');
    }

    // The raw JWT itself is never stored - only its bcrypt hash - so a leaked
    // database dump cannot be replayed as a valid session token.
    const rawToken = extractRefreshTokenFromBody(req) ?? '';
    const matches = await bcrypt.compare(rawToken, stored.tokenHash);
    if (!matches) {
      throw new UnauthorizedException('Refresh token is invalid or has expired.');
    }

    return { userId: payload.sub, email: payload.email, tokenId: payload.tokenId };
  }
}
