'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { useCourses } from '@/hooks/useCourses';
import { useCompareCourses, useComparisonSummary } from '@/hooks/useCourseComparison';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
  SearchBar,
} from '@/components/ui';
import { PageHeader, Breadcrumbs } from '@/components/layout';
import { showToast } from '@/lib/toast';
import type { Course } from '@/types';
import type { CourseComparisonItem } from '@/lib/api/courseComparison';
import { X, Check, Star, Users, Clock, TrendingUp } from 'lucide-react';

export default function CourseComparisonPage() {
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showComparison, setShowComparison] = useState(false);

  const { data: coursesData, isLoading: coursesLoading } = useCourses({ limit: 100 });
  const compareMutation = useCompareCourses();
  const summaryMutation = useComparisonSummary();

  const courses = coursesData?.data || [];
  const comparison = compareMutation.data?.comparison;
  const summary = summaryMutation.data;

  // Filter courses based on search
  const filteredCourses = useMemo(() => {
    if (!searchQuery) return courses;
    const query = searchQuery.toLowerCase();
    return courses.filter(
      (course) =>
        course.title?.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query) ||
        course.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [courses, searchQuery]);

  const handleToggleCourse = (courseId: string) => {
    if (selectedCourseIds.includes(courseId)) {
      setSelectedCourseIds(selectedCourseIds.filter((id) => id !== courseId));
    } else {
      if (selectedCourseIds.length >= 5) {
        showToast.warning('Maximum 5 courses can be compared at once');
        return;
      }
      setSelectedCourseIds([...selectedCourseIds, courseId]);
    }
  };

  const handleCompare = async () => {
    if (selectedCourseIds.length < 2) {
      showToast.warning('Please select at least 2 courses to compare');
      return;
    }

    try {
      await compareMutation.mutateAsync(selectedCourseIds);
      await summaryMutation.mutateAsync(selectedCourseIds);
      setShowComparison(true);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleClearSelection = () => {
    setSelectedCourseIds([]);
    setShowComparison(false);
    compareMutation.reset();
    summaryMutation.reset();
  };

  const selectedCourses = courses.filter((c) => selectedCourseIds.includes(c._id));

  const difficultyColors = {
    beginner: 'bg-green-600',
    intermediate: 'bg-yellow-600',
    advanced: 'bg-orange-600',
    expert: 'bg-red-600',
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Courses', href: '/courses' },
              { label: 'Compare Courses' },
            ]}
          />

          <PageHeader
            title="Compare Courses"
            description="Select up to 5 courses to compare side-by-side and make an informed decision."
          />

          {/* Selected Courses Bar */}
          {selectedCourseIds.length > 0 && (
            <Card className="mb-6 border-blue-600 bg-blue-900/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-300">
                      {selectedCourseIds.length} course{selectedCourseIds.length !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedCourses.map((course) => (
                        <Badge
                          key={course._id}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {course.title}
                          <button
                            onClick={() => handleToggleCourse(course._id)}
                            className="ml-1 hover:text-red-400"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!showComparison && (
                      <Button
                        onClick={handleCompare}
                        disabled={selectedCourseIds.length < 2 || compareMutation.isPending}
                        isLoading={compareMutation.isPending}
                      >
                        Compare Courses
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleClearSelection}>
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comparison Results */}
          {showComparison && comparison && (
            <div className="mb-8 space-y-6">
              {/* Summary Metrics */}
              {summary && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="text-sm text-gray-400">Rating Range</p>
                          <p className="text-lg font-semibold text-gray-100">
                            {summary.ratingRange.min.toFixed(1)} - {summary.ratingRange.max.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-400">Total Enrollments</p>
                          <p className="text-lg font-semibold text-gray-100">
                            {summary.totalEnrollments.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm text-gray-400">Duration Range</p>
                          <p className="text-lg font-semibold text-gray-100">
                            {formatDuration(summary.durationRange.min)} - {formatDuration(summary.durationRange.max)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="text-sm text-gray-400">Price Range</p>
                          <p className="text-lg font-semibold text-gray-100">
                            {summary.priceRange.freeCount > 0 && summary.priceRange.min === 0
                              ? 'Free+'
                              : summary.priceRange.min > 0
                              ? `$${summary.priceRange.min} - $${summary.priceRange.max}`
                              : 'Free'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Highlights */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-100">Comparison Highlights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
                      <p className="text-sm text-gray-400 mb-1">Highest Rated</p>
                      <p className="font-medium text-gray-100">
                        {comparison.metrics.highestRated.course.title}
                      </p>
                      <p className="text-sm text-gray-400">
                        {comparison.metrics.highestRated.statistics.averageRating.toFixed(1)} ⭐
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
                      <p className="text-sm text-gray-400 mb-1">Most Popular</p>
                      <p className="font-medium text-gray-100">
                        {comparison.metrics.mostRated.course.title}
                      </p>
                      <p className="text-sm text-gray-400">
                        {comparison.metrics.mostRated.statistics.reviewCount} reviews
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
                      <p className="text-sm text-gray-400 mb-1">Best Completion Rate</p>
                      <p className="font-medium text-gray-100">
                        {comparison.metrics.highestCompletionRate.course.title}
                      </p>
                      <p className="text-sm text-gray-400">
                        {comparison.metrics.highestCompletionRate.statistics.completionRate}%
                      </p>
                    </div>
                    {!comparison.metrics.cheapest.course.isFree && (
                      <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
                        <p className="text-sm text-gray-400 mb-1">Best Value</p>
                        <p className="font-medium text-gray-100">
                          {comparison.metrics.cheapest.course.title}
                        </p>
                        <p className="text-sm text-gray-400">
                          ${comparison.metrics.cheapest.course.price}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Side-by-Side Comparison Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-100">Detailed Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                            Feature
                          </th>
                          {comparison.courses.map((item: CourseComparisonItem) => (
                            <th
                              key={item.course._id}
                              className="px-4 py-3 text-left text-sm font-medium text-gray-300 min-w-[200px]"
                            >
                              <div className="flex flex-col gap-2">
                                {item.course.thumbnail && (
                                  <img
                                    src={item.course.thumbnail}
                                    alt={item.course.title}
                                    className="h-24 w-full rounded object-cover"
                                  />
                                )}
                                <Link
                                  href={`/courses/${item.course._id}`}
                                  className="font-semibold text-blue-400 hover:text-blue-300"
                                >
                                  {item.course.title}
                                </Link>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {/* Price */}
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-300">Price</td>
                          {comparison.courses.map((item: CourseComparisonItem) => (
                            <td key={item.course._id} className="px-4 py-3 text-sm text-gray-100">
                              {item.course.isFree ? (
                                <Badge variant="success">Free</Badge>
                              ) : (
                                `$${item.course.price} ${item.course.currency || 'USD'}`
                              )}
                            </td>
                          ))}
                        </tr>

                        {/* Difficulty */}
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-300">Difficulty</td>
                          {comparison.courses.map((item: CourseComparisonItem) => (
                            <td key={item.course._id} className="px-4 py-3">
                              <Badge
                                className={
                                  difficultyColors[item.course.difficulty as keyof typeof difficultyColors] ||
                                  'bg-gray-600'
                                }
                              >
                                {item.course.difficulty}
                              </Badge>
                            </td>
                          ))}
                        </tr>

                        {/* Duration */}
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-300">Duration</td>
                          {comparison.courses.map((item: CourseComparisonItem) => (
                            <td key={item.course._id} className="px-4 py-3 text-sm text-gray-100">
                              {formatDuration(item.course.estimatedDuration)}
                            </td>
                          ))}
                        </tr>

                        {/* Type */}
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-300">Type</td>
                          {comparison.courses.map((item: CourseComparisonItem) => (
                            <td key={item.course._id} className="px-4 py-3 text-sm text-gray-100">
                              {item.course.courseType}
                            </td>
                          ))}
                        </tr>

                        {/* Rating */}
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-300">Rating</td>
                          {comparison.courses.map((item: CourseComparisonItem) => (
                            <td key={item.course._id} className="px-4 py-3 text-sm text-gray-100">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                <span>{item.statistics.averageRating.toFixed(1)}</span>
                                <span className="text-gray-500">
                                  ({item.statistics.reviewCount} reviews)
                                </span>
                              </div>
                            </td>
                          ))}
                        </tr>

                        {/* Enrollments */}
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-300">Enrollments</td>
                          {comparison.courses.map((item: CourseComparisonItem) => (
                            <td key={item.course._id} className="px-4 py-3 text-sm text-gray-100">
                              {item.statistics.enrollmentCount.toLocaleString()}
                            </td>
                          ))}
                        </tr>

                        {/* Completion Rate */}
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-300">Completion Rate</td>
                          {comparison.courses.map((item: CourseComparisonItem) => (
                            <td key={item.course._id} className="px-4 py-3 text-sm text-gray-100">
                              {item.statistics.completionRate}%
                            </td>
                          ))}
                        </tr>

                        {/* Modules */}
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-300">Modules</td>
                          {comparison.courses.map((item: CourseComparisonItem) => (
                            <td key={item.course._id} className="px-4 py-3 text-sm text-gray-100">
                              {item.statistics.totalModules}
                            </td>
                          ))}
                        </tr>

                        {/* Lessons */}
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-300">Lessons</td>
                          {comparison.courses.map((item: CourseComparisonItem) => (
                            <td key={item.course._id} className="px-4 py-3 text-sm text-gray-100">
                              {item.statistics.totalLessons}
                            </td>
                          ))}
                        </tr>

                        {/* Tags */}
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-300">Tags</td>
                          {comparison.courses.map((item: CourseComparisonItem) => (
                            <td key={item.course._id} className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {item.course.tags?.slice(0, 5).map((tag) => (
                                  <Badge key={tag} variant="secondary" size="sm">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                          ))}
                        </tr>

                        {/* Actions */}
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-300">Actions</td>
                          {comparison.courses.map((item: CourseComparisonItem) => (
                            <td key={item.course._id} className="px-4 py-3">
                              <Link href={`/courses/${item.course._id}`}>
                                <Button variant="primary" size="sm">
                                  View Course
                                </Button>
                              </Link>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Course Selection */}
          {!showComparison && (
            <>
              <div className="mb-6">
                <SearchBar
                  placeholder="Search courses to compare..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                />
              </div>

              {coursesLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : filteredCourses.length === 0 ? (
                <EmptyState
                  title="No courses found"
                  description="Try adjusting your search or filters"
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCourses.map((course) => {
                    const isSelected = selectedCourseIds.includes(course._id);
                    return (
                      <Card
                        key={course._id}
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-900/20 ring-2 ring-blue-600'
                            : 'hover:border-gray-600'
                        }`}
                        onClick={() => handleToggleCourse(course._id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-100 line-clamp-2 mb-2">
                                {course.title}
                              </h3>
                              <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                                {course.description}
                              </p>
                              <div className="flex flex-wrap gap-2 mb-2">
                                <Badge
                                  className={
                                    difficultyColors[course.difficulty as keyof typeof difficultyColors] ||
                                    'bg-gray-600'
                                  }
                                  size="sm"
                                >
                                  {course.difficulty}
                                </Badge>
                                {course.isFree && (
                                  <Badge variant="success" size="sm">
                                    Free
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {isSelected ? (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                                  <Check className="h-5 w-5 text-white" />
                                </div>
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-600" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
    </AppLayout>
  );
}

