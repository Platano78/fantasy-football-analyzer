import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'skeleton' | 'pulse';
}

/**
 * Optimized loading spinner component with multiple variants
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  className = '',
  size = 'md',
  variant = 'spinner'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  const containerClasses = `flex items-center justify-center ${className}`;

  if (variant === 'skeleton') {
    return (
      <div className={containerClasses}>
        <div className="animate-pulse space-y-4 w-full max-w-md">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={containerClasses}>
        <div className="text-center">
          <div className="animate-pulse">
            <div className={`${sizeClasses[size]} bg-blue-200 rounded-full mx-auto mb-4`}></div>
            <div className="h-4 bg-blue-100 rounded w-24 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600 mx-auto mb-4`} />
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
};

/**
 * Skeleton loading component for specific content shapes
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

/**
 * Table skeleton for data loading states
 */
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="animate-pulse">
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header skeleton */}
        <div className="border-b border-gray-200 p-4">
          <div className="grid grid-cols-4 gap-4">
            {Array(columns).fill(0).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Rows skeleton */}
        {Array(rows).fill(0).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b border-gray-100 p-4 last:border-b-0">
            <div className="grid grid-cols-4 gap-4">
              {Array(columns).fill(0).map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};