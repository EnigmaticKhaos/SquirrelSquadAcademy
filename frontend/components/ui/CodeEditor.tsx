'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'javascript',
  readOnly = false,
  className,
  placeholder = 'Enter your code here...',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Simple code editor using textarea with syntax highlighting via CSS
  // For production, consider using Monaco Editor or CodeMirror
  return (
    <div className={cn('relative w-full', className)}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-md border border-gray-300 bg-gray-50 p-4 font-mono text-sm',
          'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
          'resize-none',
          readOnly && 'cursor-not-allowed bg-gray-100'
        )}
        style={{ minHeight: '300px' }}
        spellCheck={false}
      />
      {language && (
        <div className="absolute top-2 right-2">
          <span className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600">
            {language}
          </span>
        </div>
      )}
    </div>
  );
};

