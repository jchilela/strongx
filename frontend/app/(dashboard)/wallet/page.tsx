import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { BalanceCard } from '@/components/wallet/BalanceCard';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';

export const metadata: Metadata = {
  title: 'Wallet',
};

export default function WalletPage() {
  return (
    <DashboardShell title="Wallet">
      <div className="space-y-6">
        <div className="max-w-md">
          <BalanceCard />
        </div>
        <TransactionHistory />
      </div>
    </DashboardShell>
  );
}
