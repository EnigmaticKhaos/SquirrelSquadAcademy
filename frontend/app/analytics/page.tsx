'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Header from '@/components/layout/Header';
import { PageHeader } from '@/components/layout';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  LoadingSpinner,
  Select,
} from '@/components/ui';
import { AnalyticsSummaryCard } from '@/components/analytics';
import {
  useLearningAnalytics,
  useLearningCalendar,
  usePerformanceMetrics,
} from '@/hooks/useLearningAnalytics';
import type { LearningCalendarDay } from '@/types';

const RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
  { value: 'all', label: 'All time' },
];

const accentColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-rose-500'];

const secondsToHoursLabel = (seconds: number) => `${(seconds / 3600).toFixed(1)}h`;

const formatDuration = (seconds: number) => {
  if (!seconds) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
};

const createCalendarMap = (entries: LearningCalendarDay[]) => {
  return entries.reduce<Record<string, LearningCalendarDay>>((acc, day) => {
    acc[day.date] = day;
    return acc;
  }, {});
};

const getDaysInMonth = (year: number, month: number) => {
  const date = new Date(year, month - 1, 1);
  const days: Date[] = [];
  while (date.getMonth() === month - 1) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export default function AnalyticsPage() {
  const [range, setRange] = useState('30d');
  const [courseFilter, setCourseFilter] = useState('all');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const dateFilters = useMemo(() => {
    if (range === 'all') return {};
    const option = RANGE_OPTIONS.find((opt) => opt.value === range);
    if (!option || !option.days) return {};
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - option.days);
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }, [range]);

  const analyticsFilters = useMemo(() => {
    const filters: Record<string, string> = {};
    if (courseFilter !== 'all') {
      filters.courseId = courseFilter;
    }
    if (dateFilters.startDate) filters.startDate = dateFilters.startDate;
    if (dateFilters.endDate) filters.endDate = dateFilters.endDate;
    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [courseFilter, dateFilters]);

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isFetching: analyticsFetching,
  } = useLearningAnalytics(analyticsFilters);
  const { data: performance, isLoading: performanceLoading } = usePerformanceMetrics();
  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth() + 1;
  const { data: calendarData, isLoading: calendarLoading } = useLearningCalendar({
    year: calendarYear,
    month: calendarMonthIndex,
  });

  const courseOptions = useMemo(() => {
    const options = analytics?.timeByCourse || [];
    return [
      { value: 'all', label: 'All courses' },
      ...options.map((course) => ({
        value: course.courseId,
        label: course.courseName || 'Untitled course',
      })),
    ];
  }, [analytics?.timeByCourse]);

  const activityChartData = useMemo(() => {
    if (!analytics) return [];
    return Object.entries(analytics.timeByActivity || {}).map(([key, value]) => ({
      activity: key,
      hours: Number((value / 3600).toFixed(2)),
    }));
  }, [analytics]);

  const weeklyChartData = useMemo(() => {
    if (!analytics) return [];
    return analytics.weeklyActivity.map((item) => ({
      date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      hours: Number((item.timeSpent / 3600).toFixed(2)),
      sessions: item.sessions,
    }));
  }, [analytics]);

  const monthlyChartData = useMemo(() => {
    if (!analytics) return [];
    return analytics.monthlyActivity.map((item) => ({
      month: item.month,
      hours: Number((item.timeSpent / 3600).toFixed(1)),
    }));
  }, [analytics]);

  const calendarMap = useMemo(() => createCalendarMap(calendarData || []), [calendarData]);
  const daysInMonth = useMemo(
    () => getDaysInMonth(calendarYear, calendarMonthIndex),
    [calendarYear, calendarMonthIndex]
  );

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCalendarMonth((prev) => {
      const next = new Date(prev);
      if (direction === 'prev') {
        next.setMonth(prev.getMonth() - 1);
      } else {
        next.setMonth(prev.getMonth() + 1);
      }
      return next;
    });
  };

  const isLoading = analyticsLoading || performanceLoading;

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Learning Analytics"
            description="Track your study habits, streaks, and performance trends across SquirrelSquad."
            actions={
              <div className="flex gap-3">
                <Select
                  value={range}
                  onChange={(event) => setRange(event.target.value)}
                  options={RANGE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  className="w-40"
                />
                <Select
                  value={courseFilter}
                  onChange={(event) => setCourseFilter(event.target.value)}
                  options={courseOptions}
                  className="w-48"
                />
              </div>
            }
          />

          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!isLoading && analytics && (
            <>
              <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AnalyticsSummaryCard
                  title="Total Study Time"
                  value={formatDuration(analytics.totalTimeSpent)}
                  description={`${analytics.totalSessions} sessions`}
                  accent={accentColors[0]}
                />
                <AnalyticsSummaryCard
                  title="Avg Session"
                  value={formatDuration(analytics.averageSessionDuration)}
                  description="per session"
                  accent={accentColors[1]}
                />
                <AnalyticsSummaryCard
                  title="Courses Completed"
                  value={`${analytics.coursesCompleted}`}
                  description={`${analytics.coursesInProgress} active`}
                  accent={accentColors[2]}
                />
                <AnalyticsSummaryCard
                  title="Assignments"
                  value={`${analytics.assignmentsCompleted}`}
                  description={`Avg score ${Math.round(analytics.averageScore)}%`}
                  accent={accentColors[3]}
                />
              </section>

              <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="h-96">
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-100">Weekly Activity</CardTitle>
                    {analyticsFetching && <span className="text-xs text-gray-400">Refreshing…</span>}
                  </CardHeader>
                  <CardContent className="h-full">
                    {weeklyChartData.length === 0 ? (
                      <EmptyState
                        title="No activity yet"
                        description="Start a learning session to populate your analytics."
                      />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weeklyChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="date" stroke="#9CA3AF" />
                          <YAxis
                            yAxisId="hours"
                            stroke="#9CA3AF"
                            tickFormatter={(val) => `${val}h`}
                          />
                          <YAxis
                            yAxisId="sessions"
                            orientation="right"
                            stroke="#9CA3AF"
                            tickFormatter={(val) => `${val}x`}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937' }}
                            formatter={(value: number, name) =>
                              name === 'hours' ? [`${value}h`, 'Time'] : [`${value}`, 'Sessions']
                            }
                          />
                          <Line
                            yAxisId="hours"
                            type="monotone"
                            dataKey="hours"
                            stroke="#60A5FA"
                            strokeWidth={3}
                            dot={false}
                          />
                          <Line
                            yAxisId="sessions"
                            type="monotone"
                            dataKey="sessions"
                            stroke="#F472B6"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card className="h-96">
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-100">Time by Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="h-full">
                    {activityChartData.length === 0 ? (
                      <EmptyState
                        title="No activity mix yet"
                        description="Complete some lessons, quizzes, or assignments to see insights."
                      />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activityChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="activity" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" tickFormatter={(val) => `${val}h`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937' }}
                            formatter={(value: number) => [`${value}h`, 'Hours']}
                          />
                          <Bar dataKey="hours" fill="#34D399" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </section>

              <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="col-span-1 lg:col-span-2">
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-100">Monthly Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    {monthlyChartData.length === 0 ? (
                      <EmptyState
                        title="No monthly data yet"
                        description="Once you have a few weeks of learning activity, trends will appear here."
                      />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="month" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" tickFormatter={(val) => `${val}h`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937' }}
                            formatter={(value: number) => [`${value}h`, 'Hours']}
                          />
                          <Line
                            type="monotone"
                            dataKey="hours"
                            stroke="#C084FC"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#C084FC' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-100">Streaks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400">Login streak</p>
                      <p className="text-3xl font-semibold text-gray-100">
                        {analytics.currentStreaks.login} days
                      </p>
                      <p className="text-xs text-gray-500">
                        Longest: {analytics.longestStreaks.login} days
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Activity streak</p>
                      <p className="text-3xl font-semibold text-gray-100">
                        {analytics.currentStreaks.activity} days
                      </p>
                      <p className="text-xs text-gray-500">
                        Longest: {analytics.longestStreaks.activity} days
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Top courses</p>
                      <ul className="mt-2 space-y-2 text-sm text-gray-300">
                        {(analytics.timeByCourse || [])
                          .slice(0, 3)
                          .map((course) => (
                            <li key={course.courseId} className="flex items-center justify-between">
                              <span>{course.courseName || 'Untitled course'}</span>
                              <span className="text-gray-400">
                                {secondsToHoursLabel(course.timeSpent)}
                              </span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-100">Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {performanceLoading ? (
                      <div className="flex justify-center py-12">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-400">Average Score</p>
                            <p className="text-3xl font-semibold text-gray-100">
                              {performance ? Math.round(performance.overallAverageScore) : 0}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Completion Rate</p>
                            <p className="text-3xl font-semibold text-gray-100">
                              {performance ? performance.completionRate.toFixed(0) : 0}%
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Trend</p>
                          <p className="text-lg font-medium text-gray-100 capitalize">
                            {performance?.improvementTrend || 'N/A'}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-green-400">Strong Areas</p>
                            <ul className="mt-2 space-y-1 text-sm text-gray-300">
                              {!performance || performance.strongAreas.length === 0 ? (
                                <li className="text-gray-500">Not enough data</li>
                              ) : (
                                performance.strongAreas.map((course) => (
                                  <li key={course}>{course}</li>
                                ))
                              )}
                            </ul>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-rose-400">Focus Areas</p>
                            <ul className="mt-2 space-y-1 text-sm text-gray-300">
                              {!performance || performance.weakAreas.length === 0 ? (
                                <li className="text-gray-500">Not enough data</li>
                              ) : (
                                performance.weakAreas.map((course) => (
                                  <li key={course}>{course}</li>
                                ))
                              )}
                            </ul>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-100">Learning Calendar</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={() => handleMonthChange('prev')}>
                        ←
                      </Button>
                      <p className="text-sm text-gray-300">
                        {calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </p>
                      <Button variant="ghost" onClick={() => handleMonthChange('next')}>
                        →
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {calendarLoading ? (
                      <div className="flex justify-center py-12">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-500">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <span key={day}>{day}</span>
                        ))}
                        {daysInMonth.map((date) => {
                          const iso = date.toISOString().split('T')[0];
                          const entry = calendarMap[iso];
                          const intensity = entry ? Math.min(entry.timeSpent / 1800, 1) : 0;
                          const backgroundColor =
                            intensity === 0
                              ? '#1f2937'
                              : `rgba(16, 185, 129, ${0.35 + intensity * 0.65})`;
                          const textColor = intensity === 0 ? 'text-gray-400' : 'text-gray-900';
                          return (
                            <div
                              key={iso}
                              className={`flex h-12 flex-col items-center justify-center rounded-md border border-gray-800 ${textColor}`}
                              title={
                                entry
                                  ? `${date.getDate()}: ${secondsToHoursLabel(entry.timeSpent)} across ${entry.sessions} sessions`
                                  : `${date.getDate()}: No study time`
                              }
                              style={{ backgroundColor }}
                            >
                              <span className="text-sm font-medium">{date.getDate()}</span>
                              {entry && (
                                <span className="text-[10px] font-semibold text-gray-900">
                                  {Math.round(entry.timeSpent / 3600)}h
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

