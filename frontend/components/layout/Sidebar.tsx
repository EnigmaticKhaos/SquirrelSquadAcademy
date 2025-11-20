'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  GitCompare,
  Clock,
  GraduationCap,
  Target,
  Users,
  Video,
  BarChart3,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Trophy,
  FileText,
  Code,
  Search,
  Home,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  children?: NavItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, isMobile = false }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Main navigation items
  const mainNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: 'Courses', href: '/courses', icon: <BookOpen className="h-5 w-5" /> },
    { label: 'Compare Courses', href: '/course-comparison', icon: <GitCompare className="h-5 w-5" /> },
    { label: 'My Waitlist', href: '/waitlist', icon: <Clock className="h-5 w-5" /> },
    { label: 'Learning Paths', href: '/learning-paths', icon: <GraduationCap className="h-5 w-5" /> },
    { label: 'Learning Goals', href: '/learning-goals', icon: <Target className="h-5 w-5" /> },
    { label: 'Mentorship', href: '/mentorship', icon: <Users className="h-5 w-5" /> },
    { label: 'Live Sessions', href: '/live-sessions', icon: <Video className="h-5 w-5" /> },
    { label: 'Analytics', href: '/analytics', icon: <BarChart3 className="h-5 w-5" /> },
  ];

  // Secondary navigation items
  const secondaryNavItems: NavItem[] = [
    { label: 'Messages', href: '/messages', icon: <MessageSquare className="h-5 w-5" /> },
    { label: 'Search', href: '/search', icon: <Search className="h-5 w-5" /> },
    { label: 'Code Playground', href: '/playground', icon: <Code className="h-5 w-5" /> },
    { label: 'Notes', href: '/notes', icon: <FileText className="h-5 w-5" /> },
    { label: 'Achievements', href: '/achievements', icon: <Trophy className="h-5 w-5" /> },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const NavLink = ({ item, collapsed }: { item: NavItem; collapsed: boolean }) => {
    const active = isActive(item.href);
    
    return (
      <Link
        href={item.href}
        onClick={isMobile ? onToggle : undefined}
        className={cn(
          'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          'hover:bg-gray-700/50 hover:translate-x-1',
          active
            ? 'bg-gradient-to-r from-blue-600/20 to-blue-500/10 text-blue-400 border-l-2 border-blue-500 shadow-lg shadow-blue-500/10'
            : 'text-gray-300 hover:text-gray-100',
          collapsed && 'justify-center px-2'
        )}
        title={collapsed ? item.label : undefined}
      >
        <span className={cn('flex-shrink-0 transition-transform group-hover:scale-110', active && 'text-blue-400')}>
          {item.icon}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="flex-shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white animate-pulse">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  // Don't render on mobile when closed
  if (isMobile && !isOpen) return null;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900',
          'border-r border-gray-700/50 shadow-2xl transition-all duration-300 ease-in-out',
          isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0',
          isCollapsed && !isMobile ? 'w-20' : 'w-64',
          !isMobile && 'lg:block'
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          'flex items-center justify-between p-4 border-b border-gray-700/50',
          isCollapsed && !isMobile && 'justify-center px-2'
        )}>
          {(!isCollapsed || isMobile) && (
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity" />
                <span className="relative text-2xl font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                  🐿️ SquirrelSquad
                </span>
              </div>
            </Link>
          )}
          <div className="flex items-center gap-2">
            {!isMobile && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-gray-100 transition-colors hidden lg:flex"
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            {isMobile && (
              <button
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-gray-100 transition-colors"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {/* Main Navigation */}
          <div className="mb-6">
            {(!isCollapsed || isMobile) && (
              <div className="px-3 mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Main
                </p>
              </div>
            )}
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <NavLink key={item.href} item={item} collapsed={isCollapsed && !isMobile} />
              ))}
            </div>
          </div>

          {/* Secondary Navigation */}
          <div className="mb-6">
            {(!isCollapsed || isMobile) && (
              <div className="px-3 mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tools
                </p>
              </div>
            )}
            <div className="space-y-1">
              {secondaryNavItems.map((item) => (
                <NavLink key={item.href} item={item} collapsed={isCollapsed && !isMobile} />
              ))}
            </div>
          </div>
        </nav>

        {/* User Section */}
        {user && (
          <div className={cn(
            'p-4 border-t border-gray-700/50 space-y-2',
            isCollapsed && !isMobile && 'px-2'
          )}>
            {(!isCollapsed || isMobile) && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
                {user._id && (
                  <Link href={`/profile/${user._id}`} className="flex-shrink-0">
                    <Avatar src={user.profilePhoto} name={user.username} size="sm" />
                  </Link>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-100 truncate">{user.username}</p>
                  <p className="text-xs text-gray-400">Level {user.level || 1}</p>
                </div>
              </div>
            )}
            <div className={cn(
              'flex items-center gap-2',
              isCollapsed && !isMobile && 'justify-center'
            )}>
              <Link
                href="/settings"
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700/50 hover:text-gray-100 transition-colors flex-1',
                  isCollapsed && !isMobile && 'justify-center px-2'
                )}
                title={isCollapsed && !isMobile ? 'Settings' : undefined}
                onClick={isMobile ? onToggle : undefined}
              >
                <Settings className="h-5 w-5" />
                {(!isCollapsed || isMobile) && <span>Settings</span>}
              </Link>
              <button
                onClick={handleLogout}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors',
                  isCollapsed && !isMobile && 'px-2'
                )}
                title={isCollapsed && !isMobile ? 'Logout' : undefined}
              >
                <LogOut className="h-5 w-5" />
                {(!isCollapsed || isMobile) && <span>Logout</span>}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
