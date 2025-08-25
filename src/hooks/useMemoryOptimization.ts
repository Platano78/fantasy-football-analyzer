/**
 * Comprehensive memory optimization and leak prevention system
 * Handles cleanup of timers, event listeners, subscriptions, and WebSocket connections
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { performanceMonitor } from '@/utils/performanceMonitor';

// ============================================================================
// RESOURCE CLEANUP MANAGER
// ============================================================================

type CleanupFunction = () => void;
type ResourceType = 'timer' | 'interval' | 'listener' | 'observer' | 'websocket' | 'subscription' | 'cache' | 'worker';

interface ManagedResource {
  id: string;
  type: ResourceType;
  cleanup: CleanupFunction;
  createdAt: number;
  metadata?: Record<string, any>;
}

class ResourceManager {
  private resources = new Map<string, ManagedResource>();
  private isDestroyed = false;

  register(type: ResourceType, cleanup: CleanupFunction, metadata?: Record<string, any>): string {
    if (this.isDestroyed) {
      console.warn('Attempting to register resource on destroyed manager');
      return '';
    }

    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const resource: ManagedResource = {
      id,
      type,
      cleanup,
      createdAt: Date.now(),
      metadata
    };

    this.resources.set(id, resource);
    return id;
  }

  unregister(id: string): boolean {
    const resource = this.resources.get(id);
    if (resource) {
      try {
        resource.cleanup();
      } catch (error) {
        console.error(`Error cleaning up resource ${id}:`, error);
      }
      this.resources.delete(id);
      return true;
    }
    return false;
  }

  unregisterByType(type: ResourceType): number {
    let cleaned = 0;
    for (const [id, resource] of this.resources.entries()) {
      if (resource.type === type) {
        this.unregister(id);
        cleaned++;
      }
    }
    return cleaned;
  }

  getResourceStats() {
    const stats: Record<ResourceType, number> = {
      timer: 0,
      interval: 0,
      listener: 0,
      observer: 0,
      websocket: 0,
      subscription: 0,
      cache: 0,
      worker: 0
    };

    for (const resource of this.resources.values()) {
      stats[resource.type]++;
    }

    return {
      stats,
      totalResources: this.resources.size,
      oldestResource: Math.min(...Array.from(this.resources.values()).map(r => r.createdAt)),
      memoryEstimate: this.resources.size * 100 // Rough estimate
    };
  }

  cleanup(): void {
    const startTime = performance.now();
    let errors = 0;

    for (const [id, resource] of this.resources.entries()) {
      try {
        resource.cleanup();
      } catch (error) {
        console.error(`Error cleaning up resource ${id} (${resource.type}):`, error);
        errors++;
      }
    }

    const cleanupTime = performance.now() - startTime;
    performanceMonitor.trackMetric('resource-cleanup', cleanupTime, {
      resourceCount: this.resources.size,
      errors,
      types: Object.keys(this.getResourceStats().stats).join(',')
    });

    this.resources.clear();
    this.isDestroyed = true;
  }
}

// ============================================================================
// MEMORY OPTIMIZATION HOOKS
// ============================================================================

export function useResourceManager() {
  const managerRef = useRef<ResourceManager>(new ResourceManager());
  
  useEffect(() => {
    return () => {
      managerRef.current.cleanup();
    };
  }, []);

  return managerRef.current;
}

// Enhanced timer management with automatic cleanup
export function useOptimizedTimer() {
  const resourceManager = useResourceManager();

  const setTimeout = useCallback((
    callback: () => void,
    delay: number,
    deps: React.DependencyList = []
  ) => {
    const id = window.setTimeout(callback, delay);
    const resourceId = resourceManager.register('timer', () => window.clearTimeout(id), {
      delay,
      deps: JSON.stringify(deps)
    });

    return () => resourceManager.unregister(resourceId);
  }, [resourceManager]);

  const setInterval = useCallback((
    callback: () => void,
    interval: number,
    deps: React.DependencyList = []
  ) => {
    const id = window.setInterval(callback, interval);
    const resourceId = resourceManager.register('interval', () => window.clearInterval(id), {
      interval,
      deps: JSON.stringify(deps)
    });

    return () => resourceManager.unregister(resourceId);
  }, [resourceManager]);

  const setAnimationFrame = useCallback((callback: () => void) => {
    const id = requestAnimationFrame(callback);
    const resourceId = resourceManager.register('timer', () => cancelAnimationFrame(id));

    return () => resourceManager.unregister(resourceId);
  }, [resourceManager]);

  return { setTimeout, setInterval, setAnimationFrame };
}

// Enhanced event listener management
export function useOptimizedEventListeners() {
  const resourceManager = useResourceManager();

  const addEventListener = useCallback((
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    element.addEventListener(event, handler, options);
    
    const resourceId = resourceManager.register('listener', () => {
      element.removeEventListener(event, handler, options);
    }, {
      event,
      element: element.constructor.name,
      options: JSON.stringify(options)
    });

    return () => resourceManager.unregister(resourceId);
  }, [resourceManager]);

  const addWindowListener = useCallback((
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    return addEventListener(window, event, handler, options);
  }, [addEventListener]);

  const addDocumentListener = useCallback((
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    return addEventListener(document, event, handler, options);
  }, [addEventListener]);

  return { addEventListener, addWindowListener, addDocumentListener };
}

// WebSocket connection management with automatic cleanup
export function useOptimizedWebSocket(url: string, protocols?: string | string[]) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'open' | 'closing' | 'closed'>('closed');
  const resourceManager = useResourceManager();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = useRef(5);
  const reconnectAttempts = useRef(0);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socket && socket.readyState !== WebSocket.CLOSED) {
      socket.close();
    }
  }, [socket]);

  const connect = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(url, protocols);
      
      ws.onopen = () => {
        setConnectionState('open');
        reconnectAttempts.current = 0;
        performanceMonitor.trackMetric('websocket-connect', Date.now(), { url });
      };

      ws.onclose = (event) => {
        setConnectionState('closed');
        
        if (!event.wasClean && reconnectAttempts.current < maxReconnectAttempts.current) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        performanceMonitor.trackMetric('websocket-error', Date.now(), { url });
      };

      setSocket(ws);
      setConnectionState('connecting');
      
      // Register for cleanup
      resourceManager.register('websocket', () => {
        if (ws.readyState !== WebSocket.CLOSED) {
          ws.close();
        }
      }, { url });

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionState('closed');
    }
  }, [url, protocols, socket, resourceManager]);

  const disconnect = useCallback(() => {
    cleanup();
    setSocket(null);
    setConnectionState('closed');
  }, [cleanup]);

  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  return {
    socket,
    connectionState,
    connect,
    disconnect,
    isConnected: connectionState === 'open'
  };
}

// Observer pattern management (IntersectionObserver, MutationObserver, etc.)
export function useOptimizedObserver() {
  const resourceManager = useResourceManager();

  const createIntersectionObserver = useCallback((
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) => {
    const observer = new IntersectionObserver(callback, options);
    
    const resourceId = resourceManager.register('observer', () => observer.disconnect(), {
      type: 'IntersectionObserver',
      options: JSON.stringify(options)
    });

    return {
      observer,
      cleanup: () => resourceManager.unregister(resourceId)
    };
  }, [resourceManager]);

  const createMutationObserver = useCallback((
    callback: MutationCallback
  ) => {
    const observer = new MutationObserver(callback);
    
    const resourceId = resourceManager.register('observer', () => observer.disconnect(), {
      type: 'MutationObserver'
    });

    return {
      observer,
      cleanup: () => resourceManager.unregister(resourceId)
    };
  }, [resourceManager]);

  const createResizeObserver = useCallback((
    callback: ResizeObserverCallback
  ) => {
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(callback);
      
      const resourceId = resourceManager.register('observer', () => observer.disconnect(), {
        type: 'ResizeObserver'
      });

      return {
        observer,
        cleanup: () => resourceManager.unregister(resourceId)
      };
    }
    
    return { observer: null, cleanup: () => {} };
  }, [resourceManager]);

  return {
    createIntersectionObserver,
    createMutationObserver,
    createResizeObserver
  };
}

// Memory usage monitoring and optimization
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  }>({});
  
  const resourceManager = useResourceManager();
  const { setInterval } = useOptimizedTimer();

  const updateMemoryInfo = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMemoryInfo({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      });

      // Track memory usage
      performanceMonitor.trackMetric('memory-usage', memory.usedJSHeapSize, {
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        utilization: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      });
    }
  }, []);

  const forceGarbageCollection = useCallback(() => {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
      updateMemoryInfo();
    }
  }, [updateMemoryInfo]);

  const getResourceStats = useCallback(() => {
    return resourceManager.getResourceStats();
  }, [resourceManager]);

  useEffect(() => {
    updateMemoryInfo();
    const cleanup = setInterval(updateMemoryInfo, 10000); // Update every 10 seconds
    return cleanup;
  }, [updateMemoryInfo, setInterval]);

  return {
    memoryInfo,
    updateMemoryInfo,
    forceGarbageCollection,
    getResourceStats,
    isMemoryPressure: memoryInfo.usedJSHeapSize && memoryInfo.jsHeapSizeLimit 
      ? (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) > 0.9
      : false
  };
}

// Hook for tracking component lifecycle and preventing memory leaks
export function useComponentLifecycle(componentName: string) {
  const mountTime = useRef(Date.now());
  const resourceManager = useResourceManager();

  useEffect(() => {
    // Track component mount
    performanceMonitor.trackMetric(`component-mount:${componentName}`, Date.now() - mountTime.current);

    return () => {
      // Track component unmount and cleanup time
      const cleanupStart = performance.now();
      const stats = resourceManager.getResourceStats();
      
      performanceMonitor.trackMetric(`component-unmount:${componentName}`, performance.now() - cleanupStart, {
        resourceCount: stats.totalResources,
        lifespan: Date.now() - mountTime.current
      });
    };
  }, [componentName, resourceManager]);

  return {
    getResourceStats: () => resourceManager.getResourceStats(),
    getLifespan: () => Date.now() - mountTime.current
  };
}

// Batch update optimization to prevent excessive re-renders
export function useBatchedUpdates<T>() {
  const [pendingUpdates, setPendingUpdates] = useState<T[]>([]);
  const { setTimeout } = useOptimizedTimer();
  const batchTimeoutRef = useRef<(() => void) | null>(null);

  const addUpdate = useCallback((update: T) => {
    setPendingUpdates(prev => [...prev, update]);
    
    // Clear existing timeout
    if (batchTimeoutRef.current) {
      batchTimeoutRef.current();
    }
    
    // Set new timeout for batch processing
    batchTimeoutRef.current = setTimeout(() => {
      // Process batched updates
      setPendingUpdates([]);
      batchTimeoutRef.current = null;
    }, 16); // One frame delay
  }, [setTimeout]);

  const flushUpdates = useCallback(() => {
    if (batchTimeoutRef.current) {
      batchTimeoutRef.current();
    }
    const updates = pendingUpdates;
    setPendingUpdates([]);
    return updates;
  }, [pendingUpdates]);

  return {
    pendingUpdates,
    addUpdate,
    flushUpdates,
    hasPendingUpdates: pendingUpdates.length > 0
  };
}

export { ResourceManager };