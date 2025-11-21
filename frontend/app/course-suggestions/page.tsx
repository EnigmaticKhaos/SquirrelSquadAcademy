'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { PageHeader } from '@/components/layout';
import {
  useCourseSuggestions,
  useCreateCourseSuggestion,
  useVoteOnSuggestion,
  useApproveSuggestion,
  useDenySuggestion,
} from '@/hooks/useCourseSuggestions';
import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardContent,
  Badge,
  LoadingSpinner,
  EmptyState,
  Button,
  Modal,
  Input,
  Textarea,
} from '@/components/ui';
import { showToast } from '@/lib/toast';
import type { SuggestionStatus } from '@/lib/api/courseSuggestions';
import { Plus, ThumbsUp, CheckCircle, XCircle, Clock, User, Sparkles } from 'lucide-react';

const STATUS_OPTIONS: { value: SuggestionStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
];

const SORT_OPTIONS: { value: 'voteCount' | 'createdAt'; label: string }[] = [
  { value: 'voteCount', label: 'Most Voted' },
  { value: 'createdAt', label: 'Newest' },
];

export default function CourseSuggestionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus | ''>('');
  const [sortBy, setSortBy] = useState<'voteCount' | 'createdAt'>('voteCount');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [denyNotes, setDenyNotes] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    desiredContent: '',
  });

  const { data: suggestions, isLoading } = useCourseSuggestions({
    status: statusFilter || undefined,
    sort: sortBy,
  });

  const createSuggestion = useCreateCourseSuggestion();
  const voteOnSuggestion = useVoteOnSuggestion();
  const approveSuggestion = useApproveSuggestion();
  const denySuggestion = useDenySuggestion();

  const handleCreateSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      showToast.error('Please fill in title and description');
      return;
    }

    try {
      const result = await createSuggestion.mutateAsync({
        title: formData.title,
        description: formData.description,
        desiredContent: formData.desiredContent || undefined,
      });
      
      const responseData = (result as any)?.data?.data || (result as any)?.data;
      const suggestion = responseData?.suggestion;
      
      setShowCreateModal(false);
      setFormData({ title: '', description: '', desiredContent: '' });
      
      if (suggestion?._id) {
        router.push(`/course-suggestions/${suggestion._id}`);
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleVote = (id: string) => {
    if (!user) {
      showToast.error('Please log in to vote');
      router.push('/login');
      return;
    }
    voteOnSuggestion.mutate(id);
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this suggestion and generate a course using AI?')) {
      return;
    }
    try {
      await approveSuggestion.mutateAsync(id);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeny = async () => {
    if (!selectedSuggestion) return;
    
    try {
      await denySuggestion.mutateAsync({
        id: selectedSuggestion,
        reviewNotes: denyNotes || undefined,
      });
      setShowDenyModal(false);
      setSelectedSuggestion(null);
      setDenyNotes('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getStatusColor = (status: SuggestionStatus) => {
    const colors = {
      pending: 'bg-yellow-500/10 text-yellow-400',
      approved: 'bg-green-500/10 text-green-400',
      denied: 'bg-red-500/10 text-red-400',
    };
    return colors[status] || colors.pending;
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <PageHeader
            title="Course Suggestions"
            description="Suggest new courses you'd like to see. Vote on suggestions from the community, and help shape our course catalog!"
          />
          {user && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Suggest Course
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SuggestionStatus | '')}
            className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'voteCount' | 'createdAt')}
            className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Suggestions List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : suggestions && suggestions.length > 0 ? (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <Card key={suggestion._id} hover>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(suggestion.status)}>
                          {suggestion.status}
                        </Badge>
                        {suggestion.generatedCourse && (
                          <Link
                            href={`/courses/${typeof suggestion.generatedCourse === 'string' ? suggestion.generatedCourse : suggestion.generatedCourse._id}`}
                          >
                            <Badge variant="success" className="cursor-pointer hover:bg-green-600">
                              <Sparkles className="mr-1 h-3 w-3" />
                              Course Created
                            </Badge>
                          </Link>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-100 mb-2">
                        {suggestion.title}
                      </h3>
                      <p className="text-gray-400 mb-3 whitespace-pre-wrap">
                        {suggestion.description}
                      </p>
                      {suggestion.desiredContent && (
                        <div className="mb-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                          <p className="text-sm font-medium text-gray-300 mb-1">Desired Content:</p>
                          <p className="text-sm text-gray-400 whitespace-pre-wrap">
                            {suggestion.desiredContent}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{suggestion.user?.username || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(suggestion.createdAt).toLocaleDateString()}</span>
                        </div>
                        {suggestion.reviewedAt && (
                          <span className="text-xs">
                            Reviewed {new Date(suggestion.reviewedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleVote(suggestion._id)}
                        disabled={voteOnSuggestion.isPending || !user}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          suggestion.hasVoted
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{suggestion.voteCount || 0} votes</span>
                      </button>
                    </div>

                    {isAdmin && suggestion.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleApprove(suggestion._id)}
                          disabled={approveSuggestion.isPending}
                          size="sm"
                          variant="primary"
                        >
                          {approveSuggestion.isPending ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve & Generate
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedSuggestion(suggestion._id);
                            setShowDenyModal(true);
                          }}
                          disabled={denySuggestion.isPending}
                          size="sm"
                          variant="danger"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Deny
                        </Button>
                      </div>
                    )}

                    {suggestion.reviewNotes && (
                      <div className="flex-1 ml-4 p-2 bg-gray-800/50 rounded text-sm text-gray-400">
                        <strong>Review Notes:</strong> {suggestion.reviewNotes}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No course suggestions"
            description={user ? "Be the first to suggest a new course!" : "Log in to suggest a new course."}
            action={
              user
                ? {
                    label: 'Suggest Course',
                    onClick: () => setShowCreateModal(true),
                  }
                : undefined
            }
          />
        )}

        {/* Create Suggestion Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Suggest a New Course"
          size="lg"
        >
          <form onSubmit={handleCreateSuggestion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Course Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Advanced React Patterns"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this course should cover and why it would be valuable..."
                rows={6}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Desired Content (Optional)
              </label>
              <Textarea
                value={formData.desiredContent}
                onChange={(e) => setFormData({ ...formData, desiredContent: e.target.value })}
                placeholder="Specific topics, modules, or learning objectives you'd like to see..."
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ title: '', description: '', desiredContent: '' });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSuggestion.isPending || !formData.title.trim() || !formData.description.trim()}
                className="flex-1"
              >
                {createSuggestion.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Submit Suggestion
                  </>
                )}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Deny Suggestion Modal */}
        <Modal
          isOpen={showDenyModal}
          onClose={() => {
            setShowDenyModal(false);
            setSelectedSuggestion(null);
            setDenyNotes('');
          }}
          title="Deny Course Suggestion"
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-sm text-gray-300">
                This will mark the suggestion as denied. You can optionally provide review notes.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Review Notes (Optional)
              </label>
              <Textarea
                value={denyNotes}
                onChange={(e) => setDenyNotes(e.target.value)}
                placeholder="Explain why this suggestion is being denied..."
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDenyModal(false);
                  setSelectedSuggestion(null);
                  setDenyNotes('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeny}
                disabled={denySuggestion.isPending}
                variant="danger"
                className="flex-1"
              >
                {denySuggestion.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Denying...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Deny Suggestion
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}

