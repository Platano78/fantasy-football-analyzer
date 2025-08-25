import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/server/**'  // Exclude server tests that use jest
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ]
    },
    // Timeout for tests
    testTimeout: 10000,
    // Mock WebSocket and other browser APIs
    env: {
      NODE_ENV: 'test'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Mock environment variables for tests
    __APP_VERSION__: JSON.stringify('test-version'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  }
})