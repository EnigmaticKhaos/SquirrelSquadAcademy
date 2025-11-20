import type { LearningGoalStatus, LearningGoalType } from '@/types';
import type { BadgeProps } from '@/components/ui/Badge';

export interface GoalTypeOption {
  value: LearningGoalType;
  label: string;
  description: string;
  unit: string;
  helper?: string;
}

export const GOAL_TYPE_OPTIONS: GoalTypeOption[] = [
  {
    value: 'complete_courses',
    label: 'Complete Courses',
    description: 'Finish a set number of courses.',
    unit: 'courses',
    helper: 'Counts courses you fully complete.',
  },
  {
    value: 'earn_xp',
    label: 'Earn XP',
    description: 'Accumulate experience points.',
    unit: 'XP',
    helper: 'Tracks total XP earned across the platform.',
  },
  {
    value: 'reach_level',
    label: 'Reach Level',
    description: 'Hit a specific user level milestone.',
    unit: 'levels',
    helper: 'Monitors your overall account level progression.',
  },
  {
    value: 'complete_assignments',
    label: 'Complete Assignments',
    description: 'Submit and pass assignments.',
    unit: 'assignments',
    helper: 'Counts graded assignments you complete.',
  },
  {
    value: 'complete_lessons',
    label: 'Complete Lessons',
    description: 'Finish individual lessons.',
    unit: 'lessons',
    helper: 'Tracks lessons you mark as completed.',
  },
  {
    value: 'maintain_streak',
    label: 'Maintain Streak',
    description: 'Keep a daily learning streak going.',
    unit: 'days',
    helper: 'Measures your continuous learning days.',
  },
  {
    value: 'share_projects',
    label: 'Share Projects',
    description: 'Publish and share projects with the community.',
    unit: 'projects',
    helper: 'Counts public projects you publish.',
  },
  {
    value: 'custom',
    label: 'Custom Goal',
    description: 'Define your own success criteria.',
    unit: 'units',
    helper: 'Use custom criteria to track progress manually.',
  },
];

export const getGoalTypeLabel = (type: LearningGoalType) =>
  GOAL_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? 'Custom Goal';

export const getGoalTypeMeta = (type: LearningGoalType) =>
  GOAL_TYPE_OPTIONS.find((option) => option.value === type) ??
  GOAL_TYPE_OPTIONS[0];

export const GOAL_STATUS_VARIANTS: Record<LearningGoalStatus, BadgeProps['variant']> = {
  active: 'info',
  completed: 'success',
  failed: 'danger',
  paused: 'secondary',
};

