import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import type { AuthUser } from './auth.types.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

const REFRESH_COOKIE = 'refresh_token';
const COOKIE_PATH = '/api/auth';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly auth: AuthService,
        private readonly config: ConfigService,
    ) { }

    @Public()
    @Post('register')
    async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
        const { refreshToken, ...result } = await this.auth.register(dto);
        this.setRefreshCookie(res, refreshToken);
        return result;
    }

    @Public()
    @Post('login')
    @HttpCode(200)
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { refreshToken, ...result } = await this.auth.login(dto);
        this.setRefreshCookie(res, refreshToken);
        return result;
    }

    @Public()
    @Post('refresh')
    @HttpCode(200)
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const { refreshToken, ...result } = await this.auth.refresh(req.cookies?.[REFRESH_COOKIE]);
        this.setRefreshCookie(res, refreshToken);
        return result;
    }

    @Public()
    @Post('logout')
    @HttpCode(204)
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
        res.clearCookie(REFRESH_COOKIE, { path: COOKIE_PATH });
    }

    @Get('me')
    me(@CurrentUser() user: AuthUser) {
        return this.auth.me(user.id);
    }

    private setRefreshCookie(res: Response, token: string) {
        res.cookie(REFRESH_COOKIE, token, {
            httpOnly: true,
            secure: this.config.get('NODE_ENV') === 'production',
            sameSite: 'lax',
            path: COOKIE_PATH, // la cookie solo viaja a las rutas de auth, no a toda la API
            maxAge: Number(this.config.get('REFRESH_TTL_DAYS', 7)) * 24 * 60 * 60 * 1000,
        });
    }
}