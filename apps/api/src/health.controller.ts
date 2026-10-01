import { Controller, Get } from '@nestjs/common'
import { Public } from './auth/decorators/public.decorator.js';
import { PrismaService } from './prisma/prisma.service.js'

@Public()
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
}