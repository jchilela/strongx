import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { MessageChart } from '@/components/dashboard/MessageChart';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <DashboardShell title="Dashboard">
      <div className="space-y-6">
        <StatsCards />

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3">
            <MessageChart />
          </div>
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-5 h-full">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {[
                  { href: '/sms', label: 'Send an SMS', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: '💬' },
                  { href: '/email', label: 'Send an Email', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: '📧' },
                  { href: '/whatsapp', label: 'Send WhatsApp', color: 'bg-green-50 text-green-700 border-green-200', icon: '📱' },
                  { href: '/wallet', label: 'Top Up Wallet', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: '💳' },
                  { href: '/developer', label: 'Get API Keys', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: '🔑' },
                ].map((action) => (
                  <a
                    key={action.href}
                    href={action.href}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-sm font-medium transition-all hover:shadow-sm ${action.color}`}
                  >
                    <span className="text-lg">{action.icon}</span>
                    {action.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <RecentActivity />
      </div>
    </DashboardShell>
  );
}
