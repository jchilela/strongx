import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/components/shared/QueryProvider';
import { LangProvider } from '@/lib/lang';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'StrongX - Notification Platform',
    template: '%s | StrongX',
  },
  description:
    'StrongX is a powerful SaaS notification platform for SMS, Email, and WhatsApp messaging in Angola.',
  keywords: ['SMS', 'Email', 'WhatsApp', 'Notifications', 'Angola', 'AOA'],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <LangProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
          </LangProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
