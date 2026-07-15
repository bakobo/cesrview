import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Served from the apex of a custom domain (cesrview.bakobo.com), so base is '/'.
export default defineConfig({
  base: '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    // jsdom environment setup alone runs several seconds; under coverage instrumentation a React
    // render can exceed vitest's 5s default and flake. Give jsdom tests generous headroom.
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      // main.tsx is the untestable DOM bootstrap; test files and setup are not product code.
      exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.test.{ts,tsx}'],
      thresholds: {
        // Bakobo standard: 100% branch coverage of new code (methodology.md §6).
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
});
