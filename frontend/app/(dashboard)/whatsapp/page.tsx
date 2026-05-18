'use client';

import { MessageCircle, Clock } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useLang } from '@/lib/lang';

export default function WhatsAppPage() {
  const { t } = useLang();

  return (
    <DashboardShell title={t.whatsapp.title}>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mx-auto mb-6">
            <MessageCircle className="h-10 w-10 text-green-500" />
          </div>
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <Clock className="h-4 w-4" />
            {t.whatsapp.comingSoon}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-3">{t.whatsapp.title}</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            {t.whatsapp.comingSoonDesc}
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
