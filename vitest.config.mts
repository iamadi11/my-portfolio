import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/** Unit tests for app models (`npm test`). Only `src/`; the skill's own scripts use `node --test`. */
export default defineConfig({
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
