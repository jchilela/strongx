'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { SendEmailForm } from '@/components/email/SendEmailForm';
import { BulkEmailForm } from '@/components/email/BulkEmailForm';
import { EmailHistoryTable } from '@/components/email/EmailHistoryTable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function EmailPage() {
  return (
    <DashboardShell title="Email">
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-2">
            <Tabs defaultValue="single">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="single" className="flex-1">Single Send</TabsTrigger>
                <TabsTrigger value="bulk" className="flex-1">Bulk Send</TabsTrigger>
              </TabsList>
              <TabsContent value="single">
                <SendEmailForm />
              </TabsContent>
              <TabsContent value="bulk">
                <BulkEmailForm />
              </TabsContent>
            </Tabs>
          </div>
          <div className="xl:col-span-3">
            <EmailHistoryTable />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
