import React from 'react';
import { cn } from '@/lib/utils';

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={radioId}
            type="radio"
            className={cn(
              'h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500',
              error && 'border-red-300',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {label && (
          <div className="ml-3 text-sm">
            <label htmlFor={radioId} className="font-medium text-gray-700">
              {label}
            </label>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export interface RadioGroupProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  onChange: (value: string) => void;
  name: string;
  error?: string;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  onChange,
  name,
  error,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {options.map((option) => (
        <Radio
          key={option.value}
          id={`${name}-${option.value}`}
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={() => onChange(option.value)}
          label={option.label}
          disabled={option.disabled}
        />
      ))}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

