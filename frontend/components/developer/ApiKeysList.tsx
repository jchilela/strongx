'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Key, Trash2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { CreateKeyModal } from './CreateKeyModal';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { apiKeysApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export function ApiKeysList() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: keys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const response = await apiKeysApi.getApiKeys();
      return response.data.data;
    },
  });

  const { mutate: revokeKey } = useMutation({
    mutationFn: (id: string) => apiKeysApi.revokeApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key revoked');
    },
    onError: () => {
      toast.error('Failed to revoke key');
    },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">API Keys</h2>
          <p className="text-sm text-gray-500">
            {keys?.length || 0} key{keys?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Key
        </Button>
      </div>

      {(!keys || keys.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={Key}
            title="No API keys"
            description="Create an API key to start integrating StrongX into your applications."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key Prefix</th>
                <th className="hidden md:table-cell">Application</th>
                <th className="hidden lg:table-cell">Created</th>
                <th className="hidden lg:table-cell">Last Used</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id}>
                  <td className="font-medium text-gray-900">{key.name}</td>
                  <td>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                      {key.prefix}...
                    </span>
                  </td>
                  <td className="hidden md:table-cell text-gray-500 text-sm">
                    {key.applicationName || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="hidden lg:table-cell text-xs text-gray-500">
                    {formatDate(key.createdAt)}
                  </td>
                  <td className="hidden lg:table-cell text-xs text-gray-500">
                    {key.lastUsedAt ? formatDate(key.lastUsedAt) : (
                      <span className="text-gray-300">Never</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Circle
                        className={`h-2 w-2 fill-current ${
                          key.isActive ? 'text-green-500' : 'text-gray-300'
                        }`}
                      />
                      <Badge variant={key.isActive ? 'success' : 'secondary'}>
                        {key.isActive ? 'Active' : 'Revoked'}
                      </Badge>
                    </div>
                  </td>
                  <td>
                    {key.isActive && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to revoke &quot;{key.name}&quot;? Any applications
                              using this key will immediately lose access.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => revokeKey(key.id)}>
                              Revoke Key
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateKeyModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
