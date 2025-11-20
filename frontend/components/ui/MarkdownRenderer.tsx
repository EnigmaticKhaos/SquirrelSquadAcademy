import React from 'react';
import { cn } from '@/lib/utils';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  // Simple markdown renderer - for production, consider using react-markdown or marked
  const renderMarkdown = (text: string) => {
    // Basic markdown parsing
    let html = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Code blocks
      .replace(/```([\s\S]*?)```/gim, '<pre class="bg-gray-100 p-4 rounded-md overflow-x-auto my-4"><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/gim, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Line breaks
      .replace(/\n\n/gim, '</p><p class="mb-4">')
      .replace(/\n/gim, '<br />');
    
    return `<p class="mb-4">${html}</p>`;
  };
  
  return (
    <div
      className={cn('prose prose-sm max-w-none', className)}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
};

