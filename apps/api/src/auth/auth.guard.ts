import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthUser, JwtPayload } from './auth.types.js';
import { IS_PUBLIC_KEY } from './decorators/public.decorator.js';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwt: JwtService,
        private readonly reflector: Reflector,
    ) { }

    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        if (isPublic) return true;

        const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
        const [type, token] = req.headers.authorization?.split(' ') ?? [];
        if (type !== 'Bearer' || !token) throw new UnauthorizedException('Token requerido');

        try {
            const payload = await this.jwt.verifyAsync<JwtPayload>(token);
            req.user = { id: payload.sub, email: payload.email };
            return true;
        } catch {
            throw new UnauthorizedException('Token inválido o expirado');
        }
    }
}