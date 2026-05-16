import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { SendWhatsAppForm } from '@/components/whatsapp/SendWhatsAppForm';
import { WhatsAppHistoryTable } from '@/components/whatsapp/WhatsAppHistoryTable';

export const metadata: Metadata = {
  title: 'WhatsApp',
};

export default function WhatsAppPage() {
  return (
    <DashboardShell title="WhatsApp">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2">
          <SendWhatsAppForm />
        </div>
        <div className="xl:col-span-3">
          <WhatsAppHistoryTable />
        </div>
      </div>
    </DashboardShell>
  );
}
