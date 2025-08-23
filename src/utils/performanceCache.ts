/**
 * Advanced caching utility with performance optimization
 * Provides intelligent cache management with expiration, memory limits, and persistence
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
  size?: number;
}

interface CacheOptions {
  maxSize?: number;
  defaultTtl?: number;
  enablePersistence?: boolean;
  storageKey?: string;
}

class PerformanceCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly defaultTtl: number;
  private readonly enablePersistence: boolean;
  private readonly storageKey: string;
  private currentSize = 0;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 50;
    this.defaultTtl = options.defaultTtl || 5 * 60 * 1000; // 5 minutes
    this.enablePersistence = options.enablePersistence ?? true;
    this.storageKey = options.storageKey || 'ff-analyzer-cache';

    // Load persisted cache on initialization
    if (this.enablePersistence && typeof localStorage !== 'undefined') {
      this.loadFromStorage();
    }

    // Periodic cleanup
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Store data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTtl = ttl || this.defaultTtl;
    const size = this.estimateSize(data);

    // Remove existing entry to update size
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      this.currentSize -= existing.size || 0;
    }

    // Check if we need to evict entries
    while (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastUsed();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: entryTtl,
      hits: 0,
      lastAccessed: now,
      size
    };

    this.cache.set(key, entry);
    this.currentSize += size;

    if (this.enablePersistence) {
      this.persistToStorage();
    }
  }

  /**
   * Retrieve data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key);
      return null;
    }

    // Update access statistics
    entry.hits++;
    entry.lastAccessed = now;

    return entry.data;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size || 0;
      const deleted = this.cache.delete(key);
      
      if (this.enablePersistence && deleted) {
        this.persistToStorage();
      }
      
      return deleted;
    }
    return false;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get or set pattern with async data loading
   */
  async getOrSet<T>(
    key: string, 
    loader: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await loader();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
    
    if (this.enablePersistence && typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      currentSize: this.currentSize,
      totalHits: entries.reduce((sum, [, entry]) => sum + entry.hits, 0),
      averageAge: entries.length > 0 
        ? entries.reduce((sum, [, entry]) => sum + (now - entry.timestamp), 0) / entries.length 
        : 0,
      expiredCount: entries.filter(([, entry]) => now - entry.timestamp > entry.ttl).length
    };
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));

    if (expiredKeys.length > 0 && this.enablePersistence) {
      this.persistToStorage();
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLeastUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  /**
   * Estimate memory size of data
   */
  private estimateSize(data: any): number {
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  }

  /**
   * Persist cache to localStorage
   */
  private persistToStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to persist cache to storage:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;

      const cacheData = JSON.parse(stored) as [string, CacheEntry][];
      const now = Date.now();

      for (const [key, entry] of cacheData) {
        // Only restore non-expired entries
        if (now - entry.timestamp <= entry.ttl) {
          this.cache.set(key, entry);
          this.currentSize += entry.size || 0;
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }
}

// Create cache instances for different data types
export const dataCache = new PerformanceCache({
  maxSize: 100,
  defaultTtl: 10 * 60 * 1000, // 10 minutes
  storageKey: 'ff-data-cache'
});

export const uiCache = new PerformanceCache({
  maxSize: 50,
  defaultTtl: 30 * 60 * 1000, // 30 minutes
  storageKey: 'ff-ui-cache'
});

export const apiCache = new PerformanceCache({
  maxSize: 75,
  defaultTtl: 5 * 60 * 1000, // 5 minutes
  storageKey: 'ff-api-cache'
});

export { PerformanceCache };