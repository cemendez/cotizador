import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { hash, verify } from '@node-rs/argon2';
import { createHash, randomBytes } from 'node:crypto'
import { PrismaService } from '../prisma/prisma.service.js'
import { LoginDto } from './dto/login.dto.js'
import { RegisterDto } from './dto/register.dto.js'

const publicUser = {
    id: true,
    email: true,
    name: true,
    businessName: true,
    rfc: true,
    createdAt: true,
} as const;

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
        private readonly config: ConfigService,
    ) { }

    async register(dto: RegisterDto) {
        const email = dto.email.toLowerCase().trim();
        const exists = await this.prisma.user.findUnique({ where: { email } });
        if (exists) throw new ConflictException('El correo ya está registrado');

        const user = await this.prisma.user.create({
            data: { email, name: dto.name.trim(), passwordHash: await hash(dto.password) },
            select: publicUser,
        })

        return { user, ...(await this.issueTokens(user.id, user.email)) };
    }

    async login(dto: LoginDto) {
        const email = dto.email.toLowerCase().trim()
        const found = await this.prisma.user.findUnique({ where: { email } })

        if (!found || !(await verify(found.passwordHash, dto.password))) {
            throw new UnauthorizedException('Credenciales inválidas')
        }

        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: found.id }, select: publicUser });
        return { user, ...(await this.issueTokens(user.id, user.email)) }
    }

    async refresh(rawToken?: string) {
        if (!rawToken) throw new UnauthorizedException('Sesión no encontrada');

        const stored = await this.prisma.refreshToken.findUnique({
            where: { tokenHash: this.hashToken(rawToken) },
            include: { user: { select: publicUser } },
        });

        if (!stored || stored.expiresAt < new Date()) {
            throw new UnauthorizedException('Sesión expirada');
        }

        // Token ya revocado que se vuelve a usar: posible robo, cerramos todas las sesiones
        if (stored.revokedAt) {
            await this.prisma.refreshToken.updateMany({
                where: { userId: stored.userId, revokedAt: null },
                data: { revokedAt: new Date() },
            });
            throw new UnauthorizedException('Sesión inválida');
        }

        // Revocación atómica: si dos peticiones llegan al mismo tiempo, solo una gana
        const claimed = await this.prisma.refreshToken.updateMany({
            where: { id: stored.id, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        if (claimed.count === 0) throw new UnauthorizedException('Sesión inválida');

        return { user: stored.user, ...(await this.issueTokens(stored.user.id, stored.user.email)) };
    }

    async logout(rawToken?: string) {
        if (!rawToken) return;
        await this.prisma.refreshToken.updateMany({
            where: { tokenHash: this.hashToken(rawToken), revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }

    me(userId: string) {
        return this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: publicUser });
    }

    private async issueTokens(userId: string, email: string) {
        const accessToken = await this.jwt.signAsync({ sub: userId, email });
        const refreshToken = randomBytes(48).toString('base64url');
        const days = Number(this.config.get('REFRESH_TTL_DAYS', 7));

        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash: this.hashToken(refreshToken),
                expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
            },
        });

        return { accessToken, refreshToken };
    }

    private hashToken(token: string) {
        return createHash('sha256').update(token).digest('hex');
    }
}