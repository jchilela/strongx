'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useDailyStats } from '@/hooks/useMessages';
import { formatDateShort } from '@/lib/utils';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import type { DailyStats } from '@/types/message';

export function MessageChart() {
  const { data: stats, isLoading } = useDailyStats(7);

  const chartData = stats?.map((day: DailyStats) => ({
    date: formatDateShort(day.date),
    SMS: day.sms,
    Email: day.email,
    WhatsApp: day.whatsapp,
  })) || [];

  // Fill with placeholder data if empty
  const displayData =
    chartData.length > 0
      ? chartData
      : Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return {
            date: d.toLocaleDateString('en', { month: 'short', day: '2-digit' }),
            SMS: 0,
            Email: 0,
            WhatsApp: 0,
          };
        });

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Message Volume</h2>
          <p className="text-xs text-gray-400 mt-0.5">Last 7 days by channel</p>
        </div>
      </div>

      <div className="p-5">
        {isLoading ? (
          <PageLoader />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={displayData}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
              />
              <Bar dataKey="SMS" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Email" fill="#fb923c" radius={[4, 4, 0, 0]} />
              <Bar dataKey="WhatsApp" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
