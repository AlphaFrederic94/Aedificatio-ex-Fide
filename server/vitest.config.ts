import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 20000,
    hookTimeout: 20000,
    globals: true,
    environment: 'node',
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      lines: 0.85,
      functions: 0.85,
      branches: 0.75,
      statements: 0.85,
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
  },
})

