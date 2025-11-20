import React from 'react';
import { Badge } from '@/components/ui';
import type { LearningGoalStatus } from '@/types';
import { GOAL_STATUS_VARIANTS } from './constants';

interface GoalStatusBadgeProps {
  status: LearningGoalStatus;
}

export const GoalStatusBadge: React.FC<GoalStatusBadgeProps> = ({ status }) => {
  return (
    <Badge variant={GOAL_STATUS_VARIANTS[status]} size="sm" className="capitalize">
      {status}
    </Badge>
  );
};

