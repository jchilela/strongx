'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { adminApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface SmsLog {
  id: string;
  messageId: string;
  applicationId: string | null;
  appName: string | null;
  telcosmsKeyPreview: string | null;
  resolvedFrom: 'app_key' | 'global' | 'none';
  createdAt: string;
  to: string;
  messageStatus: string;
  userEmail: string;
}

export function AdminSmsLogs() {
  const [limit, setLimit] = useState(50);

  const { data: logs, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-sms-logs', limit],
    queryFn: async () => {
      const res = await adminApi.getSmsSendLogs(limit);
      return res.data.data as SmsLog[];
    },
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-500">
          Showing last <strong>{limit}</strong> messages · auto-refreshes every 15s
        </p>
        <div className="flex items-center gap-2">
          {[50, 100, 200].map((n) => (
            <button
              key={n}
              onClick={() => setLimit(n)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                limit === n ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {n}
            </button>
          ))}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : !logs?.length ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState icon={FileText} title="No logs yet" description="SMS send logs will appear here after messages are sent." />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">To</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Application</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">TelcoSMS Key</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Resolved From</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">{log.userEmail ?? '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-700">{log.to ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {log.appName ? (
                        <span className="font-medium">{log.appName}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {log.telcosmsKeyPreview ? (
                        <code className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono">
                          {log.telcosmsKeyPreview}...
                        </code>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {log.resolvedFrom === 'app_key' ? (
                        <Badge variant="success">app key</Badge>
                      ) : log.resolvedFrom === 'global' ? (
                        <Badge variant="warning">global</Badge>
                      ) : (
                        <Badge variant="secondary">none</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {log.messageStatus === 'sent' ? (
                        <Badge variant="success">sent</Badge>
                      ) : log.messageStatus === 'failed' ? (
                        <Badge variant="destructive">failed</Badge>
                      ) : (
                        <Badge variant="secondary">{log.messageStatus ?? '—'}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
