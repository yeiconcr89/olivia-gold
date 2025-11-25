import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // Frontend unit tests
  {
    extends: './vitest.config.ts',
    test: {
      name: 'frontend-unit',
      include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
      exclude: ['backend/**', 'node_modules/**', 'tests/**'],
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
    },
  },

  // API/Backend tests
  {
    test: {
      name: 'backend-unit',
      include: ['backend/**/*.{test,spec}.{js,ts}'],
      environment: 'node',
      setupFiles: ['./backend/src/test-setup.ts'],
      globals: true,
    },
  },

  // Frontend integration tests (mock external API calls)
  {
    extends: './vitest.config.ts',
    test: {
      name: 'frontend-integration',
      include: ['tests/api/*.{test,spec}.{js,ts}'],
      environment: 'node',
      setupFiles: ['./src/setupTests.ts'],
      globals: true,
      testTimeout: 30000,
    },
  },
]);