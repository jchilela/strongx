'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useWhatsAppMessages } from '@/hooks/useMessages';
import { MessageStatusBadge } from '@/components/shared/StatusBadge';
import { TableLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { formatDate, truncateText, formatCurrency } from '@/lib/utils';

export function WhatsAppHistoryTable() {
  const [page, setPage] = useState(1);
  const limit = 15;
  const { data, isLoading } = useWhatsAppMessages(page, limit);

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">WhatsApp History</h2>
        {data && (
          <span className="text-xs text-gray-400">{data.total} messages total</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>To</th>
              <th className="hidden md:table-cell">Application</th>
              <th className="hidden lg:table-cell">Message</th>
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
                  <td className="font-medium text-gray-800">{message.to}</td>
                  <td className="hidden md:table-cell text-gray-500 text-xs">
                    {message.applicationName}
                  </td>
                  <td className="hidden lg:table-cell text-gray-500">
                    {truncateText(message.body, 60)}
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
                    icon={MessageCircle}
                    title="No WhatsApp messages yet"
                    description="Send your first WhatsApp message using the form."
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
