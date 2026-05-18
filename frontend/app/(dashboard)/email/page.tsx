'use client';

import { Mail, Clock } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useLang } from '@/lib/lang';

export default function EmailPage() {
  const { t } = useLang();

  return (
    <DashboardShell title={t.email.title}>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 mx-auto mb-6">
            <Mail className="h-10 w-10 text-orange-500" />
          </div>
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <Clock className="h-4 w-4" />
            {t.email.comingSoon}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-3">{t.email.title}</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            {t.email.comingSoonDesc}
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
