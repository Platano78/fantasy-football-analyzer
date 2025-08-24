// Environment Variable Management System
// Centralized configuration management for all environments

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface EnvironmentConfig {
  NODE_ENV: Environment;
  APP_VERSION: string;
  BUILD_TIME: string;
  
  // API Configuration
  ESPN_API_BASE_URL: string;
  ESPN_API_TIMEOUT: number;
  ESPN_API_RETRY_ATTEMPTS: number;
  
  // Gemini AI Configuration
  GEMINI_API_KEY?: string;
  GEMINI_MODEL: string;
  GEMINI_TIMEOUT: number;
  GEMINI_MAX_TOKENS: number;
  
  // Local Gemini Bridge Configuration
  LOCAL_GEMINI_URL: string;
  LOCAL_GEMINI_WS_URL: string;
  LOCAL_GEMINI_ENABLED: boolean;
  LOCAL_GEMINI_TIMEOUT: number;
  
  // Browser MCP Configuration
  BROWSER_MCP_ENABLED: boolean;
  BROWSER_MCP_TIMEOUT: number;
  BROWSER_MCP_RETRY_ATTEMPTS: number;
  BROWSER_MCP_RATE_LIMIT: number;
  
  // Caching Configuration
  CACHE_DEFAULT_TTL: number;
  CACHE_MAX_SIZE: number;
  CACHE_ENABLED: boolean;
  
  // Performance Monitoring
  PERFORMANCE_MONITORING_ENABLED: boolean;
  SENTRY_DSN?: string;
  ANALYTICS_ID?: string;
  RUM_ENABLED: boolean;
  
  // Feature Flags
  FEATURES: {
    ESPN_API: boolean;
    BROWSER_MCP: boolean;
    LOCAL_GEMINI: boolean;
    CLOUD_GEMINI: boolean;
    AI_COACHING: boolean;
    PERFORMANCE_MONITORING: boolean;
    REAL_TIME_DATA: boolean;
    MOBILE_OPTIMIZATION: boolean;
    DARK_MODE: boolean;
    OFFLINE_MODE: boolean;
  };
  
  // League Configuration
  DEFAULT_SCORING: 'standard' | 'ppr' | 'half_ppr';
  DEFAULT_LEAGUE_SIZE: number;
  DEFAULT_ROSTER_SIZE: number;
}

// Environment variable validation and type conversion
const parseBoolean = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
};

const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const parseString = (value: string | undefined, defaultValue: string): string => {
  return value || defaultValue;
};

