'use client';

import { MessageSquare, Mail, MessageCircle } from 'lucide-react';
import { useRecentMessages } from '@/hooks/useMessages';
import { MessageStatusBadge } from '@/components/shared/StatusBadge';
import { TableLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate, truncateText, formatCurrency } from '@/lib/utils';
import type { Message, MessageChannel } from '@/types/message';
import { useLang } from '@/lib/lang';

const channelIcons: Record<MessageChannel, React.ReactNode> = {
  sms: <MessageSquare className="h-4 w-4 text-[#6366f1]" />,
  email: <Mail className="h-4 w-4 text-[#fb923c]" />,
  whatsapp: <MessageCircle className="h-4 w-4 text-green-500" />,
};

const channelLabels: Record<MessageChannel, string> = {
  sms: 'SMS',
  email: 'Email',
  whatsapp: 'WhatsApp',
};

export function RecentActivity() {
  const { data: messages, isLoading } = useRecentMessages(10);
  const { t } = useLang();

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">{t.activity.title}</h2>
        <span className="text-xs text-gray-400">{t.activity.last10}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t.activity.channel}</th>
              <th>{t.activity.to}</th>
              <th className="hidden md:table-cell">{t.activity.message}</th>
              <th>{t.activity.status}</th>
              <th className="hidden sm:table-cell">{t.activity.cost}</th>
              <th>{t.activity.date}</th>
            </tr>
          </thead>

          {isLoading ? (
            <TableLoader rows={5} cols={6} />
          ) : messages && messages.length > 0 ? (
            <tbody>
              {messages.map((message: Message) => (
                <tr key={message.id} className="group">
                  <td>
                    <div className="flex items-center gap-1.5">
                      {channelIcons[message.channel]}
                      <span className="text-xs font-medium text-gray-500">
                        {channelLabels[message.channel]}
                      </span>
                    </div>
                  </td>
                  <td className="font-medium text-gray-800">{message.to}</td>
                  <td className="hidden md:table-cell text-gray-500">
                    {truncateText(message.body, 50)}
                  </td>
                  <td>
                    <MessageStatusBadge status={message.status} />
                  </td>
                  <td className="hidden sm:table-cell text-gray-600">
                    {formatCurrency(message.cost)}
                  </td>
                  <td className="text-gray-500 text-xs whitespace-nowrap">
                    {formatDate(message.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          ) : (
            <tbody>
              <tr>
                <td colSpan={6} className="py-0">
                  <EmptyState
                    icon={MessageSquare}
                    title={t.activity.noMessages}
                    description={t.activity.noMessagesDesc}
                  />
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}
