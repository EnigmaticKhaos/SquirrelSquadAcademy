'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';

interface AnalyticsSummaryCardProps {
  title: string;
  value: string;
  description?: string;
  accent?: string;
  className?: string;
}

export const AnalyticsSummaryCard: React.FC<AnalyticsSummaryCardProps> = ({
  title,
  value,
  description,
  accent = 'bg-blue-500',
  className,
}) => {
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
          <span className={cn('h-2 w-2 rounded-full', accent)} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold text-gray-100">{value}</p>
        {description && <p className="mt-2 text-sm text-gray-400">{description}</p>}
      </CardContent>
    </Card>
  );
};

