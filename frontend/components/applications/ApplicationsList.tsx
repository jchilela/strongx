'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, AppWindow, Pencil, MessageSquare, Calendar, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApplicationModal } from './ApplicationModal';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { applicationsApi } from '@/lib/api';
import type { Application } from '@/types/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export function ApplicationsList() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const response = await applicationsApi.getApplications();
      return response.data.data;
    },
  });

  const handleEdit = (app: Application) => {
    setEditingApp(app);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingApp(null);
    setModalOpen(true);
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('Application ID copied');
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {applications?.length || 0} application{applications?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Application
        </Button>
      </div>

      {/* Grid */}
      {(!applications || applications.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={AppWindow}
            title="No applications yet"
            description="Create your first application to start sending messages and generating API keys."
            action={
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Application
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                    <AppWindow className="h-5 w-5 text-[#6366f1]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{app.name}</h3>
                    <p className="text-xs text-gray-400 font-mono">{app.slug}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={app.isActive ? 'success' : 'secondary'}>
                    {app.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {app.status === 'pending' && (
                    <Badge variant="warning">Pending approval</Badge>
                  )}
                  {app.status === 'approved' && (
                    <Badge variant="info">Approved</Badge>
                  )}
                  {app.status === 'rejected' && (
                    <Badge variant="destructive">Rejected</Badge>
                  )}
                </div>
              </div>
              {app.status === 'rejected' && app.rejectedReason && (
                <p className="text-xs text-red-500 mb-2">Reason: {app.rejectedReason}</p>
              )}
              {app.status === 'pending' && (
                <p className="text-xs text-amber-600 mb-2">Awaiting admin approval to send messages.</p>
              )}

              {/* Description */}
              {app.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{app.description}</p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>{app.messageCount.toLocaleString()} messages</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(app.createdAt).split(',')[0]}</span>
                </div>
              </div>

              {/* App ID */}
              <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 rounded-md bg-gray-50 border border-gray-100">
                <p className="text-xs text-gray-400 font-mono flex-1 truncate" title={app.id}>
                  ID: {app.id}
                </p>
                <button
                  onClick={() => copyId(app.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  title="Copy application ID"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-gray-600"
                  onClick={() => handleEdit(app)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ApplicationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        application={editingApp}
      />
    </div>
  );
}
