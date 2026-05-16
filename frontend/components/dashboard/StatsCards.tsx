'use client';

import { MessageSquare, Mail, MessageCircle, Wallet } from 'lucide-react';
import { useTodayStats } from '@/hooks/useMessages';
import { useWalletBalance } from '@/hooks/useWallet';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
  loading?: boolean;
}

function StatCard({ title, value, icon, iconBg, trend, loading }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-100 rounded animate-pulse mt-2" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          )}
          {trend && !loading && (
            <p className="text-xs text-green-600 mt-1 font-medium">{trend}</p>
          )}
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBg)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function StatsCards() {
  const { data: stats, isLoading: statsLoading } = useTodayStats();
  const { data: balance, isLoading: balanceLoading } = useWalletBalance();

  const cards = [
    {
      title: 'SMS Sent Today',
      value: stats?.smsSentToday ?? 0,
      icon: <MessageSquare className="h-6 w-6 text-white" />,
      iconBg: 'bg-[#6366f1]',
      loading: statsLoading,
    },
    {
      title: 'Emails Sent Today',
      value: stats?.emailsSentToday ?? 0,
      icon: <Mail className="h-6 w-6 text-white" />,
      iconBg: 'bg-[#fb923c]',
      loading: statsLoading,
    },
    {
      title: 'WhatsApp Today',
      value: stats?.whatsappSentToday ?? 0,
      icon: <MessageCircle className="h-6 w-6 text-white" />,
      iconBg: 'bg-green-500',
      loading: statsLoading,
    },
    {
      title: 'Wallet Balance',
      value: balance ? formatCurrency(balance.balance) : 'AOA 0.00',
      icon: <Wallet className="h-6 w-6 text-white" />,
      iconBg: 'bg-purple-500',
      loading: balanceLoading,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
