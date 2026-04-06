'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Bell, X } from 'lucide-react';
import Image from 'next/image';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, fetchUser } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Build tabs dynamically based on user role
  const getTabs = () => {
    const isMensalista = user?.playerType === 'mensalista' || user?.role === 'admin';
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

  const fetchNotifCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?count=true');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
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
    const isMensalista = user.playerType === 'mensalista' || user.role === 'admin';
    const isAdmin = user.role === 'admin';

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

  const handleOpenNotifications = async () => {
    setShowNotifications(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(0);
      }
    } catch {
      // ignore
    }
  };

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
      {/* Top gradient accent line */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 z-[60]" />

      <div className="max-w-md mx-auto pb-20 pt-1">
        {children}
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center pt-16 px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNotifications(false)} />
          <div className="relative w-full max-w-md glass-card shadow-xl shadow-black/30 rounded-2xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" />
                Notificações
              </h3>
              <button onClick={() => setShowNotifications(false)} className="text-zinc-500 hover:text-white transition-colors duration-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-2 scrollbar-premium">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-500 text-sm">Sem notificações</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl mb-1 transition-all duration-200 ${
                      n.read ? 'bg-transparent' : 'bg-emerald-500/5 border border-emerald-500/10'
                    }`}
                  >
                    <p className="text-white text-sm font-medium">{n.title}</p>
                    <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{n.message}</p>
                    <p className="text-zinc-600 text-xs mt-1.5">
                      {new Date(n.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-800/50 z-50">
        <div className="max-w-md mx-auto flex">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const showBell = tab.href === '/' && unreadCount > 0;
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
                  {showBell && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center notification-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className={`${isActive ? 'font-semibold' : ''}`}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
