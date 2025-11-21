'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Avatar } from '@/components/ui';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-400">🐿️ SquirrelSquad</span>
            </Link>
          </div>

          <nav className="flex items-center space-x-6">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-300 hover:text-gray-100"
                >
                  Dashboard
                </Link>
                <Link
                  href="/courses"
                  className="text-sm font-medium text-gray-300 hover:text-gray-100"
                >
                  Courses
                </Link>
                <Link
                  href="/course-comparison"
                  className="text-sm font-medium text-gray-300 hover:text-gray-100"
                >
                  Compare Courses
                </Link>
                <Link
                  href="/waitlist"
                  className="text-sm font-medium text-gray-300 hover:text-gray-100"
                >
                  My Waitlist
                </Link>
                <Link
                  href="/learning-paths"
                  className="text-sm font-medium text-gray-300 hover:text-gray-100"
                >
                  Learning Paths
                </Link>
                <Link
                  href="/learning-goals"
                  className="text-sm font-medium text-gray-300 hover:text-gray-100"
                >
                  Learning Goals
                </Link>
                <Link
                  href="/mentorship"
                  className="text-sm font-medium text-gray-300 hover:text-gray-100"
                >
                  Mentorship
                </Link>
                <Link
                  href="/live-sessions"
                  className="text-sm font-medium text-gray-300 hover:text-gray-100"
                >
                  Live Sessions
                </Link>
                <Link
                  href="/analytics"
                  className="text-sm font-medium text-gray-300 hover:text-gray-100"
                >
                  Analytics
                </Link>
                <Link
                  href="/help"
                  className="text-sm font-medium text-gray-300 hover:text-gray-100"
                >
                  Help & Support
                </Link>
                <NotificationBell />
                {user._id && (
                  <Link href={`/profile/${user._id}`}>
                    <Avatar src={user.profilePhoto} name={user.username} size="sm" />
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-300 hover:text-gray-100"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

