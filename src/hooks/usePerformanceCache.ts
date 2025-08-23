/**
 * React hook for performance caching with automatic cache management
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { PerformanceCache, dataCache, apiCache, uiCache } from '@/utils/performanceCache';

type CacheType = 'data' | 'api' | 'ui';

interface CacheHookOptions {
  ttl?: number;
  cacheType?: CacheType;
  keyPrefix?: string;
  onCacheHit?: (key: string) => void;
  onCacheMiss?: (key: string) => void;
}

/**
 * Hook for caching data with automatic invalidation and performance tracking
 */
export function usePerformanceCache<T>(options: CacheHookOptions = {}) {
  const {
    ttl,
    cacheType = 'data',
    keyPrefix = '',
    onCacheHit,
    onCacheMiss
  } = options;

  const getCacheInstance = useCallback((): PerformanceCache => {
    switch (cacheType) {
      case 'api': return apiCache;
      case 'ui': return uiCache;
      case 'data':
      default: return dataCache;
    }
  }, [cacheType]);

  const cache = getCacheInstance();

  const get = useCallback(<TData = T>(key: string): TData | null => {
    const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key;
    const result = cache.get<TData>(fullKey);
    
    if (result !== null && onCacheHit) {
      onCacheHit(fullKey);
    } else if (result === null && onCacheMiss) {
      onCacheMiss(fullKey);
    }

    return result;
  }, [cache, keyPrefix, onCacheHit, onCacheMiss]);

  const set = useCallback(<TData = T>(key: string, data: TData, customTtl?: number) => {
    const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key;
    cache.set(fullKey, data, customTtl || ttl);
  }, [cache, keyPrefix, ttl]);

  const getOrSet = useCallback(async <TData = T>(
    key: string,
    loader: () => Promise<TData>,
    customTtl?: number
  ): Promise<TData> => {
    const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key;
    return cache.getOrSet(fullKey, loader, customTtl || ttl);
  }, [cache, keyPrefix, ttl]);

  const invalidate = useCallback((key: string): boolean => {
    const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key;
    return cache.delete(fullKey);
  }, [cache, keyPrefix]);

  const has = useCallback((key: string): boolean => {
    const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key;
    return cache.has(fullKey);
  }, [cache, keyPrefix]);

  const getStats = useCallback(() => {
    return cache.getStats();
  }, [cache]);

  return {
    get,
    set,
    getOrSet,
    invalidate,
    has,
    getStats,
    cache
  };
}

/**
 * Hook for caching API responses with automatic error handling
 */
export function useApiCache<T>(endpoint: string, options: Omit<CacheHookOptions, 'cacheType'> = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);
  
  const cache = usePerformanceCache<T>({
    ...options,
    cacheType: 'api',
    keyPrefix: options.keyPrefix || 'api'
  });

  const fetchData = useCallback(async (
    fetchFn: () => Promise<T>,
    forceRefresh = false
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cached = cache.get(endpoint);
        if (cached !== null) {
          setData(cached);
          setLoading(false);
          return cached;
        }
      }

      // Fetch fresh data
      const result = await fetchFn();
      cache.set(endpoint, result);
      setData(result);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [cache, endpoint]);

  const invalidateCache = useCallback(() => {
    cache.invalidate(endpoint);
    setData(null);
    setError(null);
  }, [cache, endpoint]);

  return {
    data,
    loading,
    error,
    fetchData,
    invalidateCache,
    refetch: (fetchFn: () => Promise<T>) => fetchData(fetchFn, true)
  };
}

/**
 * Hook for caching component UI state with persistence
 */
export function useUIStateCache<T>(componentName: string, initialState: T) {
  const cache = usePerformanceCache<T>({
    cacheType: 'ui',
    keyPrefix: 'ui-state',
    ttl: 30 * 60 * 1000 // 30 minutes
  });

  const [state, setState] = useState<T>(() => {
    const cached = cache.get(componentName);
    return cached !== null ? cached : initialState;
  });

  const updateState = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prevState => {
      const updatedState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(prevState)
        : newState;
      
      cache.set(componentName, updatedState);
      return updatedState;
    });
  }, [cache, componentName]);

  const resetState = useCallback(() => {
    cache.invalidate(componentName);
    setState(initialState);
  }, [cache, componentName, initialState]);

  return [state, updateState, resetState] as const;
}

/**
 * Hook for caching expensive computed values
 */
export function useCachedComputation<T, TDeps extends ReadonlyArray<unknown>>(
  computeKey: string,
  computeFn: () => T,
  dependencies: TDeps,
  options: Omit<CacheHookOptions, 'cacheType'> = {}
) {
  const cache = usePerformanceCache<T>({
    ...options,
    cacheType: 'data',
    keyPrefix: options.keyPrefix || 'computation'
  });

  // Create dependency key for cache invalidation
  const depsKey = useRef<string>('');
  const currentDepsKey = JSON.stringify(dependencies);

  // Check if dependencies changed
  const depsChanged = depsKey.current !== currentDepsKey;

  const result = useRef<T | null>(null);

  if (depsChanged) {
    // Dependencies changed, invalidate cache
    if (depsKey.current) {
      cache.invalidate(`${computeKey}:${depsKey.current}`);
    }
    depsKey.current = currentDepsKey;
    result.current = null;
  }

  const cacheKey = `${computeKey}:${currentDepsKey}`;

  if (result.current === null) {
    // Try to get from cache
    const cached = cache.get(cacheKey);
    if (cached !== null) {
      result.current = cached;
    } else {
      // Compute and cache
      result.current = computeFn();
      cache.set(cacheKey, result.current);
    }
  }

  return result.current;
}

/**
 * Hook for preloading data into cache
 */
export function useDataPreloader() {
  const cache = usePerformanceCache();
  const preloadingRefs = useRef(new Set<string>());

  const preload = useCallback(async <T>(
    key: string,
    loader: () => Promise<T>,
    ttl?: number
  ) => {
    // Prevent duplicate preloading
    if (preloadingRefs.current.has(key) || cache.has(key)) {
      return;
    }

    preloadingRefs.current.add(key);
    
    try {
      const data = await loader();
      cache.set(key, data, ttl);
    } catch (error) {
      console.warn(`Failed to preload data for key: ${key}`, error);
    } finally {
      preloadingRefs.current.delete(key);
    }
  }, [cache]);

  const preloadMultiple = useCallback(async (
    entries: Array<{
      key: string;
      loader: () => Promise<any>;
      ttl?: number;
    }>
  ) => {
    await Promise.allSettled(
      entries.map(({ key, loader, ttl }) => preload(key, loader, ttl))
    );
  }, [preload]);

  return {
    preload,
    preloadMultiple,
    isPreloading: (key: string) => preloadingRefs.current.has(key)
  };
}

/**
 * Hook for monitoring cache performance
 */
export function useCacheMonitoring(cacheType: CacheType = 'data') {
  const [stats, setStats] = useState<ReturnType<PerformanceCache['getStats']> | null>(null);
  
  const cache = usePerformanceCache({ cacheType });

  const updateStats = useCallback(() => {
    setStats(cache.getStats());
  }, [cache]);

  useEffect(() => {
    // Initial stats
    updateStats();

    // Update stats periodically
    const interval = setInterval(updateStats, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [updateStats]);

  const clearCache = useCallback(() => {
    cache.cache.clear();
    updateStats();
  }, [cache, updateStats]);

  return {
    stats,
    updateStats,
    clearCache,
    hitRate: stats ? (stats.totalHits / Math.max(stats.size, 1)) : 0
  };
}