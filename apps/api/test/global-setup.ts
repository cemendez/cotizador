import { execSync } from 'node:child_process';
import { config } from 'dotenv';

export default function setup() {
    config({ path: '.env.test', override: true, quiet: true });
    const url = process.env.DATABASE_URL ?? '';

    // Red de seguridad: jamás correr los tests contra una base que no sea de pruebas
    if (!url.includes('_test')) {
        throw new Error(`Los tests e2e solo corren contra una base *_test. DATABASE_URL actual: ${url}`);
    }

    // migrate deploy aplica las migraciones existentes sin generar nuevas (igual que en producción)
    execSync('pnpm prisma migrate deploy', { stdio: 'inherit', env: process.env });
}