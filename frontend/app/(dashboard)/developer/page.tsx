import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { ApiKeysList } from '@/components/developer/ApiKeysList';
import { CodeSnippets } from '@/components/developer/CodeSnippets';

export const metadata: Metadata = {
  title: 'Developer',
};

export default function DeveloperPage() {
  return (
    <DashboardShell title="Developer">
      <div className="space-y-6">
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366f1] flex-shrink-0">
            <span className="text-white text-sm font-bold">!</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-800">API Base URL</p>
            <code className="text-sm text-indigo-700 font-mono">
              https://api.strongx.it.ao/v1
            </code>
          </div>
        </div>

        <ApiKeysList />
        <CodeSnippets />
      </div>
    </DashboardShell>
  );
}
