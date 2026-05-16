import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { SendSmsForm } from '@/components/sms/SendSmsForm';
import { MessagesTable } from '@/components/sms/MessagesTable';

export const metadata: Metadata = {
  title: 'SMS',
};

export default function SmsPage() {
  return (
    <DashboardShell title="SMS">
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
