// PM2 Ecosystem Configuration for Gemini Advanced Bridge Server
// Production-ready process management configuration

module.exports = {
  apps: [
    {
      // Application configuration
      name: 'gemini-bridge-server',
      script: 'server.js',
      
      // Process management
      instances: process.env.CLUSTER_WORKERS || 'max', // Use all CPU cores
      exec_mode: 'cluster',
      
      // Auto restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '512M',
      
      // Logging configuration
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Environment variables for development
      env: {
        NODE_ENV: 'development',
        BRIDGE_HOST: 'localhost',
        BRIDGE_PORT: 3001,
        LOG_LEVEL: 'debug',
        CORS_ORIGINS: 'http://localhost:5173,http://localhost:3000',
        GEMINI_ENDPOINTS: 'http://localhost:8000,http://localhost:8001',
        ENABLE_METRICS: 'true',
        REQUIRE_API_KEY: 'false'
      },
      
      // Environment variables for production
      env_production: {
        NODE_ENV: 'production',
        BRIDGE_HOST: '0.0.0.0',
        BRIDGE_PORT: 3001,
        LOG_LEVEL: 'info',
        CORS_ORIGINS: process.env.CORS_ORIGINS || 'https://your-fantasy-app.com',
        GEMINI_ENDPOINTS: process.env.GEMINI_ENDPOINTS || 'http://localhost:8000',
        ENABLE_METRICS: 'true',
        REQUIRE_API_KEY: 'true',
        API_KEY: process.env.API_KEY,
        HEALTH_CHECK_INTERVAL: '60000',
        REQUEST_TIMEOUT: '120000'
      },
      
      // Environment variables for staging
      env_staging: {
        NODE_ENV: 'staging',
        BRIDGE_HOST: '0.0.0.0',
        BRIDGE_PORT: 3001,
        LOG_LEVEL: 'debug',
        CORS_ORIGINS: 'https://staging.your-fantasy-app.com',
        GEMINI_ENDPOINTS: 'http://staging-gemini:8000',
        ENABLE_METRICS: 'true',
        REQUIRE_API_KEY: 'true',
        API_KEY: process.env.STAGING_API_KEY
      },
      
      // Monitoring and health checks
      watch: false, // Set to true for development
      ignore_watch: [
        'node_modules',
        'logs',
        'coverage',
        '*.test.js'
      ],
      
      // Advanced configuration
      node_args: [
        '--max-old-space-size=512',  // Limit memory usage
        '--optimize-for-size',       // Optimize for memory usage
        '--gc-interval=100'          // Garbage collection interval
      ],
      
      // Graceful shutdown
      kill_timeout: 5000,
      
      // Source map support
      source_map_support: true,
      
      // Disable automatic restarts during specific times (optional)
      cron_restart: '0 2 * * *', // Restart daily at 2 AM
      
      // Custom startup script (optional)
      // script: './start.sh',
      
      // Instance-specific configuration
      increment_var: 'PORT',
      
      // Health monitoring
      health_check_url: 'http://localhost:3001/health',
      health_check_grace_period: 30000,
      
      // Error handling
      panic: false,
      pmx: false,
      
      // Custom environment variables per instance
      env_file: './.env'
    }
  ],

  // Deployment configuration
  deploy: {
    // Production deployment
    production: {
      user: 'deploy',
      host: ['your-production-server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/your-org/fantasy-football-analyzer.git',
      path: '/var/www/gemini-bridge',
      
      // Pre-deploy commands
      'pre-deploy-local': '',
      
      // Post-receive commands
      'post-deploy': 'cd server/gemini-bridge && npm install && pm2 reload ecosystem.config.js --env production',
      
      // Pre-setup commands
      'pre-setup': '',
      
      // Post-setup commands
      'post-setup': 'ls -la',
      
      // Environment variables
      env: {
        NODE_ENV: 'production'
      }
    },

    // Staging deployment
    staging: {
      user: 'deploy',
      host: ['your-staging-server.com'],
      ref: 'origin/develop',
      repo: 'https://github.com/your-org/fantasy-football-analyzer.git',
      path: '/var/www/gemini-bridge-staging',
      'post-deploy': 'cd server/gemini-bridge && npm install && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};

// Alternative configuration for different scenarios
const alternativeConfigs = {
  // High-performance configuration
  highPerformance: {
    name: 'gemini-bridge-hp',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: [
      '--max-old-space-size=1024',
      '--optimize-for-size',
      '--trace-gc'
    ],
    env: {
      NODE_ENV: 'production',
      ENABLE_CACHING: 'true',
      CACHE_TTL: '600000',
      MAX_CONCURRENT_CONNECTIONS: '2000'
    }
  },

  // Development configuration
  development: {
    name: 'gemini-bridge-dev',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: true,
    ignore_watch: ['node_modules', 'logs'],
    env: {
      NODE_ENV: 'development',
      LOG_LEVEL: 'debug',
      ENABLE_METRICS: 'true'
    }
  },

  // Testing configuration
  testing: {
    name: 'gemini-bridge-test',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'test',
      BRIDGE_PORT: 3002,
      LOG_LEVEL: 'error',
      ENABLE_METRICS: 'false'
    }
  }
};

// Export alternative configurations if needed
// module.exports.alternativeConfigs = alternativeConfigs;