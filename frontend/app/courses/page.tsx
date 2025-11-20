'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useCourses } from '@/hooks/useCourses';
import { Card, CardContent, Badge, LoadingSpinner, ErrorMessage, EmptyState, SearchBar, FilterPanel } from '@/components/ui';
import { PageHeader } from '@/components/layout';

export default function CoursesPage() {
  const [filters, setFilters] = useState({
    courseType: '',
    difficulty: '',
    category: '',
    search: '',
  });

  const { data, isLoading, error } = useCourses(filters);
  const courses = data?.data || [];

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Courses"
            description="Explore our collection of courses and start learning today."
          />

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <SearchBar
              placeholder="Search courses..."
              value={filters.search}
              onChange={(value) => setFilters({ ...filters, search: value })}
            />
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={filters.courseType}
                    onChange={(e) => setFilters({ ...filters, courseType: e.target.value })}
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="coding">Coding</option>
                    <option value="non-coding">Non-Coding</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  >
                    <option value="">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    placeholder="Filter by category"
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <ErrorMessage message="Failed to load courses. Please try again." />
          ) : courses.length === 0 ? (
            <EmptyState
              title="No courses found"
              description="Try adjusting your filters or search terms."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Link key={course._id} href={`/courses/${course._id}`}>
                  <Card hover className="h-full">
                    {course.thumbnail && (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-48 w-full rounded-t-lg object-cover"
                      />
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">{course.courseType}</Badge>
                        {course.isFree ? (
                          <Badge variant="success">Free</Badge>
                        ) : (
                          <span className="text-sm font-semibold text-gray-100">
                            ${course.price}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-100 mb-2 group-hover:text-blue-400">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                        {course.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-400 capitalize">
                          {course.difficulty}
                        </span>
                        {course.averageRating && (
                          <span className="font-medium text-yellow-400">
                            ⭐ {course.averageRating.toFixed(1)} ({course.reviewCount || 0})
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {course.enrollmentCount || 0} students enrolled
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

