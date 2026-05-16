import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AdminApplicationsList } from '@/components/admin/AdminApplicationsList';

export const metadata: Metadata = { title: 'Admin - Applications' };

export default function AdminApplicationsPage() {
  return (
    <DashboardShell title="Application Approvals">
      <AdminApplicationsList />
    </DashboardShell>
  );
}
