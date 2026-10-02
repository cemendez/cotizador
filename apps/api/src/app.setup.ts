import { ValidationPipe, type INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';

/** Configuración global de la app, compartida por main.ts y los test e2e */
export function configureApp(app: INestApplication) {
    const trustedProxies = Number(process.env.TRUST_PROXY ?? 0);
    if (trustedProxies > 0) {
        app.getHttpAdapter().getInstance().set('trust proxy', trustedProxies);
    }
    app.setGlobalPrefix('api');
    app.enableCors({ origin: process.env.WEB_ORIGIN, credentials: true });
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
}