// Environment-specific defaults
const getEnvironmentDefaults = (env: Environment): Partial<EnvironmentConfig> => {
  switch (env) {
    case 'development':
      return {
        ESPN_API_TIMEOUT: 10000,
        GEMINI_TIMEOUT: 30000,
        LOCAL_GEMINI_ENABLED: true,
        BROWSER_MCP_ENABLED: true,
        CACHE_DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
        PERFORMANCE_MONITORING_ENABLED: false,
        RUM_ENABLED: false,
        FEATURES: {
          ESPN_API: true,
          BROWSER_MCP: true,
          LOCAL_GEMINI: true,
          CLOUD_GEMINI: true,
          AI_COACHING: true,
          PERFORMANCE_MONITORING: false,
          REAL_TIME_DATA: true,
          MOBILE_OPTIMIZATION: true,
          DARK_MODE: true,
          OFFLINE_MODE: true,
        }
      };
      
    case 'staging':
      return {
        ESPN_API_TIMEOUT: 8000,
        GEMINI_TIMEOUT: 25000,
        LOCAL_GEMINI_ENABLED: true,
        BROWSER_MCP_ENABLED: true,
        CACHE_DEFAULT_TTL: 10 * 60 * 1000, // 10 minutes
        PERFORMANCE_MONITORING_ENABLED: true,
        RUM_ENABLED: true,
        FEATURES: {
          ESPN_API: true,
          BROWSER_MCP: true,
          LOCAL_GEMINI: true,
          CLOUD_GEMINI: true,
          AI_COACHING: true,
          PERFORMANCE_MONITORING: true,
          REAL_TIME_DATA: true,
          MOBILE_OPTIMIZATION: true,
          DARK_MODE: true,
          OFFLINE_MODE: true,
        }
      };
      
    case 'production':
      return {
        ESPN_API_TIMEOUT: 6000,
        GEMINI_TIMEOUT: 20000,
        LOCAL_GEMINI_ENABLED: false, // Disable local in production by default
        BROWSER_MCP_ENABLED: true,
        CACHE_DEFAULT_TTL: 15 * 60 * 1000, // 15 minutes
        PERFORMANCE_MONITORING_ENABLED: false, // Disable monitoring to prevent console errors
        RUM_ENABLED: false, // Disable RUM to prevent console errors
        FEATURES: {
          ESPN_API: true,
          BROWSER_MCP: true,
          LOCAL_GEMINI: false, // CRITICAL: Disable local Gemini in production
          CLOUD_GEMINI: false, // Disable cloud Gemini for now to prevent API calls
          AI_COACHING: false, // Disable AI coaching for now
          PERFORMANCE_MONITORING: false,
          REAL_TIME_DATA: true,
          MOBILE_OPTIMIZATION: true,
          DARK_MODE: true,
          OFFLINE_MODE: true,
        }
      };
      
    case 'test':
      return {
        ESPN_API_TIMEOUT: 5000,
        GEMINI_TIMEOUT: 10000,
        LOCAL_GEMINI_ENABLED: false,
        BROWSER_MCP_ENABLED: false,
        CACHE_DEFAULT_TTL: 1000, // 1 second for testing
        PERFORMANCE_MONITORING_ENABLED: false,
        RUM_ENABLED: false,
        FEATURES: {
          ESPN_API: false, // Use mocks in testing
          BROWSER_MCP: false,
          LOCAL_GEMINI: false,
          CLOUD_GEMINI: false,
          AI_COACHING: false,
          PERFORMANCE_MONITORING: false,
          REAL_TIME_DATA: false,
          MOBILE_OPTIMIZATION: true,
          DARK_MODE: true,
          OFFLINE_MODE: false,
        }
      };
      
    default:
      return {};
  }
};

