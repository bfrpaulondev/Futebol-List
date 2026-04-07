'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Bell } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import PwaInstallModal from '@/components/pwa-install-modal';
import PushManager from '@/components/push-manager';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, fetchUser } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  // Build tabs dynamically based on user role
  const getTabs = () => {
    const isMensalista = user?.playerType === 'mensalista' || user?.role === 'admin' || user?.role === 'master';
    const baseTabs = [
      { href: '/', label: 'Jogo', icon: '⚽' },
      { href: '/teams', label: 'Equipas', icon: '👥' },
      { href: '/chat', label: 'Chat', icon: '💬' },
    ];
    if (isMensalista) {
      baseTabs.push({ href: '/finances', label: 'Finanças', icon: '💰' });
    }
    baseTabs.push({ href: '/profile', label: 'Perfil', icon: '👤' });
    return baseTabs;
  };

  const tabs = getTabs();

  const prevUnreadRef = useRef(0);

  const fetchNotifCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?count=true');
      if (res.ok) {
        const data = await res.json();
        const newCount = data.count || 0;
        // Toast on new notifications
        if (prevUnreadRef.current > 0 && newCount > prevUnreadRef.current) {
          toast.info(`Tens ${newCount - prevUnreadRef.current} nova(s) notificação(ões)`);
        }
        prevUnreadRef.current = newCount;
        setUnreadCount(newCount);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user) {
      const loadCount = () => { fetchNotifCount(); };
      loadCount();
      const interval = setInterval(loadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifCount]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  // Redirect convidados away from restricted pages
  useEffect(() => {
    if (!user || isLoading) return;
    const isMensalista = user.playerType === 'mensalista' || user.role === 'admin' || user.role === 'master';
    const isAdmin = user.role === 'admin' || user.role === 'master';

    if (pathname.startsWith('/finances') && !isMensalista) {
      router.replace('/');
    }
    if (pathname.startsWith('/payments') && !isMensalista) {
      router.replace('/');
    }
    if (pathname.startsWith('/admin') && !isAdmin) {
      router.replace('/');
    }
  }, [user, isLoading, pathname, router]);

  const isNotificationsPage = pathname === '/notifications';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Image src="/logo.png" alt="Futebol Bonfim" width={40} height={40} className="rounded-xl animate-pulse" />
          <div className="text-zinc-500 text-sm">A carregar...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* PWA Install Modal */}
      <PwaInstallModal />
      {/* Push Notification Manager */}
      <PushManager />
      {/* Top gradient accent line */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 z-[60]" />

      <div className="max-w-md mx-auto pb-20 pt-1">
        {children}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-800/50 z-50">
        <div className="max-w-md mx-auto flex items-center">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center py-2.5 text-xs transition-all duration-200 relative ${
                  isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-b-full" />
                )}
                <div className="relative">
                  <span className="text-lg mb-0.5">{tab.icon}</span>
                </div>
                <span className={`${isActive ? 'font-semibold' : ''}`}>{tab.label}</span>
              </Link>
            );
          })}

          {/* Notification bell button */}
          <button
            onClick={() => router.push('/notifications')}
            className={`flex-1 flex flex-col items-center py-2.5 text-xs transition-all duration-200 relative ${
              isNotificationsPage ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {isNotificationsPage && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-b-full" />
            )}
            <div className="relative">
              <Bell className="w-5 h-5 mb-0.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center notification-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className={`${isNotificationsPage ? 'font-semibold' : ''}`}>Notif.</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
