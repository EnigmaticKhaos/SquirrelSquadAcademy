'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Input, Select, Textarea } from '@/components/ui';
import type { LearningGoal, LearningGoalType } from '@/types';
import { GOAL_TYPE_OPTIONS, getGoalTypeMeta } from './constants';

export interface GoalFormPrefill {
  title?: string;
  description?: string;
  type?: LearningGoalType;
  targetValue?: number | string;
  customCriteria?: string;
  xpReward?: number | string;
  badgeReward?: string;
  achievementReward?: string;
  hasDeadline?: boolean;
  deadline?: string;
}

export interface GoalFormSubmitData {
  title: string;
  description?: string;
  type: LearningGoalType;
  targetValue: number;
  customCriteria?: {
    type?: string;
    value?: any;
    [key: string]: any;
  };
  xpReward?: number;
  badgeReward?: string;
  achievementReward?: string;
  hasDeadline: boolean;
  deadline?: string;
}

interface GoalFormProps {
  mode: 'create' | 'edit';
  initialValues?: GoalFormPrefill;
  isSubmitting?: boolean;
  submitError?: string | null;
  onSubmit: (data: GoalFormSubmitData) => Promise<void> | void;
  onCancel: () => void;
}

const defaultState: Required<Omit<GoalFormPrefill, 'type'>> & { type: LearningGoalType } = {
  title: '',
  description: '',
  type: 'complete_courses',
  targetValue: 1,
  customCriteria: '',
  xpReward: '',
  badgeReward: '',
  achievementReward: '',
  hasDeadline: false,
  deadline: '',
};

export const GoalForm: React.FC<GoalFormProps> = ({
  mode,
  initialValues,
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
}) => {
  const [formState, setFormState] = useState(defaultState);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (initialValues) {
      setFormState((prev) => ({
        ...prev,
        ...initialValues,
        targetValue: Number(initialValues.targetValue ?? prev.targetValue),
        xpReward: initialValues.xpReward ?? '',
        badgeReward: initialValues.badgeReward ?? '',
        achievementReward: initialValues.achievementReward ?? '',
        customCriteria: initialValues.customCriteria ?? '',
        deadline: initialValues.deadline ?? '',
        hasDeadline: initialValues.hasDeadline ?? false,
        type: initialValues.type ?? prev.type,
        title: initialValues.title ?? '',
        description: initialValues.description ?? '',
      }));
    } else {
      setFormState(defaultState);
    }
  }, [initialValues]);

  const targetMeta = useMemo(() => getGoalTypeMeta(formState.type), [formState.type]);

  const handleInputChange = (field: keyof typeof formState, value: string | number | boolean) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    if (!formState.title.trim()) {
      setLocalError('Please provide a title for your goal.');
      return;
    }

    if (!formState.targetValue || Number(formState.targetValue) <= 0) {
      setLocalError('Target value must be greater than zero.');
      return;
    }

    if (formState.hasDeadline && !formState.deadline) {
      setLocalError('Please pick a deadline date.');
      return;
    }

    const payload: GoalFormSubmitData = {
      title: formState.title.trim(),
      description: formState.description?.trim() || undefined,
      type: formState.type,
      targetValue: Number(formState.targetValue),
      customCriteria: formState.customCriteria
        ? {
            type: 'text',
            value: formState.customCriteria,
          }
        : undefined,
      xpReward:
        formState.xpReward !== '' && formState.xpReward !== undefined
          ? Number(formState.xpReward)
          : undefined,
      badgeReward: formState.badgeReward?.trim() || undefined,
      achievementReward: formState.achievementReward?.trim() || undefined,
      hasDeadline: formState.hasDeadline,
      deadline:
        formState.hasDeadline && formState.deadline
          ? new Date(formState.deadline).toISOString()
          : undefined,
    };

    await onSubmit(payload);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {localError && (
        <div className="rounded-md border border-red-600 bg-red-900/30 px-4 py-2 text-sm text-red-200">
          {localError}
        </div>
      )}
      {submitError && (
        <div className="rounded-md border border-red-600 bg-red-900/30 px-4 py-2 text-sm text-red-200">
          {submitError}
        </div>
      )}
      <Input
        label="Goal Title"
        placeholder="e.g. Complete 3 backend courses"
        value={formState.title}
        onChange={(e) => handleInputChange('title', e.target.value)}
      />
      <Textarea
        label="Description"
        placeholder="Why is this goal important?"
        value={formState.description}
        onChange={(e) => handleInputChange('description', e.target.value)}
        rows={3}
      />
      <Select
        label="Goal Type"
        value={formState.type}
        onChange={(e) => handleInputChange('type', e.target.value as LearningGoalType)}
        disabled={mode === 'edit'}
        options={GOAL_TYPE_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
      />
      <div>
        <Input
          label={`Target Value (${targetMeta.unit})`}
          type="number"
          min={1}
          value={formState.targetValue}
          onChange={(e) => handleInputChange('targetValue', e.target.value)}
          helperText={targetMeta.helper}
        />
      </div>
      <Textarea
        label="Custom Criteria (optional)"
        placeholder="Describe custom completion requirements"
        value={formState.customCriteria}
        onChange={(e) => handleInputChange('customCriteria', e.target.value)}
        helperText="Useful for custom goals or extra context."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input
          label="XP Reward"
          type="number"
          min={0}
          placeholder="500"
          value={formState.xpReward}
          onChange={(e) => handleInputChange('xpReward', e.target.value)}
        />
        <Input
          label="Badge Reward ID"
          placeholder="Badge ID"
          value={formState.badgeReward}
          onChange={(e) => handleInputChange('badgeReward', e.target.value)}
        />
        <Input
          label="Achievement Reward ID"
          placeholder="Achievement ID"
          value={formState.achievementReward}
          onChange={(e) => handleInputChange('achievementReward', e.target.value)}
        />
      </div>
      <div className="space-y-3 rounded-md border border-gray-700 p-4">
        <Checkbox
          label="Set a deadline"
          checked={formState.hasDeadline}
          onChange={(e) => handleInputChange('hasDeadline', e.target.checked)}
        />
        {formState.hasDeadline && (
          <Input
            label="Deadline"
            type="date"
            value={formState.deadline}
            onChange={(e) => handleInputChange('deadline', e.target.value)}
          />
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {mode === 'create' ? 'Create Goal' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export const mapGoalToFormPrefill = (goal: LearningGoal): GoalFormPrefill => ({
  title: goal.title,
  description: goal.description,
  type: goal.type,
  targetValue: goal.targetValue,
  customCriteria:
    typeof goal.customCriteria?.value === 'string'
      ? goal.customCriteria?.value
      : goal.customCriteria?.value
      ? JSON.stringify(goal.customCriteria.value)
      : '',
  xpReward: goal.xpReward,
  badgeReward: typeof goal.badgeReward === 'string' ? goal.badgeReward : goal.badgeReward?._id,
  achievementReward:
    typeof goal.achievementReward === 'string'
      ? goal.achievementReward
      : goal.achievementReward?._id,
  hasDeadline: goal.hasDeadline,
  deadline: goal.deadline ? goal.deadline.slice(0, 10) : '',
});

