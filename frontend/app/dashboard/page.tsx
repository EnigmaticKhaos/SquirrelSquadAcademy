'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Course } from '@/types';

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
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-100">
              Welcome back, {user.username}! 👋
            </h1>
            <p className="mt-2 text-gray-400">
              Continue your learning journey and track your progress.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-sm">
              <div className="text-sm font-medium text-gray-400">Level</div>
              <div className="mt-2 text-3xl font-bold text-blue-400">{stats.level}</div>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-sm">
              <div className="text-sm font-medium text-gray-400">Total XP</div>
              <div className="mt-2 text-3xl font-bold text-green-400">{stats.totalXP}</div>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-sm">
              <div className="text-sm font-medium text-gray-400">Enrolled Courses</div>
              <div className="mt-2 text-3xl font-bold text-purple-400">{stats.enrolledCourses}</div>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-sm">
              <div className="text-sm font-medium text-gray-400">Completed</div>
              <div className="mt-2 text-3xl font-bold text-indigo-400">{stats.completedCourses}</div>
            </div>
          </div>

          {/* My Courses Section */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-100">My Courses</h2>
              <Link
                href="/courses"
                className="text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                Browse all courses →
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-400">Loading...</div>
              </div>
            ) : courses.length === 0 ? (
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-12 text-center">
                <p className="text-gray-400 mb-4">You haven't enrolled in any courses yet.</p>
                <Link
                  href="/courses"
                  className="inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course: Course) => (
                  <Link
                    key={course._id}
                    href={`/courses/${course._id}`}
                    className="group rounded-lg border border-gray-700 bg-gray-800 shadow-sm transition-shadow hover:shadow-md hover:border-gray-600"
                  >
                    {course.thumbnail && (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-48 w-full rounded-t-lg object-cover"
                      />
                    )}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-100 group-hover:text-blue-400">
                        {course.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                        {course.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">
                          {course.difficulty}
                        </span>
                        {course.averageRating && (
                          <span className="text-xs font-medium text-yellow-400">
                            ⭐ {course.averageRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

