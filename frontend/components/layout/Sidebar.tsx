'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: number;
}

export interface SidebarProps {
  items: SidebarItem[];
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ items, className }) => {
  const pathname = usePathname();
  
  return (
    <aside className={cn('w-64 bg-gray-800 border-r border-gray-700', className)}>
      <nav className="p-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-900/50 text-blue-400'
                  : 'text-gray-300 hover:bg-gray-700'
              )}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="flex-shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

