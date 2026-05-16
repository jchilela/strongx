'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, Calendar, BarChart2 } from 'lucide-react';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { adminApi } from '@/lib/api';
import type { EarningsStats } from '@/types/admin';
import { formatCurrency } from '@/lib/utils';

type Period = 'daily' | 'monthly' | 'yearly';

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
        <Icon className="h-5 w-5 text-[#6366f1]" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, prefix = 'AOA ' }: {
  active?: boolean; payload?: { value: number }[]; label?: string; prefix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className="font-semibold text-gray-900">{prefix}{payload[0].value.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</p>
    </div>
  );
}

export function AdminEarnings() {
  const [period, setPeriod] = useState<Period>('monthly');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-earnings'],
    queryFn: async () => {
      const res = await adminApi.getEarningsStats();
      return res.data.data as EarningsStats;
    },
    staleTime: 60000,
  });

  if (isLoading) return <PageLoader />;
  if (!stats) return null;

  const chartData: { label: string; total: number }[] = period === 'daily'
    ? stats.daily.map((d) => ({ label: d.date.slice(5), total: d.total }))
    : period === 'monthly'
    ? stats.monthly.map((m) => ({ label: m.month, total: m.total }))
    : stats.yearly.map((y) => ({ label: y.year, total: y.total }));

  const totalPeriod = chartData.reduce((s, d) => s + d.total, 0);

  const periods: { label: string; value: Period }[] = [
    { label: 'Daily (30d)', value: 'daily' },
    { label: 'Monthly (12m)', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total All Time" value={formatCurrency(stats.totalAllTime)} icon={TrendingUp} />
        <StatCard label={`Period Total (${period})`} value={formatCurrency(totalPeriod)} icon={BarChart2} />
        <StatCard label="Top Earners" value={`${stats.topUsers.length} users`} icon={Users} />
      </div>

      {/* Period chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h3 className="font-semibold text-gray-900">Revenue Over Time</h3>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  period === p.value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            No revenue data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            {period === 'daily' ? (
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Top users table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Top Users by Spend</h3>
        </div>
        {stats.topUsers.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">No spending data yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">#</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">User</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Total Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.topUsers.map((u, i) => (
                <tr key={u.userId} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">
                    {formatCurrency(u.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
