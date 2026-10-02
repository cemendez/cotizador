import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthController } from './health.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { ClientsModule } from './clients/clients.module.js';
import { QuotesModule } from './quotes/quotes.module.js';
import { UsersModule } from './users/users.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { GENERAL_LIMIT } from './common/throttle-limits.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ...GENERAL_LIMIT }],
      errorMessage: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
      // Los tests e2e lo desactivan (hacen cientos de peticiones desde la misma IP)
      skipIf: () => process.env.THROTTLE_DISABLED === 'true',
    }),
    PrismaModule, AuthModule, ClientsModule, QuotesModule, UsersModule, DashboardModule],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule { }