'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardShellProps {
  children: React.ReactNode;
  title: string;
}

export function DashboardShell({ children, title }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>

        <footer className="border-t border-gray-100 bg-white px-6 py-2 text-center">
          <p className="text-xs text-gray-300">
            &copy; {new Date().getFullYear()} StrongX &mdash;{' '}
            <Link href="/terms" target="_blank" className="hover:text-gray-500 underline">
              Termos de Serviço
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
