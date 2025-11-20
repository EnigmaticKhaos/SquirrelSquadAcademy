'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onChange?: (value: string) => void;
  value?: string;
  className?: string;
  debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  onSearch,
  onChange,
  value: controlledValue,
  className,
  debounceMs = 300,
}) => {
  const [internalQuery, setInternalQuery] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  const query = controlledValue !== undefined ? controlledValue : internalQuery;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (controlledValue === undefined) {
      setInternalQuery(value);
    }
    
    if (onChange) {
      onChange(value);
    }
    
    if (onSearch) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      const timer = setTimeout(() => {
        onSearch(value);
      }, debounceMs);
      
      setDebounceTimer(timer);
    }
  };
  
  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md leading-5 bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
    </div>
  );
};

