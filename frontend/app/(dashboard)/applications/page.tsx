import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { ApplicationsList } from '@/components/applications/ApplicationsList';

export const metadata: Metadata = {
  title: 'Applications',
};

export default function ApplicationsPage() {
  return (
    <DashboardShell title="Applications">
      <ApplicationsList />
    </DashboardShell>
  );
}
