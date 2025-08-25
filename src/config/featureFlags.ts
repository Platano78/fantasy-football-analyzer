// Feature Flags Management System
// Dynamic feature control and A/B testing support

import React from 'react';
import { config, isFeatureEnabled } from './environment';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage: number;
  description: string;
  environments: string[];
  dependencies?: string[];
  deprecatedAt?: Date;
  removalDate?: Date;
}

export interface FeatureFlagContext {
  userId?: string;
  sessionId: string;
  environment: string;
  userAgent: string;
  timestamp: Date;
}

// Feature flag definitions
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Data Services
  ESPN_API: {
    key: 'espn_api',
    enabled: config.FEATURES.ESPN_API,
    rolloutPercentage: 100,
    description: 'ESPN API integration for real fantasy football data',
    environments: ['development', 'staging', 'production']
  },


  // AI Services
  LOCAL_GEMINI: {
    key: 'local_gemini',
    enabled: config.FEATURES.LOCAL_GEMINI,
    rolloutPercentage: config.NODE_ENV === 'development' ? 100 : 50,
    description: 'Local Gemini Advanced bridge server for unlimited AI coaching',
    environments: ['development', 'staging']
  },

  CLOUD_GEMINI: {
    key: 'cloud_gemini',
    enabled: config.FEATURES.CLOUD_GEMINI,
    rolloutPercentage: 100,
    description: 'Cloud Gemini Enterprise API fallback',
    environments: ['development', 'staging', 'production']
  },

  AI_COACHING: {
    key: 'ai_coaching',
    enabled: config.FEATURES.AI_COACHING,
    rolloutPercentage: 100,
    description: 'Comprehensive AI fantasy football coaching',
    environments: ['development', 'staging', 'production'],
    dependencies: ['LOCAL_GEMINI', 'CLOUD_GEMINI']
  },

  // Performance & Monitoring
  PERFORMANCE_MONITORING: {
    key: 'performance_monitoring',
    enabled: config.FEATURES.PERFORMANCE_MONITORING,
    rolloutPercentage: config.NODE_ENV === 'production' ? 100 : 50,
    description: 'Real User Monitoring (RUM) and performance tracking',
    environments: ['staging', 'production']
  },

  REAL_TIME_DATA: {
    key: 'real_time_data',
    enabled: config.FEATURES.REAL_TIME_DATA,
    rolloutPercentage: 95,
    description: 'Real-time data updates via WebSocket connections',
    environments: ['development', 'staging', 'production'],
    dependencies: ['ESPN_API']
  },

  // UI/UX Features
  MOBILE_OPTIMIZATION: {
    key: 'mobile_optimization',
    enabled: config.FEATURES.MOBILE_OPTIMIZATION,
    rolloutPercentage: 100,
    description: 'Mobile-first responsive design and touch optimizations',
    environments: ['development', 'staging', 'production']
  },

  DARK_MODE: {
    key: 'dark_mode',
    enabled: config.FEATURES.DARK_MODE,
    rolloutPercentage: 100,
    description: 'Dark mode theme support',
    environments: ['development', 'staging', 'production']
  },

  OFFLINE_MODE: {
    key: 'offline_mode',
    enabled: config.FEATURES.OFFLINE_MODE,
    rolloutPercentage: 80,
    description: 'Offline functionality with cached data',
    environments: ['development', 'staging', 'production']
  },

  // Experimental Features
  ADVANCED_ANALYTICS: {
    key: 'advanced_analytics',
    enabled: false,
    rolloutPercentage: 25,
    description: 'Advanced fantasy analytics and machine learning insights',
    environments: ['development', 'staging']
  },

  SOCIAL_FEATURES: {
    key: 'social_features',
    enabled: false,
    rolloutPercentage: 10,
    description: 'Social sharing and league interaction features',
    environments: ['development']
  },

  VOICE_INTERFACE: {
    key: 'voice_interface',
    enabled: false,
    rolloutPercentage: 5,
    description: 'Voice commands for hands-free fantasy management',
    environments: ['development']
  },

  // Beta Features
  BETA_UI: {
    key: 'beta_ui',
    enabled: false,
    rolloutPercentage: 20,
    description: 'New UI components and design system',
    environments: ['development', 'staging']
  },

  BETA_AI_MODELS: {
    key: 'beta_ai_models',
    enabled: false,
    rolloutPercentage: 15,
    description: 'Experimental AI models for fantasy analysis',
    environments: ['development'],
    dependencies: ['AI_COACHING']
  }
};

