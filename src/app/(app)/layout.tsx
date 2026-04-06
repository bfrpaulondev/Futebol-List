'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

const tabs = [
  { href: '/', label: 'Jogo', icon: '⚽' },
  { href: '/teams', label: 'Equipas', icon: '👥' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/finances', label: 'Finanças', icon: '💰' },
  { href: '/profile', label: 'Perfil', icon: '👤' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">A carregar...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-md mx-auto pb-20">
        {children}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50">
        <div className="max-w-md mx-auto flex">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center py-2.5 text-xs transition-colors relative ${
                  isActive ? 'text-teal-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-teal-400 rounded-b-full" />
                )}
                <span className="text-lg mb-0.5">{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
