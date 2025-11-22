'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  useModerationReports,
  useModerationReport,
  useReviewReport,
  useIssueWarning,
  useSuspendUser,
  useBanUser,
  useUnbanUser,
  useModerationStats,
  useUserWarnings,
} from '@/hooks/useModeration';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  LoadingSpinner,
  Badge,
  Modal,
  Input,
  Textarea,
  StatsCardSkeleton,
  CardSkeleton,
} from '@/components/ui';
import { AppLayout, PageHeader } from '@/components/layout';
import { showToast } from '@/lib/toast';
import type {
  ContentReport,
  ReportStatus,
  ReportPriority,
  ReportType,
  ReportReason,
  ActionType,
  WarningType,
  WarningSeverity,
} from '@/lib/api/moderation';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  Eye,
  Ban,
  UserX,
  AlertCircle,
  FileText,
} from 'lucide-react';

const REPORT_STATUSES: { value: ReportStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'escalated', label: 'Escalated' },
];

const REPORT_PRIORITIES: { value: ReportPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'post', label: 'Post' },
  { value: 'comment', label: 'Comment' },
  { value: 'message', label: 'Message' },
  { value: 'user', label: 'User' },
  { value: 'course', label: 'Course' },
  { value: 'forum_post', label: 'Forum Post' },
  { value: 'project', label: 'Project' },
];

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'hate_speech', label: 'Hate Speech' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'violence', label: 'Violence' },
  { value: 'self_harm', label: 'Self Harm' },
  { value: 'copyright', label: 'Copyright' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'other', label: 'Other' },
];

const ACTION_TYPES: { value: ActionType; label: string }[] = [
  { value: 'no_action', label: 'No Action' },
  { value: 'warning', label: 'Warning' },
  { value: 'content_removed', label: 'Content Removed' },
  { value: 'user_warned', label: 'User Warned' },
  { value: 'user_suspended', label: 'User Suspended' },
  { value: 'user_banned', label: 'User Banned' },
];

const WARNING_TYPES: { value: WarningType; label: string }[] = [
  { value: 'content_violation', label: 'Content Violation' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate_behavior', label: 'Inappropriate Behavior' },
  { value: 'other', label: 'Other' },
];

const WARNING_SEVERITIES: { value: WarningSeverity; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const getStatusColor = (status: ReportStatus) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'reviewing':
      return 'info';
    case 'resolved':
      return 'success';
    case 'dismissed':
      return 'secondary';
    case 'escalated':
      return 'danger';
    default:
      return 'secondary';
  }
};

const getPriorityColor = (priority: ReportPriority) => {
  switch (priority) {
    case 'urgent':
      return 'danger';
    case 'high':
      return 'warning';
    case 'normal':
      return 'info';
    case 'low':
      return 'secondary';
    default:
      return 'secondary';
  }
};

