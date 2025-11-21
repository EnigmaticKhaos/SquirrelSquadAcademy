'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CookieConsentBanner } from './CookieConsentBanner';
import { ErrorBoundaryWrapper } from '@/components/ErrorBoundaryWrapper';

interface AppLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, requireAuth = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 1024);
        // Close sidebar on mobile by default
        if (window.innerWidth < 1024) {
          setSidebarOpen(false);
        }
      }
    };

    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-sidebar]') && !target.closest('[data-sidebar-toggle]')) {
          setSidebarOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobile, sidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900">
      {/* Sidebar */}
      <div data-sidebar className="hidden lg:block">
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} isMobile={isMobile} />
      </div>
      
      {/* Mobile Sidebar */}
      <div data-sidebar className="lg:hidden">
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} isMobile={true} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <div data-sidebar-toggle>
          <TopBar onMenuToggle={toggleSidebar} isMobile={isMobile} />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-gray-900">
          <ErrorBoundaryWrapper level="page">
            {children}
          </ErrorBoundaryWrapper>
        </main>
      </div>
      
      {/* Cookie Consent Banner */}
      <CookieConsentBanner />
    </div>
  );
};

