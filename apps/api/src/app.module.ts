import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthController } from './health.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { ClientsModule } from './clients/clients.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, ClientsModule],
  controllers: [HealthController]
})
export class AppModule { }