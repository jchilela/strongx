'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { SendSmsForm } from '@/components/sms/SendSmsForm';
import { MessagesTable } from '@/components/sms/MessagesTable';
import { useLang } from '@/lib/lang';

export default function SmsPage() {
  const { t } = useLang();
  return (
    <DashboardShell title={t.nav.sms}>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2">
          <SendSmsForm />
        </div>
        <div className="xl:col-span-3">
          <MessagesTable />
        </div>
      </div>
    </DashboardShell>
  );
}
