import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      // Environment variables for production
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    build: {
      // Performance optimizations
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor dependencies
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('recharts')) {
                return 'vendor-charts';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('@playwright')) {
                return 'vendor-testing';
              }
              return 'vendor-libs';
            }
            
            // App code splitting
            if (id.includes('/views/')) {
              if (id.includes('AdvancedAnalyticsView') || id.includes('SimulationView')) {
                return 'views-heavy';
              }
              if (id.includes('AIView') || id.includes('NewsView')) {
                return 'views-ai';
              }
              return 'views-core';
            }
            
            if (id.includes('/components/')) {
              if (id.includes('Modal') || id.includes('Detail')) {
                return 'components-modals';
              }
              if (id.includes('Chart') || id.includes('Analytics')) {
                return 'components-charts';
              }
              return 'components-core';
            }
            
            if (id.includes('/services/') || id.includes('/utils/')) {
              return 'app-utils';
            }
          },
          // Optimize asset filenames with better cache headers
          assetFileNames: (assetInfo) => {
            const extType = assetInfo.name.split('.').pop();
            if (/\.(png|jpe?g|gif|svg|ico|webp)$/i.test(assetInfo.name)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        }
      },
      // Production optimizations
      sourcemap: mode === 'production' ? false : 'hidden',
      minify: mode === 'production' ? 'esbuild' : false,
      target: 'es2020',
      // Optimize chunk sizes for better caching
      chunkSizeWarningLimit: 1000,
      // Enable CSS code splitting for better caching
      cssCodeSplit: true,
      // Clean dist folder
      emptyOutDir: true,
      // Optimize asset inlining threshold
      assetsInlineLimit: 4096,
      // Enable compression reporting
      reportCompressedSize: true,
      // Output options for better tree shaking
      write: true,
      // Enable modern JavaScript features for supported browsers
      lib: undefined
    },
    server: {
      port: 3000,
      open: true,
      cors: true,
      // Health check endpoint
      proxy: mode === 'development' ? {
        '/health': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              if (req.url === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
              }
            });
          },
        },
      } : undefined
    },
    preview: {
      port: 3000,
      cors: true
    },
    // PWA and caching optimizations
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    }
  }
})