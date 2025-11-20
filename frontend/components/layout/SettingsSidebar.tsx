'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User, Settings as SettingsIcon, Lock, Bell, Shield, Accessibility } from 'lucide-react';

export interface SettingsSidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SettingsSidebarProps {
  items: SettingsSidebarItem[];
  className?: string;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ items, className }) => {
  const pathname = usePathname();
  
  const iconMap: Record<string, React.ReactNode> = {
    'Profile': <User className="h-5 w-5" />,
    'Account': <SettingsIcon className="h-5 w-5" />,
    'Security': <Lock className="h-5 w-5" />,
    'Notifications': <Bell className="h-5 w-5" />,
    'Privacy': <Shield className="h-5 w-5" />,
    'Accessibility': <Accessibility className="h-5 w-5" />,
  };
  
  return (
    <aside className={cn('bg-gray-800/50 rounded-lg border border-gray-700/50 p-4', className)}>
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                'hover:bg-gray-700/50',
                isActive
                  ? 'bg-gradient-to-r from-blue-600/20 to-blue-500/10 text-blue-400 border-l-2 border-blue-500'
                  : 'text-gray-300 hover:text-gray-100'
              )}
            >
              <span className="flex-shrink-0">
                {iconMap[item.label] || item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

