import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts', 'ui/src/**/*.test.ts'],
    testTimeout: 20000,
    coverage: {
      provider: 'v8',
      include: ['src/core/**', 'src/mcp/**', 'src/http/**'],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 80,
        'src/core/**': { lines: 80, statements: 80, functions: 80, branches: 80 },
        'src/mcp/**': { lines: 80, statements: 80, functions: 80, branches: 80 },
        'src/http/**': { lines: 80, statements: 80, functions: 80, branches: 80 },
      },
    },
  },
});
