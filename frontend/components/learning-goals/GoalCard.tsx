import React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  ProgressBar,
} from '@/components/ui';
import type { LearningGoal } from '@/types';
import { GoalStatusBadge } from './GoalStatusBadge';
import { getGoalTypeLabel, getGoalTypeMeta } from './constants';

interface GoalCardProps {
  goal: LearningGoal;
  onEdit: (goal: LearningGoal) => void;
  onUpdateProgress: (goal: LearningGoal) => void;
  onTogglePause: (goal: LearningGoal) => void;
  onDelete: (goal: LearningGoal) => void;
  isUpdatingProgress?: boolean;
  isToggling?: boolean;
  isDeleting?: boolean;
}

const progressVariantMap: Record<LearningGoal['status'], 'default' | 'success' | 'warning' | 'danger'> = {
  active: 'default',
  completed: 'success',
  failed: 'danger',
  paused: 'warning',
};

const formatDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
};

const rewardBadges = (goal: LearningGoal) => {
  const items: React.ReactNode[] = [];

  if (goal.xpReward) {
    items.push(
      <Badge key="xp" variant="info" size="sm">
        {goal.xpReward.toLocaleString()} XP
      </Badge>
    );
  }

  if (goal.badgeReward) {
    const label =
      typeof goal.badgeReward === 'string'
        ? `Badge ${goal.badgeReward.slice(-6)}`
        : goal.badgeReward.name;
    items.push(
      <Badge key="badge" variant="secondary" size="sm">
        {label}
      </Badge>
    );
  }

  if (goal.achievementReward) {
    const label =
      typeof goal.achievementReward === 'string'
        ? `Achievement ${goal.achievementReward.slice(-6)}`
        : goal.achievementReward.name;
    items.push(
      <Badge key="achievement" variant="secondary" size="sm">
        {label}
      </Badge>
    );
  }

  return items;
};

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onEdit,
  onUpdateProgress,
  onTogglePause,
  onDelete,
  isUpdatingProgress,
  isToggling,
  isDeleting,
}) => {
  const typeMeta = getGoalTypeMeta(goal.type);
  const dueDate = goal.hasDeadline ? formatDate(goal.deadline) : null;
  const startedAt = formatDate(goal.startedAt);
  const completedAt = formatDate(goal.completedAt);
  const customCriteria =
    typeof goal.customCriteria?.value === 'string'
      ? goal.customCriteria?.value
      : goal.customCriteria?.value
      ? JSON.stringify(goal.customCriteria.value)
      : undefined;

  const rewards = rewardBadges(goal);
  const disableProgressUpdate = goal.status === 'failed';
  const canToggle = goal.status === 'active' || goal.status === 'paused';
  const toggleLabel = goal.status === 'paused' ? 'Resume' : 'Pause';

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-xl text-gray-100">{goal.title}</CardTitle>
          <p className="mt-2 text-sm text-gray-400">{typeMeta.description}</p>
        </div>
        <GoalStatusBadge status={goal.status} />
      </CardHeader>
      <CardContent className="space-y-4">
        {goal.description && (
          <p className="text-sm text-gray-300">{goal.description}</p>
        )}

        <div>
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Progress</span>
            <span>{goal.progressPercentage ?? 0}%</span>
          </div>
          <ProgressBar
            value={goal.progressPercentage ?? 0}
            variant={progressVariantMap[goal.status]}
            className="bg-gray-700/40"
          />
          <p className="mt-2 text-sm text-gray-400">
            {(goal.currentValue ?? 0).toLocaleString()} / {goal.targetValue.toLocaleString()} {typeMeta.unit}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 text-sm text-gray-400 md:grid-cols-2">
          <div>
            <p className="text-gray-500">Type</p>
            <p className="font-medium text-gray-200">{getGoalTypeLabel(goal.type)}</p>
          </div>
          <div>
            <p className="text-gray-500">Started</p>
            <p className="font-medium text-gray-200">{startedAt || '—'}</p>
          </div>
          <div>
            <p className="text-gray-500">Deadline</p>
            <p className="font-medium text-gray-200">
              {goal.hasDeadline ? dueDate ?? 'Not set' : 'No deadline'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Completed</p>
            <p className="font-medium text-gray-200">{completedAt || 'In progress'}</p>
          </div>
        </div>

        {customCriteria && (
          <div className="rounded-md border border-dashed border-gray-600 bg-gray-900/40 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Custom Criteria</p>
            <p className="mt-1 text-sm text-gray-200">{customCriteria}</p>
          </div>
        )}

        {rewards.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {rewards}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdateProgress(goal)}
          isLoading={isUpdatingProgress}
          disabled={disableProgressUpdate || isDeleting}
        >
          Refresh Progress
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(goal)}
        >
          Edit
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onTogglePause(goal)}
          disabled={!canToggle || isDeleting}
          isLoading={isToggling}
        >
          {toggleLabel}
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(goal)}
          isLoading={isDeleting}
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

