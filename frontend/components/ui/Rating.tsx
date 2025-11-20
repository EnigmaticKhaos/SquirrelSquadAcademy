import React from 'react';
import { cn } from '@/lib/utils';

export interface RatingProps {
  value: number; // 0-5
  max?: number;
  readonly?: boolean;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  max = 5,
  readonly = false,
  onChange,
  size = 'md',
  showValue = false,
  className,
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };
  
  const handleClick = (newValue: number) => {
    if (!readonly && onChange) {
      onChange(newValue);
    }
  };
  
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          disabled={readonly}
          className={cn(
            'text-yellow-400 transition-colors',
            readonly ? 'cursor-default' : 'cursor-pointer hover:text-yellow-500',
            sizes[size]
          )}
        >
          <svg
            fill={star <= value ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
            className="w-full h-full"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </button>
      ))}
      {showValue && (
        <span className="ml-2 text-sm text-gray-600">{value.toFixed(1)}</span>
      )}
    </div>
  );
};

