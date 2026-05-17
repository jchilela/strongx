'use client';

import { useState } from 'react';
import { Wallet, ArrowUpRight, RefreshCw, MessageSquare, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWalletBalance } from '@/hooks/useWallet';
import { formatCurrency } from '@/lib/utils';
import { TopUpModal } from './TopUpModal';
import { useLang } from '@/lib/lang';

export function BalanceCard() {
  const [topUpOpen, setTopUpOpen] = useState(false);
  const { data: balance, isLoading, refetch } = useWalletBalance();
  const { t } = useLang();

  const smsCount = balance ? Math.floor(balance.balance / balance.smsCost) : 0;
  const emailCount = balance ? Math.floor(balance.balance / balance.emailCost) : 0;
  const waCount = balance ? Math.floor(balance.balance / balance.whatsappCost) : 0;

  return (
    <>
      <div className="wallet-gradient rounded-2xl p-6 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white" />
          <div className="absolute -right-4 -bottom-12 h-32 w-32 rounded-full bg-white" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/70">{t.wallet.availableMessages}</p>
                <p className="text-xs text-white/50">
                  {t.wallet.balance}: {balance ? formatCurrency(balance.balance) : 'AOA 0.00'}
                </p>
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

          {/* Message counts */}
          {isLoading ? (
            <div className="space-y-2 mb-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-white/20 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <MessageSquare className="h-4 w-4 text-white/70 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{smsCount.toLocaleString()}</p>
                <p className="text-xs text-white/60 mt-0.5">SMS</p>
                <p className="text-xs text-white/40">{balance ? formatCurrency(balance.smsCost) : ''}/msg</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <Mail className="h-4 w-4 text-white/70 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{emailCount.toLocaleString()}</p>
                <p className="text-xs text-white/60 mt-0.5">Email</p>
                <p className="text-xs text-white/40">{balance ? formatCurrency(balance.emailCost) : ''}/msg</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <MessageCircle className="h-4 w-4 text-white/70 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{waCount.toLocaleString()}</p>
                <p className="text-xs text-white/60 mt-0.5">WhatsApp</p>
                <p className="text-xs text-white/40">{balance ? formatCurrency(balance.whatsappCost) : ''}/msg</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setTopUpOpen(true)}
              className="bg-white text-[#fb923c] hover:bg-white/90 font-semibold"
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              {t.wallet.topUp}
            </Button>
            <p className="text-xs text-white/60">
              {t.wallet.fundsUsed}
            </p>
          </div>
        </div>
      </div>

      <TopUpModal open={topUpOpen} onOpenChange={setTopUpOpen} />
    </>
  );
}
