'use client';

import { useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { SendSmsForm } from '@/components/sms/SendSmsForm';
import { BulkSmsForm } from '@/components/sms/BulkSmsForm';
import { MessagesTable } from '@/components/sms/MessagesTable';
import { useLang } from '@/lib/lang';

export default function SmsPage() {
  const { t } = useLang();
  const [tab, setTab] = useState<'single' | 'bulk'>('single');

  return (
    <DashboardShell title={t.nav.sms}>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 space-y-4">
          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setTab('single')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'single' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Single
            </button>
            <button
              onClick={() => setTab('bulk')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'bulk' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Bulk
            </button>
          </div>

          {tab === 'single' ? <SendSmsForm /> : <BulkSmsForm />}
        </div>
        <div className="xl:col-span-3">
          <MessagesTable />
        </div>
      </div>
    </DashboardShell>
  );
}
