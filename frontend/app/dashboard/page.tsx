'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Course } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { BookOpen, Trophy, TrendingUp, Award } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    totalXP: 0,
    level: 1,
  });

  useEffect(() => {
    // Only redirect if we're sure there's no user (not loading and no token)
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');
    
    if (!isLoading && !user && !hasToken) {
      router.push('/login');
      return;
    }

    // If we have a token but no user yet, wait a bit (might be loading)
    // If we have a user, fetch dashboard data
    if (user) {
      fetchDashboardData();
    }
  }, [user, isLoading, router]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user's enrolled courses
      const coursesResponse = await api.get('/courses/enrolled');
      if (coursesResponse.data.success) {
        const fetchedCourses = coursesResponse.data.courses || [];
        setCourses(fetchedCourses);
        
        // Update stats with fetched courses count
        if (user) {
          setStats({
            enrolledCourses: fetchedCourses.length,
            completedCourses: 0, // TODO: Fetch from enrollments endpoint to get actual completion count
            totalXP: user.xp || 0,
            level: user.level || 1,
          });
        }
      }
    } catch (error: any) {
      // If 401, user might not be authenticated - redirect handled by interceptor
      if (error.response?.status !== 401) {
        console.error('Failed to fetch dashboard data:', error);
        // Set empty courses on error
        setCourses([]);
        if (user) {
          setStats({
            enrolledCourses: 0,
            completedCourses: 0,
            totalXP: user.xp || 0,
            level: user.level || 1,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
            Welcome back, {user.username}! 👋
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Continue your learning journey and track your progress.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-700/50 hover:border-blue-600/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">Level</div>
                  <div className="text-3xl font-bold text-blue-400">{stats.level}</div>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Trophy className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-700/50 hover:border-green-600/50 transition-all hover:shadow-lg hover:shadow-green-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">Total XP</div>
                  <div className="text-3xl font-bold text-green-400">{stats.totalXP}</div>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-700/50 hover:border-purple-600/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">Enrolled Courses</div>
                  <div className="text-3xl font-bold text-purple-400">{stats.enrolledCourses}</div>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <BookOpen className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 border-indigo-700/50 hover:border-indigo-600/50 transition-all hover:shadow-lg hover:shadow-indigo-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">Completed</div>
                  <div className="text-3xl font-bold text-indigo-400">{stats.completedCourses}</div>
                </div>
                <div className="p-3 rounded-lg bg-indigo-500/10">
                  <Award className="h-6 w-6 text-indigo-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Courses Section */}
        <div className="mb-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-100">My Courses</h2>
              <p className="mt-1 text-sm text-gray-400">Continue your learning journey</p>
            </div>
            <Link
              href="/courses"
              className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              Browse all courses <span>→</span>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-400">Loading...</div>
            </div>
          ) : courses.length === 0 ? (
            <Card className="p-12 text-center bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
              <CardContent className="p-0">
                <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4 text-lg">You haven't enrolled in any courses yet.</p>
                <Link
                  href="/courses"
                  className="inline-flex rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-medium text-white hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                >
                  Browse Courses
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course: Course) => (
                <Link
                  key={course._id}
                  href={`/courses/${course._id}`}
                  className="group"
                >
                  <Card className="h-full hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1">
                    {course.thumbnail && (
                      <div className="relative overflow-hidden rounded-t-lg">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent" />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-100 group-hover:text-blue-400 transition-colors mb-2">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                        {course.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium px-2 py-1 rounded bg-gray-700 text-gray-300">
                          {course.difficulty}
                        </span>
                        {course.averageRating && (
                          <span className="text-xs font-medium text-yellow-400 flex items-center gap-1">
                            ⭐ {course.averageRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

