'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  useAllAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  usePublishAnnouncement,
  useProcessScheduledAnnouncements,
} from '@/hooks/useAnnouncements';
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
} from '@/components/ui';
import { AppLayout, PageHeader } from '@/components/layout';
import { showToast } from '@/lib/toast';
import type { Announcement, AnnouncementType, AnnouncementPriority, AnnouncementStatus, CreateAnnouncementData } from '@/lib/api/announcements';
import { Plus, Edit, Trash2, Send, Clock, Eye, Filter, Search } from 'lucide-react';

const ANNOUNCEMENT_TYPES: { value: AnnouncementType; label: string }[] = [
  { value: 'platform', label: 'Platform' },
  { value: 'course', label: 'Course' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'feature', label: 'Feature' },
];

const PRIORITIES: { value: AnnouncementPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const STATUSES: { value: AnnouncementStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  
  const { data: announcementsData, isLoading } = useAllAnnouncements({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    limit: 100,
  });
  
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const publishAnnouncement = usePublishAnnouncement();
  const processScheduled = useProcessScheduledAnnouncements();
  
  const [formData, setFormData] = useState<CreateAnnouncementData>({
    title: '',
    content: '',
    type: 'platform',
    priority: 'normal',
  });
  
  const isAdmin = user?.role === 'admin';
  
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [user, authLoading, isAdmin, router]);
  
  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }
  
  if (!isAdmin) {
    return null;
  }
  
  const announcements = announcementsData?.announcements || [];
  const filteredAnnouncements = announcements.filter((announcement) =>
    searchQuery
      ? announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );
  
  const handleCreate = async () => {
    try {
      await createAnnouncement.mutateAsync(formData);
      setShowCreateModal(false);
      setFormData({ title: '', content: '', type: 'platform', priority: 'normal' });
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  const handleUpdate = async () => {
    if (!editingAnnouncement) return;
    try {
      await updateAnnouncement.mutateAsync({ id: editingAnnouncement._id, data: formData });
      setEditingAnnouncement(null);
      setFormData({ title: '', content: '', type: 'platform', priority: 'normal' });
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await deleteAnnouncement.mutateAsync(id);
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  const handlePublish = async (id: string) => {
    try {
      await publishAnnouncement.mutateAsync(id);
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  const getStatusColor = (status: AnnouncementStatus) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'scheduled':
        return 'info';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'secondary';
      default:
        return 'secondary';
    }
  };
  
  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Announcements"
          description="Manage platform announcements and communications"
        />
        
        <div className="mt-8 space-y-6">
          {/* Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AnnouncementStatus | 'all')}
                className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                {STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => processScheduled.mutate()}
                disabled={processScheduled.isPending}
              >
                <Clock className="w-4 h-4 mr-2" />
                Process Scheduled
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setEditingAnnouncement(null);
                  setFormData({ title: '', content: '', type: 'platform', priority: 'normal' });
                  setShowCreateModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Announcement
              </Button>
            </div>
          </div>
          
          {/* Announcements List */}
          <div className="grid gap-4">
            {filteredAnnouncements.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-gray-400">No announcements found</p>
                </CardContent>
              </Card>
            ) : (
              filteredAnnouncements.map((announcement) => (
                <Card key={announcement._id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-100">{announcement.title}</h3>
                          <Badge variant={getStatusColor(announcement.status)}>
                            {announcement.status}
                          </Badge>
                          <Badge variant="secondary" className="capitalize">
                            {announcement.type}
                          </Badge>
                          <Badge variant="secondary" className="capitalize">
                            {announcement.priority}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-400 mb-3 line-clamp-2">
                          {announcement.content.substring(0, 200)}
                          {announcement.content.length > 200 && '...'}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {announcement.views} views
                          </span>
                          {announcement.publishedAt && (
                            <span>Published: {new Date(announcement.publishedAt).toLocaleDateString()}</span>
                          )}
                          {announcement.scheduledFor && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Scheduled: {new Date(announcement.scheduledFor).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {announcement.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePublish(announcement._id)}
                            disabled={publishAnnouncement.isPending}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Publish
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingAnnouncement(announcement);
                            setFormData({
                              title: announcement.title,
                              content: announcement.content,
                              type: announcement.type,
                              priority: announcement.priority,
                              actionUrl: announcement.actionUrl,
                              imageUrl: announcement.imageUrl,
                              videoUrl: announcement.videoUrl,
                            });
                            setShowCreateModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(announcement._id)}
                          disabled={deleteAnnouncement.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
        
        {/* Create/Edit Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingAnnouncement(null);
            setFormData({ title: '', content: '', type: 'platform', priority: 'normal' });
          }}
          title={editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Announcement title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Announcement content (supports markdown)"
                rows={6}
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as AnnouncementType })}
                  className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
                >
                  {ANNOUNCEMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as AnnouncementPriority })}
                  className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Action URL (optional)</label>
              <Input
                value={formData.actionUrl || ''}
                onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAnnouncement(null);
                  setFormData({ title: '', content: '', type: 'platform', priority: 'normal' });
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={editingAnnouncement ? handleUpdate : handleCreate}
                disabled={!formData.title || !formData.content || createAnnouncement.isPending || updateAnnouncement.isPending}
              >
                {editingAnnouncement ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}

