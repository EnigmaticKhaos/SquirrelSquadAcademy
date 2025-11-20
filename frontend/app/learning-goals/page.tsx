'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout';
import { PageHeader } from '@/components/layout';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorMessage,
  LoadingSpinner,
  Modal,
  Pagination,
  Select,
} from '@/components/ui';
import {
  GoalCard,
  GoalForm,
  GoalFormSubmitData,
  GOAL_TYPE_OPTIONS,
  mapGoalToFormPrefill,
} from '@/components/learning-goals';
import {
  useCreateLearningGoal,
  useDeleteLearningGoal,
  useLearningGoalProgressUpdate,
  useLearningGoalStats,
  useLearningGoals,
  useToggleLearningGoal,
  useUpdateAllLearningGoals,
  useUpdateLearningGoal,
} from '@/hooks/useLearningGoals';
import type { LearningGoal } from '@/types';

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

const PAGE_LIMIT = 6;

export default function LearningGoalsPage() {
  const [statusFilter, setStatusFilter] = useState('active');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<LearningGoal | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [progressGoalId, setProgressGoalId] = useState<string | null>(null);
  const [toggleGoalId, setToggleGoalId] = useState<string | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter]);

  const statusParam = statusFilter !== 'all' ? statusFilter : undefined;
  const typeParam = typeFilter !== 'all' ? typeFilter : undefined;

  const { data: stats, isLoading: statsLoading } = useLearningGoalStats();
  const {
    data: goalsData,
    isLoading,
    error,
  } = useLearningGoals({
    status: statusParam,
    type: typeParam,
    page,
    limit: PAGE_LIMIT,
  });

  const createGoalMutation = useCreateLearningGoal();
  const updateGoalMutation = useUpdateLearningGoal();
  const deleteGoalMutation = useDeleteLearningGoal();
  const toggleGoalMutation = useToggleLearningGoal();
  const progressMutation = useLearningGoalProgressUpdate();
  const updateAllMutation = useUpdateAllLearningGoals();

  const goals = goalsData?.data ?? [];
  const pagination = goalsData?.pagination;

  const filteredTypes = useMemo(
    () => [{ value: 'all', label: 'All types' }, ...GOAL_TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))],
    []
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
    setFormError(null);
  };

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal: LearningGoal) => {
    setEditingGoal(goal);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmitGoal = async (data: GoalFormSubmitData) => {
    setFormError(null);
    try {
      if (editingGoal) {
        const { type: _unused, ...updatePayload } = data;
        await updateGoalMutation.mutateAsync({
          id: editingGoal._id,
          data: updatePayload,
        });
      } else {
        await createGoalMutation.mutateAsync(data);
      }
      closeModal();
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? 'Something went wrong. Please try again.');
    }
  };

  const handleUpdateProgress = async (goal: LearningGoal) => {
    setActionError(null);
    setProgressGoalId(goal._id);
    try {
      await progressMutation.mutateAsync(goal._id);
    } catch (err: any) {
      setActionError(err?.response?.data?.message ?? 'Unable to refresh progress.');
    } finally {
      setProgressGoalId(null);
    }
  };

  const handleToggleGoal = async (goal: LearningGoal) => {
    if (goal.status !== 'active' && goal.status !== 'paused') return;
    setActionError(null);
    setToggleGoalId(goal._id);
    try {
      await toggleGoalMutation.mutateAsync({
        id: goal._id,
        action: goal.status === 'paused' ? 'resume' : 'pause',
      });
    } catch (err: any) {
      setActionError(err?.response?.data?.message ?? 'Unable to update goal status.');
    } finally {
      setToggleGoalId(null);
    }
  };

  const handleDeleteGoal = async (goal: LearningGoal) => {
    if (!window.confirm('Delete this goal? This action cannot be undone.')) return;
    setActionError(null);
    setDeleteGoalId(goal._id);
    try {
      await deleteGoalMutation.mutateAsync(goal._id);
    } catch (err: any) {
      setActionError(err?.response?.data?.message ?? 'Unable to delete goal.');
    } finally {
      setDeleteGoalId(null);
    }
  };

  const handleUpdateAll = async () => {
    setActionError(null);
    try {
      await updateAllMutation.mutateAsync();
    } catch (err: any) {
      setActionError(err?.response?.data?.message ?? 'Failed to refresh goals.');
    }
  };

  const isModalSubmitting = editingGoal ? updateGoalMutation.isPending : createGoalMutation.isPending;

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Learning Goals"
            description="Create focused goals, track progress, and celebrate wins."
            actions={
              <Button onClick={handleOpenCreate}>
                New Goal
              </Button>
            }
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <p className="text-sm text-gray-500">Active Goals</p>
                <CardTitle className="text-2xl text-gray-100">{stats?.active ?? 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <p className="text-sm text-gray-500">Completed</p>
                <CardTitle className="text-2xl text-green-400">{stats?.completed ?? 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <p className="text-sm text-gray-500">Failed</p>
                <CardTitle className="text-2xl text-red-400">{stats?.failed ?? 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <p className="text-sm text-gray-500">Total Goals</p>
                <CardTitle className="text-2xl text-blue-400">{stats?.total ?? 0}</CardTitle>
              </CardHeader>
            </Card>
          </div>
          {statsLoading && (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          )}

          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={STATUS_FILTERS}
                className="w-full sm:w-48"
              />
              <Select
                label="Type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={filteredTypes}
                className="w-full sm:w-48"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleUpdateAll}
              isLoading={updateAllMutation.isPending}
            >
              Refresh All Progress
            </Button>
          </div>

          {actionError && (
            <div className="mt-4">
              <ErrorMessage message={actionError} />
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {error && (
            <div className="mt-6">
              <ErrorMessage message="Failed to load goals. Please try again later." />
            </div>
          )}

          {!isLoading && !error && goals.length === 0 && (
            <div className="mt-8">
              <EmptyState
                title="No learning goals yet"
                description="Create your first goal to start tracking progress."
                action={{
                  label: 'Create Goal',
                  onClick: handleOpenCreate,
                }}
              />
            </div>
          )}

          {!isLoading && !error && goals.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {goals.map((goal) => (
                <GoalCard
                  key={goal._id}
                  goal={goal}
                  onEdit={handleOpenEdit}
                  onUpdateProgress={handleUpdateProgress}
                  onTogglePause={handleToggleGoal}
                  onDelete={handleDeleteGoal}
                  isUpdatingProgress={progressGoalId === goal._id && progressMutation.isPending}
                  isToggling={toggleGoalId === goal._id && toggleGoalMutation.isPending}
                  isDeleting={deleteGoalId === goal._id && deleteGoalMutation.isPending}
                />
              ))}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              className="mt-8"
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(newPage) => setPage(newPage)}
            />
          )}
        </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingGoal ? 'Edit Goal' : 'Create Goal'}
        size="lg"
      >
        <GoalForm
          mode={editingGoal ? 'edit' : 'create'}
          initialValues={editingGoal ? mapGoalToFormPrefill(editingGoal) : undefined}
          onSubmit={handleSubmitGoal}
          onCancel={closeModal}
          isSubmitting={isModalSubmitting}
          submitError={formError}
        />
      </Modal>
    </AppLayout>
  );
}

