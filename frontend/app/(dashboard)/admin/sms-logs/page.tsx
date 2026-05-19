import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AdminSmsLogs } from '@/components/admin/AdminSmsLogs';

export const metadata: Metadata = { title: 'Admin - SMS Send Logs' };

export default function AdminSmsLogsPage() {
  return (
    <DashboardShell title="SMS Send Logs">
      <AdminSmsLogs />
    </DashboardShell>
  );
}
