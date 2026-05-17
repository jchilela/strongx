'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { BalanceCard } from '@/components/wallet/BalanceCard';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';
import { useLang } from '@/lib/lang';

export default function WalletPage() {
  const { t } = useLang();
  return (
    <DashboardShell title={t.wallet.title}>
      <div className="space-y-6">
        <div className="max-w-md">
          <BalanceCard />
        </div>
        <TransactionHistory />
      </div>
    </DashboardShell>
  );
}
