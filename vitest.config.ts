// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Other configurations
    coverage: {
      provider: 'istanbul', // Use istanbul for coverage
      reporter: ['text', 'json', 'html'], // Reporters: text, json, and HTML
      all: true, // Collect coverage from all files
    },
  },
});