// Feature flag evaluation
class FeatureFlagService {
  private context: FeatureFlagContext;
  private cache: Map<string, boolean> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.context = this.buildContext();
  }

  private buildContext(): FeatureFlagContext {
    return {
      sessionId: this.generateSessionId(),
      environment: config.NODE_ENV,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      timestamp: new Date()
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if feature is enabled with rollout percentage
  private evaluateRollout(flag: FeatureFlag, userId?: string): boolean {
    if (flag.rolloutPercentage >= 100) return true;
    if (flag.rolloutPercentage <= 0) return false;

    // Use deterministic hash for consistent user experience
    const identifier = userId || this.context.sessionId;
    const hash = this.simpleHash(identifier + flag.key);
    const percentage = (hash % 100) + 1;
    
    return percentage <= flag.rolloutPercentage;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Check environment compatibility
  private isEnvironmentCompatible(flag: FeatureFlag): boolean {
    return flag.environments.includes(this.context.environment);
  }

  // Check dependencies
  private areDependenciesMet(flag: FeatureFlag, userId?: string): boolean {
    if (!flag.dependencies) return true;

    return flag.dependencies.every(dep => {
      const depFlag = FEATURE_FLAGS[dep];
      return depFlag ? this.isEnabled(depFlag.key, userId) : false;
    });
  }

  // Check if feature is deprecated
  private isDeprecated(flag: FeatureFlag): boolean {
    return flag.deprecatedAt ? flag.deprecatedAt <= new Date() : false;
  }

  // Main feature flag evaluation
  public isEnabled(flagKey: string, userId?: string): boolean {
    const cacheKey = `${flagKey}_${userId || 'anonymous'}`;
    
    // Check cache first
    if (this.cache.has(cacheKey) && 
        this.cacheExpiry.has(cacheKey) && 
        Date.now() < this.cacheExpiry.get(cacheKey)!) {
      return this.cache.get(cacheKey)!;
    }

    const flag = FEATURE_FLAGS[flagKey];
    if (!flag) {
      console.warn(`Feature flag '${flagKey}' not found`);
      return false;
    }

    let enabled = false;

    // Check all conditions
    if (flag.enabled && 
        this.isEnvironmentCompatible(flag) && 
        this.areDependenciesMet(flag, userId) && 
        !this.isDeprecated(flag) &&
        this.evaluateRollout(flag, userId)) {
      enabled = true;
    }

    // Cache the result
    this.cache.set(cacheKey, enabled);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

    return enabled;
  }

  // Get all enabled features for current context
  public getEnabledFeatures(userId?: string): string[] {
    return Object.keys(FEATURE_FLAGS).filter(key => this.isEnabled(key, userId));
  }

  // Get feature flag details
  public getFeatureFlag(flagKey: string): FeatureFlag | null {
    return FEATURE_FLAGS[flagKey] || null;
  }

  // Get all feature flags with their status
  public getAllFeatureFlags(userId?: string): Record<string, { flag: FeatureFlag; enabled: boolean }> {
    const result: Record<string, { flag: FeatureFlag; enabled: boolean }> = {};
    
    Object.entries(FEATURE_FLAGS).forEach(([key, flag]) => {
      result[key] = {
        flag,
        enabled: this.isEnabled(key, userId)
      };
    });

    return result;
  }

  // Clear cache
  public clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  // Update context (for user login, etc.)
  public updateContext(updates: Partial<FeatureFlagContext>): void {
    this.context = { ...this.context, ...updates };
    this.clearCache(); // Clear cache when context changes
  }

  // Development helpers
  public getDebugInfo(userId?: string): any {
    return {
      context: this.context,
      enabledFeatures: this.getEnabledFeatures(userId),
      cacheSize: this.cache.size,
      environment: config.NODE_ENV
    };
  }
}

// Global feature flag service instance
export const featureFlagService = new FeatureFlagService();

// Convenience wrapper functions
export const isFeatureFlagEnabled = (flagKey: string, userId?: string): boolean => {
  return featureFlagService.isEnabled(flagKey, userId);
};

// React hook for feature flags (if needed in components)
export const useFeatureFlag = (flagKey: string, userId?: string): boolean => {
  // In a React component, this would use useState and useEffect
  // For now, returning the direct value
  return isFeatureFlagEnabled(flagKey, userId);
};

// Feature flag middleware for conditional rendering
export const withFeatureFlag = <T extends Record<string, any>>(
  flagKey: string,
  Component: React.ComponentType<T>,
  FallbackComponent?: React.ComponentType<T>
): React.ComponentType<T> => {
  return (props: T) => {
    if (isFeatureFlagEnabled(flagKey)) {
      return React.createElement(Component, props);
    }
    
    if (FallbackComponent) {
      return React.createElement(FallbackComponent, props);
    }
    
    return null;
  };
};

// Development logging
if (config.NODE_ENV === 'development') {
  console.log('🚩 Feature Flags Initialized:');
  console.table(
    Object.entries(FEATURE_FLAGS)
      .filter(([, flag]) => flag.enabled)
      .reduce((acc, [key, flag]) => ({
        ...acc,
        [key]: {
          enabled: featureFlagService.isEnabled(key),
          rollout: `${flag.rolloutPercentage}%`,
          environments: flag.environments.join(', ')
        }
      }), {})
  );
}