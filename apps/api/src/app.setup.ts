import { ValidationPipe, type INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';

/** Configuración global de la app, compartida por main.ts y los test e2e */
export function configureApp(app: INestApplication) {
    app.setGlobalPrefix('api');
    app.enableCors({ origin: process.env.WEB_ORIGIN, credentials: true });
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
}