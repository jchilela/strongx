'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Mail,
  MessageCircle,
  AppWindow,
  Wallet,
  Code2,
  Settings,
  LogOut,
  X,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { clearAuth, getStoredUser } from '@/lib/auth';
import { authApi } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import type { User } from '@/types/auth';
import { useLang } from '@/lib/lang';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const { t } = useLang();

  const navItems = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/sms', label: t.nav.sms, icon: MessageSquare },
    { href: '/email', label: t.nav.email, icon: Mail },
    { href: '/whatsapp', label: t.nav.whatsapp, icon: MessageCircle },
    { href: '/applications', label: t.nav.applications, icon: AppWindow },
    { href: '/wallet', label: t.nav.wallet, icon: Wallet },
    { href: '/developer', label: t.nav.developer, icon: Code2 },
    { href: '/settings', label: t.nav.settings, icon: Settings },
  ];

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors
    } finally {
      disconnectSocket();
      clearAuth();
      toast.success('Logged out successfully');
      router.push('/login');
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col transition-transform duration-300',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          <Link href="/dashboard" className="flex items-center">
            <Image src="/logo.png" alt="StrongX" width={120} height={69} className="object-contain" priority />
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className={cn(
                      'sidebar-item',
                      isActive && 'active'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
            {user?.isAdmin && (
              <>
                <li className="pt-3">
                  <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t.nav.admin}</p>
                </li>
                <li>
                  <Link
                    href="/admin/users"
                    onClick={onClose}
                    className={cn('sidebar-item', (pathname.startsWith('/admin/users') || pathname.startsWith('/admin/applications')) && 'active')}
                  >
                    <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                    <span>{t.nav.usersApps}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/earnings"
                    onClick={onClose}
                    className={cn('sidebar-item', pathname.startsWith('/admin/earnings') && 'active')}
                  >
                    <TrendingUp className="h-4 w-4 flex-shrink-0" />
                    <span>{t.nav.earnings}</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-slate-700 p-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6366f1] text-white text-sm font-semibold flex-shrink-0">
              {user?.name ? getInitials(user.name) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="sidebar-item w-full mt-1 text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span>{loggingOut ? t.nav.loggingOut : t.nav.logout}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