// Build configuration from environment variables
export const buildConfig = (): EnvironmentConfig => {
  // Determine environment - use Vite's import.meta.env for browser compatibility
  const nodeEnv = (import.meta.env?.VITE_NODE_ENV || 
                   import.meta.env?.MODE || 
                   'development') as Environment;

  // Get environment defaults
  const defaults = getEnvironmentDefaults(nodeEnv);

  // Build configuration
  const config: EnvironmentConfig = {
    NODE_ENV: nodeEnv,
    APP_VERSION: parseString(import.meta.env?.VITE_APP_VERSION, '1.0.0'),
    BUILD_TIME: parseString(import.meta.env?.VITE_BUILD_TIME, new Date().toISOString()),
    
    // API Configuration
    ESPN_API_BASE_URL: parseString(
      import.meta.env?.VITE_ESPN_API_BASE_URL,
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl'
    ),
    ESPN_API_TIMEOUT: parseNumber(
      import.meta.env?.VITE_ESPN_API_TIMEOUT,
      defaults.ESPN_API_TIMEOUT || 8000
    ),
    ESPN_API_RETRY_ATTEMPTS: parseNumber(
      import.meta.env?.VITE_ESPN_API_RETRY_ATTEMPTS,
      3
    ),
    
    // Gemini AI Configuration
    GEMINI_API_KEY: parseString(import.meta.env?.VITE_GEMINI_API_KEY, ''),
    GEMINI_MODEL: parseString(import.meta.env?.VITE_GEMINI_MODEL, 'gemini-2.5-pro'),
    GEMINI_TIMEOUT: parseNumber(
      import.meta.env?.VITE_GEMINI_TIMEOUT,
      defaults.GEMINI_TIMEOUT || 20000
    ),
    GEMINI_MAX_TOKENS: parseNumber(import.meta.env?.VITE_GEMINI_MAX_TOKENS, 2048),
    
    // Local Gemini Bridge Configuration
    LOCAL_GEMINI_URL: parseString(
      import.meta.env?.VITE_LOCAL_GEMINI_URL,
      '' // Production-safe default: empty string
    ),
    LOCAL_GEMINI_WS_URL: parseString(
      import.meta.env?.VITE_LOCAL_GEMINI_WS_URL,
      '' // Production-safe default: empty string
    ),
    LOCAL_GEMINI_ENABLED: parseBoolean(
      import.meta.env?.VITE_LOCAL_GEMINI_ENABLED,
      defaults.LOCAL_GEMINI_ENABLED || false
    ),
    LOCAL_GEMINI_TIMEOUT: parseNumber(
      import.meta.env?.VITE_LOCAL_GEMINI_TIMEOUT,
      30000
    ),
    
    // Browser MCP Configuration
    BROWSER_MCP_ENABLED: parseBoolean(
      import.meta.env?.VITE_BROWSER_MCP_ENABLED,
      defaults.BROWSER_MCP_ENABLED || true
    ),
    BROWSER_MCP_TIMEOUT: parseNumber(
      import.meta.env?.VITE_BROWSER_MCP_TIMEOUT,
      15000
    ),
    BROWSER_MCP_RETRY_ATTEMPTS: parseNumber(
      import.meta.env?.VITE_BROWSER_MCP_RETRY_ATTEMPTS,
      3
    ),
    BROWSER_MCP_RATE_LIMIT: parseNumber(
      import.meta.env?.VITE_BROWSER_MCP_RATE_LIMIT,
      5000 // 5 seconds between requests
    ),
    
    // Caching Configuration
    CACHE_DEFAULT_TTL: parseNumber(
      import.meta.env?.VITE_CACHE_DEFAULT_TTL,
      defaults.CACHE_DEFAULT_TTL || 10 * 60 * 1000
    ),
    CACHE_MAX_SIZE: parseNumber(import.meta.env?.VITE_CACHE_MAX_SIZE, 100),
    CACHE_ENABLED: parseBoolean(import.meta.env?.VITE_CACHE_ENABLED, true),
    
    // Performance Monitoring
    PERFORMANCE_MONITORING_ENABLED: parseBoolean(
      import.meta.env?.VITE_PERFORMANCE_MONITORING_ENABLED,
      defaults.PERFORMANCE_MONITORING_ENABLED || false
    ),
    SENTRY_DSN: parseString(import.meta.env?.VITE_SENTRY_DSN, ''),
    ANALYTICS_ID: parseString(import.meta.env?.VITE_ANALYTICS_ID, ''),
    RUM_ENABLED: parseBoolean(
      import.meta.env?.VITE_RUM_ENABLED,
      defaults.RUM_ENABLED || false
    ),
    
    // Feature Flags - merge defaults with environment overrides
    FEATURES: {
      ESPN_API: parseBoolean(
        import.meta.env?.VITE_FEATURE_ESPN_API,
        defaults.FEATURES?.ESPN_API || true
      ),
      BROWSER_MCP: parseBoolean(
        import.meta.env?.VITE_FEATURE_BROWSER_MCP,
        defaults.FEATURES?.BROWSER_MCP || true
      ),
      LOCAL_GEMINI: parseBoolean(
        import.meta.env?.VITE_FEATURE_LOCAL_GEMINI,
        defaults.FEATURES?.LOCAL_GEMINI || false
      ),
      CLOUD_GEMINI: parseBoolean(
        import.meta.env?.VITE_FEATURE_CLOUD_GEMINI,
        defaults.FEATURES?.CLOUD_GEMINI || true
      ),
      AI_COACHING: parseBoolean(
        import.meta.env?.VITE_FEATURE_AI_COACHING,
        defaults.FEATURES?.AI_COACHING || true
      ),
      PERFORMANCE_MONITORING: parseBoolean(
        import.meta.env?.VITE_FEATURE_PERFORMANCE_MONITORING,
        defaults.FEATURES?.PERFORMANCE_MONITORING || false
      ),
      REAL_TIME_DATA: parseBoolean(
        import.meta.env?.VITE_FEATURE_REAL_TIME_DATA,
        defaults.FEATURES?.REAL_TIME_DATA || true
      ),
      MOBILE_OPTIMIZATION: parseBoolean(
        import.meta.env?.VITE_FEATURE_MOBILE_OPTIMIZATION,
        defaults.FEATURES?.MOBILE_OPTIMIZATION || true
      ),
      DARK_MODE: parseBoolean(
        import.meta.env?.VITE_FEATURE_DARK_MODE,
        defaults.FEATURES?.DARK_MODE || true
      ),
      OFFLINE_MODE: parseBoolean(
        import.meta.env?.VITE_FEATURE_OFFLINE_MODE,
        defaults.FEATURES?.OFFLINE_MODE || true
      ),
    },
    
    // League Configuration
    DEFAULT_SCORING: parseString(
      import.meta.env?.VITE_DEFAULT_SCORING,
      'ppr'
    ) as 'standard' | 'ppr' | 'half_ppr',
    DEFAULT_LEAGUE_SIZE: parseNumber(import.meta.env?.VITE_DEFAULT_LEAGUE_SIZE, 12),
    DEFAULT_ROSTER_SIZE: parseNumber(import.meta.env?.VITE_DEFAULT_ROSTER_SIZE, 16),
  };

  return config;
};

