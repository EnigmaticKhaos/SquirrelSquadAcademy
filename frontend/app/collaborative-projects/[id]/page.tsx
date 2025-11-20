'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useCollaborativeProject, useJoinCollaborativeProject, useAddProjectTask } from '@/hooks/useCollaborativeProjects';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingSpinner, ErrorMessage, Button, Avatar, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { Textarea, Input } from '@/components/ui';
import type { CollaborativeProject } from '@/types';

export default function CollaborativeProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data: project, isLoading } = useCollaborativeProject(projectId);
  const { user } = useAuth();
  const joinMutation = useJoinCollaborativeProject();
  const addTaskMutation = useAddProjectTask();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newDiscussionMessage, setNewDiscussionMessage] = useState('');

  const isMember = project && user && project.members?.some((m: any) => {
    const memberId = typeof m.user === 'string' ? m.user : m.user._id;
    return memberId === user._id;
  });

  const handleJoin = async () => {
    try {
      await joinMutation.mutateAsync(projectId);
    } catch (error) {
      console.error('Failed to join project:', error);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await addTaskMutation.mutateAsync({
        id: projectId,
        data: {
          title: newTaskTitle,
          description: newTaskDescription,
        },
      });
      setNewTaskTitle('');
      setNewTaskDescription('');
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <ErrorMessage message="Project not found" />
          </div>
        </main>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'planning':
        return 'secondary';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title={project.title}
            description={project.description}
            breadcrumbs={[
              { label: 'Collaborative Projects', href: '/collaborative-projects' },
              { label: project.title, href: `/collaborative-projects/${projectId}` },
            ]}
            actions={
              !isMember && (
                <Button
                  onClick={handleJoin}
                  isLoading={joinMutation.isPending}
                >
                  Join Project
                </Button>
              )
            }
          />

          <div className="mb-6 flex items-center gap-4">
            <Badge variant={getStatusBadgeVariant(project.status)}>
              {project.status.replace('_', ' ')}
            </Badge>
            <span className="text-sm text-gray-400">
              {project.members?.length || 0} members • {project.tasks?.length || 0} tasks
            </span>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="discussion">Discussion</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-100">Project Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 whitespace-pre-wrap">{project.description}</p>
                </CardContent>
              </Card>

              {project.tags && project.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-100">Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              {isMember && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-100">Add New Task</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddTask} className="space-y-4">
                      <Input
                        placeholder="Task title"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        required
                      />
                      <Textarea
                        placeholder="Task description (optional)"
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        rows={3}
                      />
                      <Button type="submit" isLoading={addTaskMutation.isPending}>
                        Add Task
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {project.tasks && project.tasks.length > 0 ? (
                  project.tasks.map((task: any) => (
                    <Card key={task._id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-100">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge variant={task.status === 'completed' ? 'success' : 'secondary'}>
                              {task.status}
                            </Badge>
                            {task.priority && (
                              <Badge variant={task.priority === 'high' ? 'danger' : 'default'}>
                                {task.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-400">No tasks yet. Add one to get started!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              {project.members && project.members.length > 0 ? (
                project.members.map((member: any) => {
                  const memberUser = typeof member.user === 'string' 
                    ? { _id: member.user, username: 'Unknown', profilePhoto: undefined }
                    : member.user;
                  
                  return (
                    <Card key={memberUser._id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={memberUser.profilePhoto}
                              name={memberUser.username}
                              size="md"
                            />
                            <div>
                              <p className="font-medium text-gray-100">{memberUser.username}</p>
                              <p className="text-sm text-gray-400 capitalize">{member.role}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">{member.role}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-400">No members yet.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="discussion" className="space-y-4">
              {isMember && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-100">Add Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Type your message..."
                        value={newDiscussionMessage}
                        onChange={(e) => setNewDiscussionMessage(e.target.value)}
                        rows={3}
                      />
                      <Button>Send Message</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {project.discussion && project.discussion.length > 0 ? (
                  project.discussion.map((message: any) => {
                    const messageUser = typeof message.user === 'string'
                      ? { _id: message.user, username: 'Unknown', profilePhoto: undefined }
                      : message.user;
                    
                    return (
                      <Card key={message._id}>
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <Avatar
                              src={messageUser.profilePhoto}
                              name={messageUser.username}
                              size="sm"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-100">{messageUser.username}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(message.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-gray-300">{message.content}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-400">No discussion messages yet. Start the conversation!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

