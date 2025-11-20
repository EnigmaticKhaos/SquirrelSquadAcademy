'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Avatar, Button } from '@/components/ui';
import { Menu, Search, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  onMenuToggle: () => void;
  isMobile?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuToggle, isMobile = false }) => {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-lg border-b border-gray-700/50 shadow-lg">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Menu toggle and logo (mobile) */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-100 transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          {/* Logo - hidden on mobile when menu is available */}
          <Link href="/" className="flex items-center gap-2 group hidden lg:flex">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity" />
              <span className="relative text-xl font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                🐿️ SquirrelSquad
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search bar (desktop) */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-8">
          <Link
            href="/search"
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors group"
          >
            <Search className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">Search courses, users, posts...</span>
            <kbd className="ml-auto hidden lg:flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-900/50 rounded border border-gray-700/50">
              <span>⌘</span>
              <span>K</span>
            </kbd>
          </Link>
        </div>

        {/* Right: User actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Search button (mobile) */}
              <Link
                href="/search"
                className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-100 transition-colors md:hidden"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Link>

              {/* Notifications */}
              <div className="hidden sm:block">
                <NotificationBell />
              </div>

              {/* Profile */}
              {user._id && (
                <Link
                  href={`/profile/${user._id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
                >
                  <Avatar src={user.profilePhoto} name={user.username} size="sm" />
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-gray-100 group-hover:text-blue-400 transition-colors">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      Level {user.level || 1} • {user.xp || 0} XP
                    </p>
                  </div>
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

