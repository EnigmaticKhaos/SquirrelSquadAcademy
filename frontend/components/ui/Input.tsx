import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1">
            {label}
          </label>
        )}
        <input
          id={inputId}
          className={cn(
            'block w-full rounded-md border px-3 py-2 text-sm bg-gray-800 text-gray-100',
            'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
            error
              ? 'border-red-600 text-red-200 placeholder-red-400 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-700 placeholder-gray-500',
            'disabled:bg-gray-900 disabled:text-gray-500 disabled:cursor-not-allowed',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

