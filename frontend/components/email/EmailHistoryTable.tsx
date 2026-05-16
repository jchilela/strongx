'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useEmailMessages } from '@/hooks/useMessages';
import { MessageStatusBadge } from '@/components/shared/StatusBadge';
import { TableLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { formatDate, truncateText, formatCurrency } from '@/lib/utils';

export function EmailHistoryTable() {
  const [page, setPage] = useState(1);
  const limit = 15;
  const { data, isLoading } = useEmailMessages(page, limit);

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Email History</h2>
        {data && (
          <span className="text-xs text-gray-400">{data.total} emails total</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>To</th>
              <th className="hidden md:table-cell">Subject</th>
              <th className="hidden md:table-cell">Application</th>
              <th>Status</th>
              <th className="hidden sm:table-cell">Cost</th>
            </tr>
          </thead>

          {isLoading ? (
            <TableLoader rows={8} cols={6} />
          ) : data?.messages && data.messages.length > 0 ? (
            <tbody>
              {data.messages.map((message) => (
                <tr key={message.id}>
                  <td className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(message.createdAt)}
                  </td>
                  <td className="font-medium text-gray-800 text-xs">{message.to}</td>
                  <td className="hidden md:table-cell text-gray-600">
                    {truncateText(message.subject || '-', 40)}
                  </td>
                  <td className="hidden md:table-cell text-gray-500 text-xs">
                    {message.applicationName}
                  </td>
                  <td>
                    <MessageStatusBadge status={message.status} />
                  </td>
                  <td className="hidden sm:table-cell text-gray-600 text-xs">
                    {formatCurrency(message.cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          ) : (
            <tbody>
              <tr>
                <td colSpan={6} className="py-0">
                  <EmptyState
                    icon={Mail}
                    title="No emails sent yet"
                    description="Your email history will appear here."
                  />
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="p-4 border-t border-gray-100">
          <Pagination
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            limit={limit}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
