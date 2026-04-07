'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { Trophy, Star, Flame, Calendar, Target, Crown, Zap } from 'lucide-react';

interface HOFPlayer {
  id: string;
  name: string;
  avatar: string | null;
  overallRating: number;
  gamesPlayed: number;
  mvpCount: number;
  currentStreak: number;
  bestStreak: number;
  totalGoals: number;
  totalAssists: number;
  palestrinhaBio: string;
}

interface CategoryLeader {
  rank: number;
  playerId: string;
  playerName: string;
  value: number;
  palestrinhaBio: string;
}

export default function HallOfFamePage() {
  const [topPlayers, setTopPlayers] = useState<HOFPlayer[]>([]);
  const [mvpLeaders, setMvpLeaders] = useState<CategoryLeader[]>([]);
  const [streakLeaders, setStreakLeaders] = useState<CategoryLeader[]>([]);
  const [presenceLeaders, setPresenceLeaders] = useState<CategoryLeader[]>([]);
  const [goalLeaders, setGoalLeaders] = useState<CategoryLeader[]>([]);
  const [assistLeaders, setAssistLeaders] = useState<CategoryLeader[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/hall-of-fame');
      if (res.ok) {
        const data = await res.json();
        setTopPlayers(data.topPlayers || []);
        setMvpLeaders(data.mvpLeaders || []);
        setStreakLeaders(data.streakLeaders || []);
        setPresenceLeaders(data.presenceLeaders || []);
        setGoalLeaders(data.goalLeaders || []);
        setAssistLeaders(data.assistLeaders || []);
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

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2);

  const PodiumCard = ({ player, position }: { player: HOFPlayer; position: number }) => {
    const configs = {
      1: {
        medal: '🥇',
        bgColor: 'from-amber-500/10 via-yellow-500/10 to-amber-500/5',
        borderColor: 'gradient-border-emerald',
        ringClass: 'ring-2 ring-amber-500/50 ring-offset-2 ring-offset-zinc-900',
        textSize: 'text-lg',
        badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
        shadowClass: 'shadow-xl shadow-amber-500/10',
        height: 'h-44',
      },
      2: {
        medal: '🥈',
        bgColor: 'from-zinc-400/5 via-zinc-300/5 to-zinc-400/5',
        borderColor: '',
        ringClass: 'ring-1 ring-zinc-500/30',
        textSize: 'text-sm',
        badgeColor: 'bg-zinc-400/10 text-zinc-300 border-zinc-400/20',
        shadowClass: 'shadow-lg shadow-black/10',
        height: 'h-40',
      },
      3: {
        medal: '🥉',
        bgColor: 'from-amber-700/5 via-amber-600/5 to-amber-700/5',
        borderColor: '',
        ringClass: 'ring-1 ring-amber-700/30',
        textSize: 'text-sm',
        badgeColor: 'bg-amber-700/10 text-amber-500 border-amber-700/20',
        shadowClass: 'shadow-lg shadow-black/10',
        height: 'h-40',
      },
    };
    const config = configs[position as 1 | 2 | 3];

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: position * 0.15 }}
        className={`glass-card rounded-2xl overflow-hidden ${config.shadowClass} ${config.borderColor}`}
      >
        <div className={`bg-gradient-to-br ${config.bgColor} p-4 text-center ${config.height} flex flex-col items-center justify-center`}>
          <span className="text-2xl mb-1">{config.medal}</span>
          {position === 1 && (
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
              <Crown className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            </motion.div>
          )}
          <Avatar className={`w-${position === 1 ? '16' : '14'} h-${position === 1 ? '16' : '14'} mx-auto mb-2 ${config.ringClass}`}>
            <AvatarFallback className={`bg-zinc-800 text-white ${position === 1 ? 'text-xl' : 'text-base'}`}>
              {getInitials(player.name)}
            </AvatarFallback>
          </Avatar>
          <p className={`font-bold text-white truncate w-full ${config.textSize}`}>{player.name}</p>
          <Badge variant="outline" className={`text-[10px] mt-1 px-2 py-0 ${config.badgeColor}`}>
            OVR {player.overallRating}
          </Badge>
          <p className="text-zinc-500 text-[10px] mt-2 italic line-clamp-2 px-1">
            &quot;{player.palestrinhaBio}&quot;
          </p>
        </div>
      </motion.div>
    );
  };

  const CategorySection = ({
    icon: Icon,
    title,
    leaders,
    colorClass,
    unit,
  }: {
    icon: React.ElementType;
    title: string;
    leaders: CategoryLeader[];
    colorClass: string;
    unit: string;
  }) => (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${colorClass}`} />
        <span className="text-sm font-semibold text-zinc-300">{title}</span>
      </div>
      <div className="space-y-2">
        {leaders.slice(0, 5).map((leader) => (
          <div
            key={leader.playerId}
            className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-all duration-200"
          >
            <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
              leader.rank === 1
                ? 'bg-amber-500/15 text-amber-400'
                : leader.rank === 2
                  ? 'bg-zinc-400/15 text-zinc-300'
                  : leader.rank === 3
                    ? 'bg-amber-700/15 text-amber-500'
                    : 'bg-zinc-800 text-zinc-500'
            }`}>
              {leader.rank === 1 ? <Crown className="w-3.5 h-3.5" /> : leader.rank}
            </div>
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                {getInitials(leader.playerName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{leader.playerName}</p>
            </div>
            <span className={`text-sm font-bold ${colorClass}`}>
              {leader.value}{unit}
            </span>
          </div>
        ))}
        {leaders.length === 0 && (
          <p className="text-zinc-600 text-xs text-center py-3">Sem dados disponíveis</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 glass-card rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center">
        <motion.div
          animate={{ rotate: [0, -3, 3, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="inline-block mb-1"
        >
          <Trophy className="w-8 h-8 text-amber-400 mx-auto" />
        </motion.div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
          Salão da Fama
        </h1>
        <p className="text-zinc-500 text-sm mt-0.5">🏆 Banco de Honra do Futebol Bonfim</p>
      </div>

      {/* Palestrinha intro */}
      <div className="glass-card rounded-2xl p-4 bg-gradient-to-r from-amber-500/5 to-yellow-500/5">
        <div className="flex items-start gap-3">
          <div className="text-2xl shrink-0">🎭</div>
          <p className="text-sm text-zinc-300 italic leading-relaxed">
            &quot;Aqui estão os deuses do relvado! Os que fazem o Bonfim tremer. Palco de lendas, campo de heróis... e alguns que só estragam o jogo.&quot;
          </p>
        </div>
      </div>

      {/* Top 3 Podium */}
      {topPlayers.length >= 1 && (
        <div>
          <h2 className="text-base font-semibold text-white mb-3 text-center flex items-center justify-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            Top 3 Geral 🥇
          </h2>
          <div className="flex items-end justify-center gap-3">
            {topPlayers.length >= 2 && <PodiumCard player={topPlayers[1]} position={2} />}
            {topPlayers.length >= 1 && <PodiumCard player={topPlayers[0]} position={1} />}
            {topPlayers.length >= 3 && <PodiumCard player={topPlayers[2]} position={3} />}
            {topPlayers.length === 1 && <PodiumCard player={topPlayers[0]} position={1} />}
            {topPlayers.length === 2 && <PodiumCard player={topPlayers[1]} position={2} />}
          </div>
        </div>
      )}

      {/* Category Leaderboards */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Classificações por Categoria
        </h2>

        <CategorySection
          icon={Star}
          title="🌟 Mais MVPs"
          leaders={mvpLeaders}
          colorClass="text-amber-400"
          unit="×"
        />
        <CategorySection
          icon={Flame}
          title="🔥 Melhor Streak"
          leaders={streakLeaders}
          colorClass="text-orange-400"
          unit=""
        />
        <CategorySection
          icon={Calendar}
          title="📅 Mais Presenças"
          leaders={presenceLeaders}
          colorClass="text-teal-400"
          unit=""
        />
        <CategorySection
          icon={Target}
          title="⚽ Melhor Marcador"
          leaders={goalLeaders}
          colorClass="text-emerald-400"
          unit=" golos"
        />
        <CategorySection
          icon={Zap}
          title="🎯 Melhor Assistente"
          leaders={assistLeaders}
          colorClass="text-sky-400"
          unit=" assist."
        />
      </div>
    </div>
  );
}