// Global configuration instance
export const config = buildConfig();

// Environment detection utilities
export const isDevelopment = () => config.NODE_ENV === 'development';
export const isProduction = () => config.NODE_ENV === 'production';
export const isStaging = () => config.NODE_ENV === 'staging';
export const isTest = () => config.NODE_ENV === 'test';

// Feature flag utilities
export const isFeatureEnabled = (feature: keyof EnvironmentConfig['FEATURES']): boolean => {
  return config.FEATURES[feature];
};

// Configuration validation
export const validateConfiguration = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required configuration for production
  if (isProduction()) {
    if (!config.GEMINI_API_KEY && config.FEATURES.CLOUD_GEMINI) {
      errors.push('GEMINI_API_KEY is required for production when Cloud Gemini is enabled');
    }

    if (config.PERFORMANCE_MONITORING_ENABLED && !config.SENTRY_DSN) {
      errors.push('SENTRY_DSN is required when performance monitoring is enabled');
    }

    if (config.RUM_ENABLED && !config.ANALYTICS_ID) {
      errors.push('ANALYTICS_ID is required when RUM is enabled');
    }
  }

  // Validate timeout values
  if (config.ESPN_API_TIMEOUT < 1000) {
    errors.push('ESPN_API_TIMEOUT must be at least 1000ms');
  }

  if (config.GEMINI_TIMEOUT < 5000) {
    errors.push('GEMINI_TIMEOUT must be at least 5000ms');
  }

  // Validate cache configuration
  if (config.CACHE_DEFAULT_TTL < 1000) {
    errors.push('CACHE_DEFAULT_TTL must be at least 1000ms');
  }

  if (config.CACHE_MAX_SIZE < 10) {
    errors.push('CACHE_MAX_SIZE must be at least 10');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Configuration debugging
export const getConfigSummary = (): Record<string, any> => {
  return {
    environment: config.NODE_ENV,
    version: config.APP_VERSION,
    buildTime: config.BUILD_TIME,
    features: Object.entries(config.FEATURES)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature),
    services: {
      espnApi: config.FEATURES.ESPN_API,
      browserMcp: config.FEATURES.BROWSER_MCP,
      localGemini: config.FEATURES.LOCAL_GEMINI && config.LOCAL_GEMINI_ENABLED,
      cloudGemini: config.FEATURES.CLOUD_GEMINI,
      aiCoaching: config.FEATURES.AI_COACHING,
    },
    caching: config.CACHE_ENABLED,
    monitoring: config.PERFORMANCE_MONITORING_ENABLED,
    rum: config.RUM_ENABLED,
  };
};

// Development debugging
if (isDevelopment()) {
  console.log('🔧 Fantasy Football Analyzer Configuration:', getConfigSummary());
  
  const validation = validateConfiguration();
  if (!validation.valid) {
    console.warn('⚠️ Configuration validation errors:', validation.errors);
  } else {
    console.log('✅ Configuration validated successfully');
  }
}