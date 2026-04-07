'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Flame, Trophy, Lock, Star, Zap, Crown, Heart, Laugh, Target, TrendingUp, Calendar, Sparkles, Award, Medal } from 'lucide-react';

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earnedAt: string | null;
}

interface UserStats {
  totalBadges: number;
  currentStreak: number;
  bestStreak: number;
  marketValue: number;
}

const BADGE_ICONS: Record<string, React.ReactNode> = {
  '🎯': <Target className="w-8 h-8" />,
  '🏆': <Trophy className="w-8 h-8" />,
  '🔥': <Flame className="w-8 h-8" />,
  '⭐': <Star className="w-8 h-8" />,
  '⚡': <Zap className="w-8 h-8" />,
  '👑': <Crown className="w-8 h-8" />,
  '❤️': <Heart className="w-8 h-8" />,
  '😂': <Laugh className="w-8 h-8" />,
  '📈': <TrendingUp className="w-8 h-8" />,
  '📅': <Calendar className="w-8 h-8" />,
  '✨': <Sparkles className="w-8 h-8" />,
  '🏅': <Award className="w-8 h-8" />,
  '🎖️': <Medal className="w-8 h-8" />,
};

const FILTER_TABS = [
  { value: 'all', label: 'Todas' },
  { value: 'streak', label: 'Streak' },
  { value: 'goals', label: 'Golos' },
  { value: 'mvp', label: 'MVP' },
  { value: 'special', label: 'Especiais' },
  { value: 'funny', label: 'Engraçadas' },
];

export default function BadgesPage() {
  const { user } = useAuthStore();
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/badges');
      if (res.ok) {
        const data = await res.json();
        setBadges(data.badges || []);
        setStats(data.stats || null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredBadges = badges.filter(b => {
    if (activeFilter === 'all') return true;
    return b.category === activeFilter;
  });

  const earnedCount = badges.filter(b => b.earnedAt).length;

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 glass-card rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">🏅 Conquistas</h1>
        <p className="text-zinc-500 text-sm mt-0.5">O teu armário de troféus</p>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-4 gap-2">
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="w-8 h-8 mx-auto rounded-lg bg-emerald-500/10 flex items-center justify-center mb-1">
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-white">{stats.totalBadges}</p>
            <p className="text-[10px] text-zinc-500">Conquistas</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="w-8 h-8 mx-auto rounded-lg bg-orange-500/10 flex items-center justify-center mb-1">
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-lg font-bold text-white flex items-center justify-center gap-1">
              {stats.currentStreak}
              {stats.currentStreak >= 3 && (
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="text-sm"
                >
                  🔥
                </motion.span>
              )}
            </p>
            <p className="text-[10px] text-zinc-500">Streak</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="w-8 h-8 mx-auto rounded-lg bg-amber-500/10 flex items-center justify-center mb-1">
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-lg font-bold text-white">{stats.bestStreak}</p>
            <p className="text-[10px] text-zinc-500">Melhor</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="w-8 h-8 mx-auto rounded-lg bg-teal-500/10 flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-lg font-bold text-white">{stats.marketValue.toFixed(1)}€</p>
            <p className="text-[10px] text-zinc-500">Valor</p>
          </div>
        </div>
      )}

      {/* Streak Fire Animation */}
      {stats && stats.currentStreak >= 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-4 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-amber-500/10 text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-4xl mb-2"
          >
            🔥
          </motion.div>
          <p className="text-white font-bold text-lg">{stats.currentStreak} Jogos Seguidos!</p>
          <p className="text-zinc-400 text-xs mt-1">A máquina não para! Continua assim! 💪</p>
        </motion.div>
      )}

      {/* Progress */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">Progresso</span>
          <span className="text-sm font-bold text-emerald-400">{earnedCount}/{badges.length}</span>
        </div>
        <div className="w-full bg-zinc-800/80 rounded-full h-2.5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${badges.length > 0 ? (earnedCount / badges.length) * 100 : 0}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="bg-gradient-to-r from-emerald-400 to-teal-400 h-2.5 rounded-full skill-glow"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-premium pb-1 -mx-1 px-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
              activeFilter === tab.value
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800/80 text-zinc-500 border border-zinc-700/50 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {filteredBadges.map((badge) => {
            const isEarned = !!badge.earnedAt;
            return (
              <motion.div
                key={badge.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', damping: 20 }}
                onClick={() => setSelectedBadge(badge)}
                className={`glass-card rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 relative overflow-hidden ${
                  isEarned
                    ? 'gradient-border-emerald hover:bg-zinc-800/60'
                    : 'opacity-50 hover:opacity-70'
                }`}
              >
                {isEarned && (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                )}
                <div className="relative">
                  <div className={`text-4xl mb-2 ${isEarned ? '' : 'grayscale'}`}>
                    {badge.icon}
                  </div>
                  {!isEarned && (
                    <div className="absolute top-0 right-0 w-6 h-6 rounded-full bg-zinc-800/90 flex items-center justify-center">
                      <Lock className="w-3 h-3 text-zinc-600" />
                    </div>
                  )}
                </div>
                <p className={`text-sm font-semibold ${isEarned ? 'text-white' : 'text-zinc-500'}`}>
                  {badge.name}
                </p>
                <p className={`text-[10px] mt-0.5 ${isEarned ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {isEarned ? '✅ Conquistada' : '🔒 Por desbloquear'}
                </p>
                {isEarned && badge.earnedAt && (
                  <p className="text-[10px] text-zinc-600 mt-1">
                    {new Date(badge.earnedAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                  </p>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredBadges.length === 0 && (
        <div className="text-center py-8">
          <p className="text-zinc-600 text-2xl mb-2">🏅</p>
          <p className="text-zinc-500 text-sm">Sem conquistas nesta categoria</p>
        </div>
      )}

      {/* Badge Detail Modal */}
      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800/50 sm:max-w-sm max-w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="text-5xl mb-2">{selectedBadge?.icon}</div>
              <span className={`text-lg ${selectedBadge?.earnedAt ? 'text-white' : 'text-zinc-500'}`}>
                {selectedBadge?.name}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-3">
            <p className="text-zinc-400 text-sm">{selectedBadge?.description}</p>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="text-xs bg-zinc-800 text-zinc-300 border-zinc-700">
                {selectedBadge?.category === 'streak' ? '🔥 Streak' :
                 selectedBadge?.category === 'goals' ? '⚽ Golos' :
                 selectedBadge?.category === 'mvp' ? '⭐ MVP' :
                 selectedBadge?.category === 'special' ? '✨ Especial' :
                 '😂 Engraçada'}
              </Badge>
            </div>
            {selectedBadge?.earnedAt ? (
              <div className="glass-card rounded-xl p-3 inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm font-medium">
                  Conquistada em {new Date(selectedBadge.earnedAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
            ) : (
              <div className="glass-card rounded-xl p-3 inline-flex items-center gap-2">
                <Lock className="w-4 h-4 text-zinc-500" />
                <span className="text-zinc-500 text-sm">Ainda não desbloqueada</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
