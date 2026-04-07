'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Bell, MoreHorizontal, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import PwaInstallModal from '@/components/pwa-install-modal';
import PushManager from '@/components/push-manager';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
  mensalOnly?: boolean;
}

const MORE_ITEMS: NavItem[] = [
  { href: '/badges', label: 'Conquistas', icon: '🏅' },
  { href: '/complaints', label: 'Bureau de Queixas', icon: '📋' },
  { href: '/reviews', label: 'Revista Palestrinha', icon: '📰' },
  { href: '/leaderboard', label: 'Ranking', icon: '🏅' },
  { href: '/hall-of-fame', label: 'Salão da Fama', icon: '🏆', mensalOnly: true },
  { href: '/market', label: 'Cotação de Mercado', icon: '💰', mensalOnly: true },
  { href: '/game-stats', label: 'Estatísticas do Jogo', icon: '📊', adminOnly: true },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, fetchUser } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const getFilteredMoreItems = () => {
    const isMensalista = user?.playerType === 'mensalista' || user?.role === 'admin' || user?.role === 'master';
    const isAdmin = user?.role === 'admin' || user?.role === 'master';
    return MORE_ITEMS.filter(item => {
      if (item.adminOnly && !isAdmin) return false;
      if (item.mensalOnly && !isMensalista) return false;
      return true;
    });
  };

  const filteredMoreItems = getFilteredMoreItems();

  // Check if current path is in "More" items
  const isMoreItem = MORE_ITEMS.some(item => pathname === item.href);

  const prevUnreadRef = useRef(0);

  const fetchNotifCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?count=true');
      if (res.ok) {
        const data = await res.json();
        const newCount = data.count || 0;
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
    if (pathname.startsWith('/game-stats') && !isAdmin) {
      router.replace('/');
    }
    if (pathname.startsWith('/hall-of-fame') && !isMensalista) {
      router.replace('/');
    }
    if (pathname.startsWith('/market') && !isMensalista) {
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

  const handleMoreItemClick = (href: string) => {
    setDrawerOpen(false);
    router.push(href);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <PwaInstallModal />
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

          {/* More Button (Drawer) */}
          <div className="flex-1 flex flex-col items-center py-2.5 text-xs transition-all duration-200 relative">
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <button className={`flex flex-col items-center ${isMoreItem ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  {isMoreItem && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-b-full" />
                  )}
                  <MoreHorizontal className="w-5 h-5 mb-0.5" />
                  <span className={isMoreItem ? 'font-semibold' : ''}>Mais</span>
                </button>
              </DrawerTrigger>
              <DrawerContent className="bg-zinc-900 border-zinc-800/50">
                <div className="mx-auto w-full max-w-md">
                  <DrawerHeader>
                    <DrawerTitle className="text-white text-center">Mais Opções</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-6 space-y-1">
                    {filteredMoreItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => handleMoreItemClick(item.href)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                          pathname === item.href
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'text-zinc-300 hover:bg-zinc-800/60'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                          pathname === item.href ? 'bg-emerald-500/15' : 'bg-zinc-800'
                        }`}>
                          {item.icon}
                        </div>
                        <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                        <ChevronRight className="w-4 h-4 text-zinc-600" />
                      </button>
                    ))}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>

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
