import React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  className?: string;
}

/**
 * Base skeleton component with shimmer animation
 */
export const LoadingSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  ({ variant = 'rectangular', width, height, className, style, ...props }, ref) => {
    const baseStyles = 'animate-pulse bg-gray-700';
    
    const variants = {
      text: 'rounded',
      circular: 'rounded-full',
      rectangular: '',
      rounded: 'rounded-lg',
    };

    const skeletonStyle: React.CSSProperties = {
      width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
      height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      ...style,
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        style={skeletonStyle}
        {...props}
      />
    );
  }
);

LoadingSkeleton.displayName = 'LoadingSkeleton';

/**
 * Skeleton for card components
 */
export const CardSkeleton: React.FC<{ count?: number; className?: string }> = ({ 
  count = 1, 
  className 
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn('rounded-lg border border-gray-700 bg-gray-800 p-6', className)}
        >
          <LoadingSkeleton variant="rounded" height={24} width="60%" className="mb-3" />
          <LoadingSkeleton variant="text" height={16} width="100%" className="mb-2" />
          <LoadingSkeleton variant="text" height={16} width="80%" className="mb-4" />
          <div className="flex gap-2">
            <LoadingSkeleton variant="rounded" height={32} width={100} />
            <LoadingSkeleton variant="rounded" height={32} width={100} />
          </div>
        </div>
      ))}
    </>
  );
};

/**
 * Skeleton for list items
 */
export const ListSkeleton: React.FC<{ 
  count?: number; 
  showAvatar?: boolean;
  className?: string;
}> = ({ count = 5, showAvatar = false, className }) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {showAvatar && (
            <LoadingSkeleton variant="circular" width={40} height={40} />
          )}
          <div className="flex-1 space-y-2">
            <LoadingSkeleton variant="text" height={16} width="40%" />
            <LoadingSkeleton variant="text" height={14} width="60%" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton for table rows
 */
export const TableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <LoadingSkeleton
              key={j}
              variant="text"
              height={16}
              width={j === 0 ? '30%' : j === columns - 1 ? '20%' : '25%'}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton for course cards
 */
export const CourseCardSkeleton: React.FC<{ count?: number; className?: string }> = ({ 
  count = 6, 
  className 
}) => {
  return (
    <div className={cn('grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-700 bg-gray-800 overflow-hidden"
        >
          <LoadingSkeleton variant="rectangular" height={200} />
          <div className="p-6 space-y-3">
            <LoadingSkeleton variant="text" height={20} width="80%" />
            <LoadingSkeleton variant="text" height={16} width="100%" />
            <LoadingSkeleton variant="text" height={16} width="60%" />
            <div className="flex items-center justify-between pt-2">
              <LoadingSkeleton variant="rounded" height={24} width={80} />
              <LoadingSkeleton variant="rounded" height={24} width={100} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton for stats cards
 */
export const StatsCardSkeleton: React.FC<{ count?: number; className?: string }> = ({ 
  count = 4, 
  className 
}) => {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-700 bg-gray-800 p-6"
        >
          <LoadingSkeleton variant="text" height={14} width="60%" className="mb-2" />
          <LoadingSkeleton variant="text" height={32} width="40%" />
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton for profile/avatar
 */
export const AvatarSkeleton: React.FC<{ size?: number; className?: string }> = ({ 
  size = 40, 
  className 
}) => {
  return <LoadingSkeleton variant="circular" width={size} height={size} className={className} />;
};

/**
 * Skeleton for form inputs
 */
export const FormSkeleton: React.FC<{ fields?: number; className?: string }> = ({ 
  fields = 3, 
  className 
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <LoadingSkeleton variant="text" height={16} width="30%" />
          <LoadingSkeleton variant="rounded" height={40} width="100%" />
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton for page header
 */
export const PageHeaderSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('space-y-2 mb-6', className)}>
      <LoadingSkeleton variant="text" height={32} width="40%" />
      <LoadingSkeleton variant="text" height={16} width="60%" />
    </div>
  );
};

