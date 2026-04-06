'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Bell, Check, Trash2, RefreshCw, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const pullStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications?action=mark-all-read', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('Todas as notificações marcadas como lidas');
    } catch {
      toast.error('Erro ao marcar notificações');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        toast.success('Notificação eliminada');
      }
    } catch {
      toast.error('Erro ao eliminar notificação');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    toast.success('Notificações atualizadas');
  };

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY.current === null) return;
    const diff = e.touches[0].clientY - pullStartY.current;
    if (diff > 80) {
      handleRefresh();
      pullStartY.current = null;
    }
  };

  const handleTouchEnd = () => {
    pullStartY.current = null;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.filter((n) => n.read).length;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays < 7) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'game': return '⚽';
      case 'palestrinha': return '🧑‍💼';
      case 'payment': return '💰';
      case 'general': return '📢';
      default: return '🔔';
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 glass-card rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Notificações</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              {unreadCount > 0 ? `${unreadCount} por ler` : 'Tudo em dia'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-emerald-400 hover:bg-emerald-400/10 transition-all duration-200 text-xs"
              >
                <Check className="w-4 h-4 mr-1" />
                Tudo lido
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-premium"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {refreshing && (
          <div className="flex justify-center py-2">
            <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <BellOff className="w-10 h-10 text-zinc-700" />
              </div>
              <h3 className="text-zinc-400 font-semibold text-lg mb-1">Sem notificações</h3>
              <p className="text-zinc-600 text-sm max-w-[240px] mx-auto">
                Quando houver novidades, vais ver aqui. Podes relaxar! 😌
              </p>
            </motion.div>
          </div>
        ) : (
          <>
            {/* Unread section */}
            {unreadCount > 0 && (
              <div className="mb-4">
                <p className="text-xs text-zinc-500 font-medium mb-2 px-1 uppercase tracking-wider">
                  Novas ({unreadCount})
                </p>
                <div className="space-y-2">
                  {notifications.filter(n => !n.read).map((n) => (
                    <NotificationCard
                      key={n.id}
                      notification={n}
                      formatTime={formatTime}
                      getTypeIcon={getTypeIcon}
                      deletingId={deletingId}
                      onMarkRead={handleMarkRead}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Read section */}
            {readCount > 0 && (
              <div className="mb-4">
                <p className="text-xs text-zinc-600 font-medium mb-2 px-1 uppercase tracking-wider">
                  Anteriores ({readCount})
                </p>
                <div className="space-y-2">
                  {notifications.filter(n => n.read).map((n) => (
                    <NotificationCard
                      key={n.id}
                      notification={n}
                      formatTime={formatTime}
                      getTypeIcon={getTypeIcon}
                      deletingId={deletingId}
                      onMarkRead={handleMarkRead}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NotificationCard({
  notification,
  formatTime,
  getTypeIcon,
  deletingId,
  onMarkRead,
  onDelete,
}: {
  notification: NotificationItem;
  formatTime: (d: string) => string;
  getTypeIcon: (t: string) => string;
  deletingId: string | null;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -200 }}
      className={`rounded-2xl p-4 transition-all duration-200 group ${
        notification.read
          ? 'glass-card hover:bg-zinc-800/60'
          : 'bg-emerald-500/5 border border-emerald-500/15 hover:border-emerald-500/30'
      }`}
      onClick={() => !notification.read && onMarkRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-800/80 flex items-center justify-center shrink-0 text-lg">
          {getTypeIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className={`text-sm font-medium truncate ${notification.read ? 'text-zinc-300' : 'text-white'}`}>
                {notification.title}
              </h4>
              <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{notification.message}</p>
            </div>
            {!notification.read && (
              <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1.5 notification-pulse" />
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-zinc-600">{formatTime(notification.createdAt)}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
                disabled={deletingId === notification.id}
                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-all duration-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
