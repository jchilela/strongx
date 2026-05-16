import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AdminEarnings } from '@/components/admin/AdminEarnings';

export const metadata: Metadata = { title: 'Admin - Earnings' };

export default function AdminEarningsPage() {
  return (
    <DashboardShell title="Earnings Dashboard">
      <AdminEarnings />
    </DashboardShell>
  );
}
