'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Menu, Bell, MessageSquare, Mail, MessageCircle, CheckCheck, X } from 'lucide-react';
import { useWalletBalance } from '@/hooks/useWallet';
import { useSocket } from '@/hooks/useSocket';
import { cn } from '@/lib/utils';
import { useLang, LangToggle } from '@/lib/lang';
import { notificationsApi, type Notification } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  warning: 'bg-orange-100 text-orange-700',
  info: 'bg-blue-100 text-blue-700',
};

export function Header({ title, onMenuClick }: HeaderProps) {
  const { data: balance } = useWalletBalance();
  const { isConnected } = useSocket();
  const { t } = useLang();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const smsCount = balance ? Math.floor(balance.balance / balance.smsCost) : 0;
  const emailCount = balance ? Math.floor(balance.balance / balance.emailCost) : 0;
  const waCount = balance ? Math.floor(balance.balance / balance.whatsappCost) : 0;

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const res = await notificationsApi.getUnreadCount();
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  const { data: notifList } = useQuery({
    queryKey: ['notifications-list'],
    queryFn: async () => {
      const res = await notificationsApi.list(1, 10);
      return res.data.data;
    },
    enabled: panelOpen,
  });

  const { mutate: markAllRead } = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panelOpen]);

  const unreadCount = unreadData?.unread_count ?? 0;

  const handleNotificationClick = (n: Notification) => {
    if (!n.is_read) markRead(n.id);
    if (n.type === 'success' && n.title.toLowerCase().includes('top-up')) {
      router.push('/wallet');
    }
    setPanelOpen(false);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {balance && (
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-full text-xs font-semibold" title="SMS disponíveis">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{smsCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-full text-xs font-semibold" title="Emails disponíveis">
              <Mail className="h-3.5 w-3.5" />
              <span>{emailCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1.5 rounded-full text-xs font-semibold" title="WhatsApp disponíveis">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{waCount.toLocaleString()}</span>
            </div>
          </div>
        )}

        <LangToggle />

        {/* Notification bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setPanelOpen((o) => !o)}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-[#6366f1] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {panelOpen && (
            <div className="absolute right-0 top-11 z-50 w-80 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">{t.notifications.title}</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllRead()}
                      className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
                      title={t.notifications.markAllRead}
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      {t.notifications.markAllRead}
                    </button>
                  )}
                  <button onClick={() => setPanelOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {!notifList?.items?.length ? (
                  <div className="py-8 text-center">
                    <Bell className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">{t.notifications.noNotifications}</p>
                    <p className="text-xs text-gray-300 mt-1">{t.notifications.noNotificationsDesc}</p>
                  </div>
                ) : (
                  notifList.items.map((n: Notification) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        'w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors',
                        !n.is_read && 'bg-indigo-50/40'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0 uppercase', TYPE_COLORS[n.type] ?? TYPE_COLORS.info)}>
                          {n.type}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-900 truncate">{n.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-2">{n.body}</p>
                          <p className="text-[10px] text-gray-300 mt-1">{formatDate(n.created_at)}</p>
                        </div>
                        {!n.is_read && <span className="h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1" />}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
