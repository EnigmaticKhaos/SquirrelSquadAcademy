'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, Avatar, Badge, ProgressBar, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile, useUserStats } from '@/hooks/useUserProfile';

export default function ProfilePage() {
  const params = useParams();
  const { userId } = params as { userId: string };
  const { user: currentUser } = useAuth();
  const { data: user, isLoading: userLoading, error: userError } = useUserProfile(userId);
  const { data: stats, isLoading: statsLoading } = useUserStats(userId);
  
  // Handle undefined userId
  if (!userId || userId === 'undefined') {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-900 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-8">
              <ErrorMessage message="Invalid user profile" />
              <Link href="/" className="mt-4 inline-block text-blue-400 hover:text-blue-300">
                Go Home
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  const isOwnProfile = currentUser?._id === userId;

  if (userLoading || statsLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-900 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </main>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-900 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-8">
              <ErrorMessage message="Failed to load user profile" />
              <Link href="/" className="mt-4 inline-block text-blue-400 hover:text-blue-300">
                Go Home
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Profile', href: `/profile/${userId}` },
            ]}
          />

          <div className="mt-8">
            {/* Profile Header */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <Avatar src={user.profilePhoto || undefined} name={user.username} size="xl" />
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-gray-100">{user.username}</h1>
                      {isOwnProfile && (
                        <Link href="/settings/profile">
                          <button className="rounded-md border border-gray-600 bg-gray-800 px-3 py-1 text-sm text-gray-100 hover:bg-gray-700">
                            Edit Profile
                          </button>
                        </Link>
                      )}
                    </div>
                    {user.bio && <p className="mb-4 text-gray-400">{user.bio}</p>}
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Level</p>
                        <p className="text-lg font-semibold text-gray-100">{user.level || 1}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">XP</p>
                        <p className="text-lg font-semibold text-gray-100">{(user.xp || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-gray-100">Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-gray-100">{stats?.achievements || 0}</p>
                  <Link href={`/profile/${userId}/achievements`} className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
                    View all →
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-gray-100">Badges</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-gray-100">{stats?.badges || 0}</p>
                  <Link href={`/profile/${userId}/badges`} className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
                    View all →
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-gray-100">Courses Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-gray-100">{stats?.completedCourses || 0}</p>
                  <Link href="/courses" className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
                    Browse courses →
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

