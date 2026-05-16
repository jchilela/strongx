'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, AppWindow, Pencil, Trash2, MessageSquare, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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

  const { mutate: deleteApp, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => applicationsApi.deleteApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application deleted');
    },
    onError: () => {
      toast.error('Failed to delete application');
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
                <Badge variant={app.isActive ? 'success' : 'secondary'}>
                  {app.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

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

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Application</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &quot;{app.name}&quot;? This action cannot be
                        undone. All API keys associated with this application will also be revoked.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteApp(app.id)}
                        disabled={isDeleting}
                      >
                        Delete Application
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
