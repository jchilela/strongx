'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppWindow, Check, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { adminApi } from '@/lib/api';
import type { AdminApplication } from '@/types/admin';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

function RejectModal({
  app,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  app: AdminApplication;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reject &quot;{app.name}&quot;</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <Label htmlFor="reason">Reason (shown to user)</Label>
          <Textarea
            id="reason"
            rows={3}
            placeholder="Explain why this application is being rejected..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={!reason.trim() || isPending}
            onClick={() => onConfirm(reason.trim())}
          >
            {isPending ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AppStatusBadge({ status }: { status: AdminApplication['status'] }) {
  const map = {
    pending: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'destructive' },
  } as const;
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function AdminApplicationsList() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [rejectTarget, setRejectTarget] = useState<AdminApplication | null>(null);

  const { data: apps, isLoading } = useQuery({
    queryKey: ['admin-applications', statusFilter],
    queryFn: async () => {
      const res = await adminApi.getApplications(statusFilter === 'all' ? undefined : statusFilter);
      return res.data.data as AdminApplication[];
    },
  });

  const { mutate: approve, isPending: isApproving } = useMutation({
    mutationFn: (appId: string) => adminApi.approveApplication(appId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      toast.success('Application approved');
    },
    onError: () => toast.error('Failed to approve application'),
  });

  const { mutate: reject, isPending: isRejecting } = useMutation({
    mutationFn: ({ appId, reason }: { appId: string; reason: string }) =>
      adminApi.rejectApplication(appId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      toast.success('Application rejected');
      setRejectTarget(null);
    },
    onError: () => toast.error('Failed to reject application'),
  });

  const filters: { label: string; value: StatusFilter }[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'All', value: 'all' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Link href="/admin/users" className="ml-auto">
          <Button variant="outline" size="sm">
            <ChevronRight className="h-4 w-4 mr-1" />
            Users
          </Button>
        </Link>
      </div>

      {/* Table */}
      {!apps?.length ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={AppWindow}
            title="No applications"
            description={`No ${statusFilter === 'all' ? '' : statusFilter + ' '}applications found.`}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Application</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Submitted</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {apps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{app.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{app.slug}</p>
                      {app.description && (
                        <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{app.description}</p>
                      )}
                      {app.rejectedReason && (
                        <p className="text-xs text-red-500 mt-0.5">Reason: {app.rejectedReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <AppStatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(app.createdAt).split(',')[0]}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {app.status !== 'approved' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Approve"
                            disabled={isApproving}
                            onClick={() => approve(app.id)}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        {app.status !== 'rejected' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Reject"
                            onClick={() => setRejectTarget(app)}
                          >
                            <X className="h-4 w-4 text-red-400" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          app={rejectTarget}
          open={!!rejectTarget}
          onOpenChange={(open) => { if (!open) setRejectTarget(null); }}
          onConfirm={(reason) => reject({ appId: rejectTarget.id, reason })}
          isPending={isRejecting}
        />
      )}
    </div>
  );
}
