import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AdminUsersList } from '@/components/admin/AdminUsersList';

export const metadata: Metadata = { title: 'Admin - Users' };

export default function AdminUsersPage() {
  return (
    <DashboardShell title="User Management">
      <AdminUsersList />
    </DashboardShell>
  );
}
