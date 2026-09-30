import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error: unknown) => {
  new Logger('Bootstrap').error('La aplicación no pudo iniciar', error instanceof Error ? error.stack : String(error));
  process.exit(1);
});