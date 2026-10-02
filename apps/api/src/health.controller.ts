import { Controller, Get, Req } from '@nestjs/common'
import { Public } from './auth/decorators/public.decorator.js';
import { PrismaService } from './prisma/prisma.service.js';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';

@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) { }

    @Get('live')
    live() {
        return { status: 'ok', commit: process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? 'local' };
    }

    @Get()
    async check() {
        await this.prisma.$queryRaw`SELECT 1`
        return { status: 'ok', db: `connected` }
    }

    @Get('ip')
    ip(@Req() req: Request) {
        return {
            ip: req.ip,
            forwardedFor: req.headers['x-forwarded-for'] ?? null,
            trustedProxies: process.env.TRUST_PROXY ?? '0',
        };
    }
}