'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  useAdminDashboard,
  useAdminUserAnalytics,
  useAdminCourseAnalytics,
  useAdminRevenueAnalytics,
  useAdminGamificationAnalytics,
  useAdminSocialAnalytics,
  useAdminLearningAnalytics,
  useAdminReferralAnalytics,
  useAdminModerationAnalytics,
} from '@/hooks/useAdmin';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  LoadingSpinner,
  Badge,
  StatsCardSkeleton,
} from '@/components/ui';
import { AppLayout, PageHeader } from '@/components/layout';
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Award,
  MessageSquare,
  GraduationCap,
  Share2,
  Shield,
  BarChart3,
  Calendar,
  Filter,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, variant = 'default', description }) => {
  const variantColors = {
    default: 'bg-gray-800 border-gray-700',
    success: 'bg-green-900/20 border-green-700',
    warning: 'bg-yellow-900/20 border-yellow-700',
    danger: 'bg-red-900/20 border-red-700',
    info: 'bg-blue-900/20 border-blue-700',
  };

  return (
    <Card className={variantColors[variant]}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-100">{value}</p>
            {change && (
              <p className={`text-xs mt-1 ${change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                {change}
              </p>
            )}
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          <div className="text-gray-400">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  
  const { data: dashboardData, isLoading: dashboardLoading } = useAdminDashboard(
    dateRange !== 'all' ? {
      startDate: new Date(Date.now() - (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000).toISOString(),
    } : undefined
  );
  
  const { data: userAnalytics } = useAdminUserAnalytics(
    dateRange !== 'all' ? {
      startDate: new Date(Date.now() - (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000).toISOString(),
    } : undefined
  );
  
  const { data: courseAnalytics } = useAdminCourseAnalytics(
    dateRange !== 'all' ? {
      startDate: new Date(Date.now() - (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000).toISOString(),
    } : undefined
  );
  
  const { data: revenueAnalytics } = useAdminRevenueAnalytics(
    dateRange !== 'all' ? {
      startDate: new Date(Date.now() - (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000).toISOString(),
    } : undefined
  );
  
  const { data: gamificationAnalytics } = useAdminGamificationAnalytics();
  const { data: socialAnalytics } = useAdminSocialAnalytics(
    dateRange !== 'all' ? {
      startDate: new Date(Date.now() - (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000).toISOString(),
    } : undefined
  );
  const { data: learningAnalytics } = useAdminLearningAnalytics(
    dateRange !== 'all' ? {
      startDate: new Date(Date.now() - (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000).toISOString(),
    } : undefined
  );
  const { data: referralAnalytics } = useAdminReferralAnalytics();
  const { data: moderationAnalytics } = useAdminModerationAnalytics();
  
  const isAdmin = user?.role === 'admin';
  
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [user, authLoading, isAdmin, router]);
  
  if (authLoading || dashboardLoading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader title="Admin Dashboard" description="Loading analytics..." />
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }
  
  if (!isAdmin) {
    return null;
  }
  
  const users = dashboardData?.users || userAnalytics;
  const courses = dashboardData?.courses || courseAnalytics;
  const revenue = dashboardData?.revenue || revenueAnalytics;
  const gamification = dashboardData?.gamification || gamificationAnalytics;
  const social = dashboardData?.social || socialAnalytics;
  const learning = dashboardData?.learning || learningAnalytics;
  const referrals = dashboardData?.referrals || referralAnalytics;
  const moderation = dashboardData?.moderation || moderationAnalytics;
  
  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <PageHeader
            title="Admin Dashboard"
            description="Comprehensive platform analytics and insights"
          />
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
              className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/announcements')}
            >
              Manage Announcements
            </Button>
          </div>
        </div>
        
        {/* Overview Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Users"
            value={users?.total || 0}
            change={users?.new ? `+${users.new} new` : undefined}
            icon={<Users className="w-6 h-6" />}
            variant="info"
            description={`${users?.active || 0} active`}
          />
          <StatCard
            title="Total Courses"
            value={courses?.total || 0}
            icon={<BookOpen className="w-6 h-6" />}
            variant="default"
            description={`${courses?.published || 0} published`}
          />
          <StatCard
            title="Total Enrollments"
            value={courses?.enrollments || 0}
            icon={<GraduationCap className="w-6 h-6" />}
            variant="success"
            description={`${courses?.completions || 0} completed`}
          />
          <StatCard
            title="Premium Users"
            value={revenue?.premiumUsers || 0}
            change={revenue?.conversionRate ? `${revenue.conversionRate.toFixed(1)}% conversion` : undefined}
            icon={<DollarSign className="w-6 h-6" />}
            variant="warning"
            description={`${revenue?.freeUsers || 0} free users`}
          />
        </div>
        
        {/* Secondary Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total XP"
            value={gamification?.xp?.total ? gamification.xp.total.toLocaleString() : '0'}
            icon={<Award className="w-6 h-6" />}
            variant="success"
            description={`${gamification?.achievements?.unlocked || 0} achievements unlocked`}
          />
          <StatCard
            title="Social Posts"
            value={social?.posts?.total || 0}
            icon={<MessageSquare className="w-6 h-6" />}
            variant="info"
            description={`${social?.comments?.total || social?.totalComments || 0} comments, ${social?.likes?.total || social?.totalLikes || 0} likes`}
          />
          <StatCard
            title="Learning Sessions"
            value={learning?.totalSessions || learning?.sessions?.total || 0}
            icon={<TrendingUp className="w-6 h-6" />}
            variant="default"
            description={`${learning?.activeLearners || learning?.learners?.active || 0} active learners`}
          />
          <StatCard
            title="Referrals"
            value={referrals?.totalReferrals || 0}
            icon={<Share2 className="w-6 h-6" />}
            variant="success"
            description={`${referrals?.activeReferrers || 0} active referrers`}
          />
        </div>
        
        {/* Moderation Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Pending Reports"
            value={moderation?.pendingReports || 0}
            icon={<Shield className="w-6 h-6" />}
            variant={(moderation?.pendingReports || 0) > 0 ? 'danger' : 'default'}
            description={`${moderation?.resolvedReports || 0} resolved`}
          />
          <StatCard
            title="Banned Users"
            value={moderation?.bannedUsers || 0}
            icon={<Shield className="w-6 h-6" />}
            variant="danger"
            description={`${moderation?.suspendedUsers || 0} suspended`}
          />
          <StatCard
            title="Warnings Issued"
            value={moderation?.warningsIssued || 0}
            icon={<Shield className="w-6 h-6" />}
            variant="warning"
          />
          <StatCard
            title="Course Reviews"
            value={courses?.reviews || 0}
            icon={<BarChart3 className="w-6 h-6" />}
            variant="default"
            description={courses?.averageRating ? `Avg: ${courses.averageRating.toFixed(1)}⭐` : undefined}
          />
        </div>
        
        {/* Detailed Analytics Sections */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
          {/* User Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Analytics
              </CardTitle>
              <CardDescription>User growth and engagement metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Verified Users</p>
                  <p className="text-2xl font-bold text-gray-100">{users?.verified || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">2FA Enabled</p>
                  <p className="text-2xl font-bold text-gray-100">{users?.with2FA || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Mentors</p>
                  <p className="text-2xl font-bold text-gray-100">{users?.mentors?.total || 0}</p>
                  <p className="text-xs text-gray-500">{users?.mentors?.active || 0} active</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Avg Level</p>
                  <p className="text-2xl font-bold text-gray-100">{users?.averages?.level?.toFixed(1) || '0'}</p>
                  <p className="text-xs text-gray-500">{users?.averages?.xp?.toFixed(0) || '0'} avg XP</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Course Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Course Analytics
              </CardTitle>
              <CardDescription>Course performance and engagement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Published</p>
                  <p className="text-2xl font-bold text-gray-100">{courses?.published || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Draft</p>
                  <p className="text-2xl font-bold text-gray-100">{courses?.draft || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Coming Soon</p>
                  <p className="text-2xl font-bold text-gray-100">{courses?.comingSoon || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Coding Courses</p>
                  <p className="text-2xl font-bold text-gray-100">{courses?.byType?.coding || courses?.coding || 0}</p>
                  <p className="text-xs text-gray-500">{courses?.byType?.nonCoding || courses?.nonCoding || 0} non-coding</p>
                </div>
              </div>
              {(courses?.popular || courses?.popularCourses) && (courses?.popular || courses?.popularCourses || []).length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-300 mb-2">Popular Courses</p>
                  <div className="space-y-2">
                    {(courses?.popular || courses?.popularCourses || []).slice(0, 5).map((course: any, index: number) => (
                      <div key={course._id || index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 truncate">{course.title}</span>
                        <Badge variant="secondary">{course.enrollmentCount} enrollments</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Gamification & Social */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Gamification
              </CardTitle>
              <CardDescription>Achievements, badges, and XP</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Total Achievements</p>
                  <p className="text-2xl font-bold text-gray-100">{gamification?.achievements?.total || gamification?.totalAchievements || 0}</p>
                  <p className="text-xs text-gray-500">{gamification?.achievements?.unlocked || 0} unlocked</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Badges</p>
                  <p className="text-2xl font-bold text-gray-100">{gamification?.badges?.total || gamification?.totalBadges || 0}</p>
                  <p className="text-xs text-gray-500">{gamification?.badges?.earned || 0} earned</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Social Engagement
              </CardTitle>
              <CardDescription>Community activity and interactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Total Posts</p>
                  <p className="text-2xl font-bold text-gray-100">{social?.posts?.total || social?.totalPosts || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Comments</p>
                  <p className="text-2xl font-bold text-gray-100">{social?.comments?.total || social?.totalComments || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Likes</p>
                  <p className="text-2xl font-bold text-gray-100">{social?.likes?.total || social?.totalLikes || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Active Users</p>
                  <p className="text-2xl font-bold text-gray-100">{social?.activeUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

