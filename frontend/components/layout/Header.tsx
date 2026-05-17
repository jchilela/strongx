'use client';

import { Menu, Bell, MessageSquare, Mail, MessageCircle } from 'lucide-react';
import { useWalletBalance } from '@/hooks/useWallet';
import { useSocket } from '@/hooks/useSocket';
import { cn } from '@/lib/utils';
import { useLang, LangToggle } from '@/lib/lang';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { data: balance } = useWalletBalance();
  const { isConnected } = useSocket();
  const { t } = useLang();

  const smsCount = balance ? Math.floor(balance.balance / balance.smsCost) : 0;
  const emailCount = balance ? Math.floor(balance.balance / balance.emailCost) : 0;
  const waCount = balance ? Math.floor(balance.balance / balance.whatsappCost) : 0;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Message counts */}
        {balance && (
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-full text-xs font-semibold" title="SMS available">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{smsCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-full text-xs font-semibold" title="Emails available">
              <Mail className="h-3.5 w-3.5" />
              <span>{emailCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1.5 rounded-full text-xs font-semibold" title="WhatsApp available">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{waCount.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Language toggle */}
        <LangToggle />

        {/* Notification bell */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-[#6366f1] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* Real-time connection indicator */}
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            )}
          />
          <span className="hidden sm:block text-xs text-gray-500">
            {isConnected ? t.header.live : t.header.offline}
          </span>
        </div>
      </div>
    </header>
  );
}
