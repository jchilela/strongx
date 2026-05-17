'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { ApplicationsList } from '@/components/applications/ApplicationsList';
import { useLang } from '@/lib/lang';

export default function ApplicationsPage() {
  const { t } = useLang();
  return (
    <DashboardShell title={t.applications.title}>
      <ApplicationsList />
    </DashboardShell>
  );
}
