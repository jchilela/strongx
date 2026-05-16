'use client';

import { useState } from 'react';
import { Wallet, ArrowUpRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWalletBalance } from '@/hooks/useWallet';
import { formatCurrency } from '@/lib/utils';
import { TopUpModal } from './TopUpModal';
import { useQueryClient } from '@tanstack/react-query';

export function BalanceCard() {
  const [topUpOpen, setTopUpOpen] = useState(false);
  const { data: balance, isLoading, refetch } = useWalletBalance();
  const queryClient = useQueryClient();

  return (
    <>
      <div className="wallet-gradient rounded-2xl p-6 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white" />
          <div className="absolute -right-4 -bottom-12 h-32 w-32 rounded-full bg-white" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/70">Wallet Balance</p>
                <p className="text-xs text-white/50">Angola Kwanza (AOA)</p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Refresh balance"
            >
              <RefreshCw className="h-4 w-4 text-white" />
            </button>
          </div>

          <div className="mb-6">
            {isLoading ? (
              <div className="h-12 w-48 bg-white/20 rounded-lg animate-pulse" />
            ) : (
              <p className="text-4xl font-bold text-white">
                {balance ? formatCurrency(balance.balance) : 'AOA 0.00'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setTopUpOpen(true)}
              className="bg-white text-[#fb923c] hover:bg-white/90 font-semibold"
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Top Up
            </Button>
            <p className="text-xs text-white/60">
              Funds are used automatically when sending messages
            </p>
          </div>
        </div>
      </div>

      <TopUpModal open={topUpOpen} onOpenChange={setTopUpOpen} />
    </>
  );
}