export default function ModerationPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('pending');
  const [priorityFilter, setPriorityFilter] = useState<ReportPriority | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  
  const [reviewData, setReviewData] = useState({
    status: 'resolved' as ReportStatus,
    actionType: 'no_action' as ActionType,
    actionDetails: '',
    moderationNotes: '',
  });
  
  const [warningData, setWarningData] = useState({
    userId: '',
    type: 'content_violation' as WarningType,
    severity: 'medium' as WarningSeverity,
    reason: '',
    description: '',
    expiresInDays: 30,
  });
  
  const { data: reportsData, isLoading } = useModerationReports({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    contentType: typeFilter !== 'all' ? typeFilter : undefined,
    limit: 100,
  });
  
  const { data: stats } = useModerationStats();
  const reviewReport = useReviewReport();
  const issueWarning = useIssueWarning();
  const suspendUser = useSuspendUser();
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  
  const isAdmin = user?.role === 'admin';
  
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [user, authLoading, isAdmin, router]);
  
  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader title="Moderation" description="Loading moderation queue..." />
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
          <div className="mt-8">
            <CardSkeleton count={5} />
          </div>
        </div>
      </AppLayout>
    );
  }
  
  if (!isAdmin) {
    return null;
  }
  
  const reports = reportsData?.reports || [];
  const filteredReports = reports.filter((report) =>
    searchQuery
      ? report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );
  
  const handleReview = async () => {
    if (!selectedReport) return;
    try {
      await reviewReport.mutateAsync({ id: selectedReport._id, data: reviewData });
      setShowReviewModal(false);
      setSelectedReport(null);
      setReviewData({ status: 'resolved', actionType: 'no_action', actionDetails: '', moderationNotes: '' });
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  const handleIssueWarning = async () => {
    if (!warningData.userId || !warningData.reason || !warningData.description) {
      showToast.error('Please fill in all required fields');
      return;
    }
    try {
      await issueWarning.mutateAsync(warningData);
      setShowWarningModal(false);
      setWarningData({ userId: '', type: 'content_violation', severity: 'medium', reason: '', description: '', expiresInDays: 30 });
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  const handleSuspend = async (userId: string, reason: string) => {
    try {
      await suspendUser.mutateAsync({ userId, data: { reason, duration: 7 } });
      setShowSuspendModal(false);
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  const handleBan = async (userId: string, reason: string) => {
    try {
      await banUser.mutateAsync({ userId, data: { reason } });
      setShowBanModal(false);
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Content Moderation"
          description="Review and manage content reports and user actions"
        />
        
        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Pending Reports</p>
                  <p className="text-2xl font-bold text-gray-100">{stats?.pendingReports || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Resolved Reports</p>
                  <p className="text-2xl font-bold text-gray-100">{stats?.resolvedReports || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Banned Users</p>
                  <p className="text-2xl font-bold text-gray-100">{stats?.bannedUsers || 0}</p>
                </div>
                <Ban className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Active Warnings</p>
                  <p className="text-2xl font-bold text-gray-100">{stats?.activeWarnings || 0}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters */}
        <div className="mt-8 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'all')}
            className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            {REPORT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as ReportPriority | 'all')}
            className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            {REPORT_PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ReportType | 'all')}
            className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Types</option>
            {REPORT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          
          <Button
            variant="outline"
            onClick={() => {
              setWarningData({ ...warningData, userId: '' });
              setShowWarningModal(true);
            }}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Issue Warning
          </Button>
        </div>
        
        {/* Reports List */}
        <div className="mt-8 space-y-4">
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-400">No reports found</p>
              </CardContent>
            </Card>
          ) : (
            filteredReports.map((report) => (
              <Card key={report._id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-100">
                          {REPORT_REASONS.find(r => r.value === report.reason)?.label || report.reason}
                        </h3>
                        <Badge variant={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                        <Badge variant={getPriorityColor(report.priority)}>
                          {report.priority}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {report.contentType}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-2">
                        {report.description || 'No description provided'}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Reported by: {typeof report.reporter === 'object' ? report.reporter.username : 'Unknown'}</span>
                        <span>Content ID: {report.contentId}</span>
                        <span>Created: {new Date(report.createdAt).toLocaleDateString()}</span>
                        {report.reviewedBy && (
                          <span>Reviewed by: {typeof report.reviewedBy === 'object' ? report.reviewedBy.username : 'Unknown'}</span>
                        )}
                      </div>
                      
                      {report.actionTaken && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-400">Action taken: </span>
                          <span className="text-gray-100 font-medium">{report.actionTaken.type}</span>
                          {report.actionTaken.details && (
                            <span className="text-gray-400 ml-2">- {report.actionTaken.details}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setReviewData({
                            status: report.status === 'pending' ? 'reviewing' : report.status,
                            actionType: report.actionTaken?.type || 'no_action',
                            actionDetails: report.actionTaken?.details || '',
                            moderationNotes: report.moderationNotes || '',
                          });
                          setShowReviewModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        {/* Review Modal */}
        <Modal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedReport(null);
          }}
          title="Review Content Report"
        >
          <div className="space-y-4">
            {selectedReport && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select
                    value={reviewData.status}
                    onChange={(e) => setReviewData({ ...reviewData, status: e.target.value as ReportStatus })}
                    className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
                  >
                    {REPORT_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Action Taken</label>
                  <select
                    value={reviewData.actionType}
                    onChange={(e) => setReviewData({ ...reviewData, actionType: e.target.value as ActionType })}
                    className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
                  >
                    {ACTION_TYPES.map((action) => (
                      <option key={action.value} value={action.value}>
                        {action.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Action Details</label>
                  <Textarea
                    value={reviewData.actionDetails}
                    onChange={(e) => setReviewData({ ...reviewData, actionDetails: e.target.value })}
                    placeholder="Details about the action taken..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Moderation Notes</label>
                  <Textarea
                    value={reviewData.moderationNotes}
                    onChange={(e) => setReviewData({ ...reviewData, moderationNotes: e.target.value })}
                    placeholder="Internal notes for moderation team..."
                    rows={4}
                  />
                </div>
              </>
            )}
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedReport(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReview}
                disabled={reviewReport.isPending}
              >
                {reviewReport.isPending ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                Submit Review
              </Button>
            </div>
          </div>
        </Modal>
        
        {/* Issue Warning Modal */}
        <Modal
          isOpen={showWarningModal}
          onClose={() => {
            setShowWarningModal(false);
            setWarningData({ userId: '', type: 'content_violation', severity: 'medium', reason: '', description: '', expiresInDays: 30 });
          }}
          title="Issue User Warning"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">User ID</label>
              <Input
                value={warningData.userId}
                onChange={(e) => setWarningData({ ...warningData, userId: e.target.value })}
                placeholder="User ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Warning Type</label>
              <select
                value={warningData.type}
                onChange={(e) => setWarningData({ ...warningData, type: e.target.value as WarningType })}
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
              >
                {WARNING_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Severity</label>
              <select
                value={warningData.severity}
                onChange={(e) => setWarningData({ ...warningData, severity: e.target.value as WarningSeverity })}
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
              >
                {WARNING_SEVERITIES.map((severity) => (
                  <option key={severity.value} value={severity.value}>
                    {severity.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Reason</label>
              <Input
                value={warningData.reason}
                onChange={(e) => setWarningData({ ...warningData, reason: e.target.value })}
                placeholder="Reason for warning"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <Textarea
                value={warningData.description}
                onChange={(e) => setWarningData({ ...warningData, description: e.target.value })}
                placeholder="Detailed description of the warning..."
                rows={4}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Expires In (Days)</label>
              <Input
                type="number"
                value={warningData.expiresInDays}
                onChange={(e) => setWarningData({ ...warningData, expiresInDays: parseInt(e.target.value) || 30 })}
                placeholder="30"
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowWarningModal(false);
                  setWarningData({ userId: '', type: 'content_violation', severity: 'medium', reason: '', description: '', expiresInDays: 30 });
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleIssueWarning}
                disabled={issueWarning.isPending || !warningData.userId || !warningData.reason || !warningData.description}
              >
                {issueWarning.isPending ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                Issue Warning
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}

