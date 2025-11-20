'use client';

import React from 'react';
import { Input, Textarea, Select } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  required,
  children,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-400">{helperText}</p>
      )}
    </div>
  );
};

// Wrapper components for form fields with react-hook-form
export interface ControlledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const ControlledInput = React.forwardRef<HTMLInputElement, ControlledInputProps>(
  ({ label, error, helperText, required, className, ...props }, ref) => {
    return (
      <FormField label={label} error={error} helperText={helperText} required={required}>
        <Input
          ref={ref}
          error={error}
          className={className}
          {...props}
        />
      </FormField>
    );
  }
);
ControlledInput.displayName = 'ControlledInput';

export interface ControlledTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const ControlledTextarea = React.forwardRef<HTMLTextAreaElement, ControlledTextareaProps>(
  ({ label, error, helperText, required, className, ...props }, ref) => {
    return (
      <FormField label={label} error={error} helperText={helperText} required={required}>
        <Textarea
          ref={ref}
          error={error}
          className={className}
          {...props}
        />
      </FormField>
    );
  }
);
ControlledTextarea.displayName = 'ControlledTextarea';

export interface ControlledSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
}

export const ControlledSelect = React.forwardRef<HTMLSelectElement, ControlledSelectProps>(
  ({ label, error, helperText, required, options, className, ...props }, ref) => {
    return (
      <FormField label={label} error={error} helperText={helperText} required={required}>
        <Select
          ref={ref}
          error={error}
          options={options}
          className={className}
          {...props}
        />
      </FormField>
    );
  }
);
ControlledSelect.displayName = 'ControlledSelect';

