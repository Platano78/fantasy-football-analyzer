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
      // Enhanced performance optimizations
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Critical path optimization - separate by loading priority
            
            // Vendor dependencies with size-based chunking
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react'; // ~45KB - Critical
              }
              if (id.includes('recharts')) {
                return 'vendor-charts'; // ~85KB - Heavy, load on demand
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons'; // ~15KB - Frequent use
              }
              if (id.includes('@google/generative-ai')) {
                return 'vendor-ai'; // ~25KB - AI features only
              }
              if (id.includes('@playwright') || id.includes('vitest')) {
                return 'vendor-testing'; // Testing libs - should be tree-shaken in prod
              }
              // Group smaller utilities together
              if (id.includes('date-fns') || id.includes('lodash') || id.includes('ramda')) {
                return 'vendor-utils';
              }
              return 'vendor-misc';
            }
            
            // Smart view chunking based on usage patterns
            if (id.includes('/views/')) {
              // Heavy analytics views - lazy load
              if (id.includes('AdvancedAnalyticsView') || id.includes('SimulationView')) {
                return 'views-analytics'; // ~65KB
              }
              // AI-powered views - separate chunk for AI features
              if (id.includes('AIView') || id.includes('NewsView')) {
                return 'views-ai'; // ~45KB
              }
              // Core draft views - priority load
              if (id.includes('DraftView') || id.includes('ComparisonView') || id.includes('RankingsView')) {
                return 'views-core'; // ~55KB - High priority
              }
              // Secondary views
              if (id.includes('LiveDataView') || id.includes('TrackerView')) {
                return 'views-live'; // ~35KB
              }
              return 'views-misc';
            }
            
            // Component chunking by usage frequency and size
            if (id.includes('/components/')) {
              // Heavy modals and detailed views
              if (id.includes('Modal') || id.includes('Detail') || id.includes('Comparison')) {
                return 'components-modals'; // ~40KB - Load on interaction
              }
              // Chart and visualization components
              if (id.includes('Chart') || id.includes('Analytics') || id.includes('Performance')) {
                return 'components-viz'; // ~30KB - Analytics features
              }
              // AI-related components
              if (id.includes('AI') || id.includes('Chat') || id.includes('Coach')) {
                return 'components-ai'; // ~35KB - AI features
              }
              // Core UI components - bundle with main app
              if (id.includes('Button') || id.includes('Input') || id.includes('Navigation') ||
                  id.includes('Layout') || id.includes('Header') || id.includes('Filter')) {
                return undefined; // Include in main bundle for immediate availability
              }
              return 'components-secondary';
            }
            
            // Service layer chunking
            if (id.includes('/services/')) {
              if (id.includes('AI') || id.includes('Gemini') || id.includes('OpenAI')) {
                return 'services-ai';
              }
              if (id.includes('ESPN') || id.includes('API') || id.includes('Data')) {
                return 'services-api';
              }
              return 'services-core';
            }
            
            // Utilities and helpers
            if (id.includes('/utils/') || id.includes('/hooks/')) {
              if (id.includes('performance') || id.includes('monitoring') || id.includes('cache')) {
                return 'utils-performance';
              }
              if (id.includes('virtual') || id.includes('optimization') || id.includes('memory')) {
                return 'utils-optimization';
              }
              return 'utils-core';
            }
            
            // Context and state management
            if (id.includes('/contexts/') || id.includes('/store/')) {
              return undefined; // Keep with main bundle for immediate state availability
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