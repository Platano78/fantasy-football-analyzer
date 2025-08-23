import React, { Suspense, ComponentType } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  name?: string;
}

/**
 * Performance-optimized lazy wrapper component
 * Provides consistent loading states and error boundaries for lazy-loaded components
 */
export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback,
  errorFallback,
  name = 'Component'
}) => {
  const defaultFallback = (
    <LoadingSpinner 
      message={`Loading ${name}...`}
      className="min-h-[400px]"
    />
  );

  const defaultErrorFallback = (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="text-red-500 text-lg font-medium mb-2">
          Failed to load {name}
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={errorFallback || defaultErrorFallback}>
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * Higher-order component for creating lazy-loaded components with consistent behavior
 */
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  name?: string
) {
  const LazyComponent = React.lazy(() => Promise.resolve({ default: Component }));
  
  return function WrappedLazyComponent(props: P) {
    return (
      <LazyWrapper name={name || Component.displayName || Component.name}>
        <LazyComponent {...props} />
      </LazyWrapper>
    );
  };
}

/**
 * Utility for creating lazy-loaded components with preloading capability
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  name?: string
) {
  const LazyComponent = React.lazy(importFn);
  
  // Preload function for eager loading when needed
  const preload = () => {
    importFn();
  };
  
  const WrappedComponent = function(props: P) {
    return (
      <LazyWrapper name={name}>
        <LazyComponent {...props} />
      </LazyWrapper>
    );
  };
  
  // Attach preload function for programmatic preloading
  (WrappedComponent as any).preload = preload;
  
  return WrappedComponent;
}