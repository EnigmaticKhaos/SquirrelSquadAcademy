'use client';

import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { PageHeader } from '@/components/layout';

export default function StudyToolsPage() {
  const tools = [
    {
      title: 'Pomodoro Timer',
      description: 'Focus on your studies with the Pomodoro technique',
      href: '/study-tools/pomodoro',
      icon: '🍅',
    },
    {
      title: 'Study Resources',
      description: 'Access and organize your study materials',
      href: '/study-tools/resources',
      icon: '📚',
    },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Study Tools"
            description="Tools to help you study more effectively"
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <Link key={tool.href} href={tool.href}>
                <Card hover className="h-full">
                  <CardHeader>
                    <div className="mb-2 text-4xl">{tool.icon}</div>
                    <CardTitle>{tool.title}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
    </AppLayout>
  );
}

