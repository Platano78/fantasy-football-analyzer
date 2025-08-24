/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Vite built-in environment variables
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
  
  // Application configuration
  readonly VITE_NODE_ENV?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_BUILD_TIME?: string;
  
  // API Configuration
  readonly VITE_ESPN_API_BASE_URL?: string;
  readonly VITE_ESPN_API_TIMEOUT?: string;
  readonly VITE_ESPN_API_RETRY_ATTEMPTS?: string;
  
  // Gemini AI Configuration
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_MODEL?: string;
  readonly VITE_GEMINI_TIMEOUT?: string;
  readonly VITE_GEMINI_MAX_TOKENS?: string;
  
  // Local Gemini Bridge Configuration
  readonly VITE_LOCAL_GEMINI_URL?: string;
  readonly VITE_LOCAL_GEMINI_WS_URL?: string;
  readonly VITE_LOCAL_GEMINI_ENABLED?: string;
  readonly VITE_LOCAL_GEMINI_TIMEOUT?: string;
  
  // Browser MCP Configuration
  readonly VITE_BROWSER_MCP_ENABLED?: string;
  readonly VITE_BROWSER_MCP_TIMEOUT?: string;
  readonly VITE_BROWSER_MCP_RETRY_ATTEMPTS?: string;
  readonly VITE_BROWSER_MCP_RATE_LIMIT?: string;
  
  // Caching Configuration
  readonly VITE_CACHE_DEFAULT_TTL?: string;
  readonly VITE_CACHE_MAX_SIZE?: string;
  readonly VITE_CACHE_ENABLED?: string;
  
  // Performance Monitoring
  readonly VITE_PERFORMANCE_MONITORING_ENABLED?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_ANALYTICS_ID?: string;
  readonly VITE_RUM_ENABLED?: string;
  readonly VITE_SHOW_PERFORMANCE_STATS?: string;
  
  // Feature Flags
  readonly VITE_FEATURE_ESPN_API?: string;
  readonly VITE_FEATURE_BROWSER_MCP?: string;
  readonly VITE_FEATURE_LOCAL_GEMINI?: string;
  readonly VITE_FEATURE_CLOUD_GEMINI?: string;
  readonly VITE_FEATURE_AI_COACHING?: string;
  readonly VITE_FEATURE_PERFORMANCE_MONITORING?: string;
  readonly VITE_FEATURE_REAL_TIME_DATA?: string;
  readonly VITE_FEATURE_MOBILE_OPTIMIZATION?: string;
  readonly VITE_FEATURE_DARK_MODE?: string;
  readonly VITE_FEATURE_OFFLINE_MODE?: string;
  
  // League Configuration
  readonly VITE_DEFAULT_SCORING?: string;
  readonly VITE_DEFAULT_LEAGUE_SIZE?: string;
  readonly VITE_DEFAULT_ROSTER_SIZE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}