import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
    // Mismo transformador que los tests unitarios (con metadatos de decoradores para NestJS)
    plugins: [swc.vite({ module: { type: 'es6' } })],
    test: {
        include: ['test/**/*.e2e-spec.ts'],
        globalSetup: ['./test/global-setup.ts'],
        setupFiles: ['./test/setup-env.ts'],
        fileParallelism: false, // una sola base de datos: los archivos corren uno tras otro
        testTimeout: 20_000,
        hookTimeout: 60_000,
    },
});