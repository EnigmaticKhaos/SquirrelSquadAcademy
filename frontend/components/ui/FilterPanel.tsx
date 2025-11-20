'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Select, SelectProps } from './Select';
import { Checkbox } from './Checkbox';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  type: 'select' | 'checkbox' | 'range';
  label: string;
  key: string;
  options?: FilterOption[];
  min?: number;
  max?: number;
}

export interface FilterPanelProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onReset?: () => void;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  values,
  onChange,
  onReset,
  className,
}) => {
  return (
    <div className={cn('rounded-lg border border-gray-700 bg-gray-800 p-4', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">Filters</h3>
        {onReset && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Reset
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        {filters.map((filter) => (
          <div key={filter.key}>
            {filter.type === 'select' && filter.options && (
              <Select
                label={filter.label}
                options={filter.options}
                value={values[filter.key] || ''}
                onChange={(e) => onChange(filter.key, e.target.value)}
              />
            )}
            
            {filter.type === 'checkbox' && filter.options && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {filter.label}
                </label>
                <div className="space-y-2">
                  {filter.options.map((option) => (
                    <Checkbox
                      key={option.value}
                      label={option.label}
                      checked={values[filter.key]?.includes(option.value) || false}
                      onChange={(e) => {
                        const current = values[filter.key] || [];
                        const newValue = e.target.checked
                          ? [...current, option.value]
                          : current.filter((v: string) => v !== option.value);
                        onChange(filter.key, newValue);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {filter.type === 'range' && filter.min !== undefined && filter.max !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {filter.label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={filter.min}
                    max={filter.max}
                    value={values[filter.key]?.min || filter.min}
                    onChange={(e) =>
                      onChange(filter.key, {
                        ...values[filter.key],
                        min: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    min={filter.min}
                    max={filter.max}
                    value={values[filter.key]?.max || filter.max}
                    onChange={(e) =>
                      onChange(filter.key, {
                        ...values[filter.key],
                        max: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

