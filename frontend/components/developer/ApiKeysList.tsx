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
import { useLang } from '@/lib/lang';

export function ApiKeysList() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const { t } = useLang();

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
      toast.success(t.developer.revokeSuccess);
    },
    onError: () => {
      toast.error(t.developer.revokeFailed);
    },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{t.developer.apiKeys}</h2>
          <p className="text-sm text-gray-500">
            {keys?.length || 0} {t.developer.keyCount}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t.developer.createNewKey}
        </Button>
      </div>

      {(!keys || keys.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={Key}
            title={t.developer.noApiKeys}
            description={t.developer.noApiKeysDesc}
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t.developer.createApiKey}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.developer.tableKeyName}</th>
                <th>{t.developer.tableKeyPrefix}</th>
                <th className="hidden md:table-cell">{t.developer.tableApplication}</th>
                <th className="hidden lg:table-cell">{t.developer.tableCreated}</th>
                <th className="hidden lg:table-cell">{t.developer.tableLastUsed}</th>
                <th>{t.developer.tableStatus}</th>
                <th>{t.developer.tableAction}</th>
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
                      <span className="text-gray-300">{t.developer.neverUsed}</span>
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
                        {key.isActive ? t.developer.activeStatus : t.developer.revokedStatus}
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
                            <AlertDialogTitle>{t.developer.revokeKeyTitle}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t.developer.revokeKeyConfirm} &quot;{key.name}&quot;? {t.developer.revokeKeyWarning}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t.developer.cancelBtn}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => revokeKey(key.id)}>
                              {t.developer.revokeBtn}
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
