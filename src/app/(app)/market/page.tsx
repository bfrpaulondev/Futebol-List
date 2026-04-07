'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Crown, Info, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';

interface MarketPlayer {
  id: string;
  name: string;
  marketValue: number;
  previousValue: number;
  change: number;
  changeReason: string;
}

interface MarketHistory {
  date: string;
  value: number;
}

export default function MarketPage() {
  const { user } = useAuthStore();
  const [players, setPlayers] = useState<MarketPlayer[]>([]);
  const [history, setHistory] = useState<MarketHistory[]>([]);
  const [palestrinhaComment, setPalestrinhaComment] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/market');
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.players || []);
        setHistory(data.history || []);
        setPalestrinhaComment(data.palestrinhaComment || '');
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

  const myData = players.find(p => p.id === user?.id);
  const sortedPlayers = [...players].sort((a, b) => b.marketValue - a.marketValue);
  const topPlayer = sortedPlayers[0];

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-zinc-400 text-[10px]">{label}</p>
          <p className="text-emerald-400 text-sm font-bold">{payload[0].value.toFixed(2)}€</p>
        </div>
      );
    }
    return null;
  };

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
        <h1 className="text-2xl font-bold text-white tracking-tight">💰 Cotação de Mercado</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Quanto vales no mercado? 📈</p>
      </div>

      {/* Palestrinha Comment */}
      {palestrinhaComment && (
        <div className="glass-card rounded-2xl p-4 bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
          <div className="flex items-start gap-3">
            <div className="text-2xl shrink-0">🎭</div>
            <p className="text-sm text-zinc-300 italic leading-relaxed">
              &quot;{palestrinhaComment}&quot;
            </p>
          </div>
        </div>
      )}

      {/* My Market Value Card */}
      {myData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl shadow-lg shadow-black/20 overflow-hidden gradient-border-emerald"
        >
          <div className="bg-zinc-900 rounded-2xl">
            <div className="bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 p-6 text-center">
              <p className="text-zinc-400 text-sm mb-1">A Tua Cotação</p>
              <div className="flex items-center justify-center gap-2 mb-1">
                <DollarSign className="w-6 h-6 text-emerald-400" />
                <p className="text-4xl font-bold text-emerald-400">{myData.marketValue.toFixed(2)}€</p>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                {myData.change >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-rose-400" />
                )}
                <span className={`text-sm font-medium ${myData.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {myData.change >= 0 ? '+' : ''}{myData.change.toFixed(2)}€
                </span>
              </div>
              {myData.changeReason && (
                <p className="text-zinc-500 text-xs mt-2 italic">{myData.changeReason}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Chart */}
      {history.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Histórico de Valor
          </h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="marketGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#marketGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Ranking */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            Ranking de Mercado
          </h2>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-zinc-800/80 text-zinc-400 border-zinc-700/50">
            {players.length} jogadores
          </Badge>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-premium">
          {sortedPlayers.map((p, index) => {
            const isTop = p.id === topPlayer?.id;
            const isMe = p.id === user?.id;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`glass-card rounded-xl p-3 transition-all duration-200 hover:bg-zinc-800/60 ${
                  isMe ? 'border-emerald-500/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                    index === 0
                      ? 'bg-amber-500/15 text-amber-400'
                      : index === 1
                        ? 'bg-zinc-400/15 text-zinc-300'
                        : index === 2
                          ? 'bg-amber-700/15 text-amber-500'
                          : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {index + 1}
                  </div>
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className={`bg-zinc-800 text-zinc-300 text-xs ${isMe ? 'ring-1 ring-emerald-500/30' : ''}`}>
                      {getInitials(p.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate flex items-center gap-1.5">
                      {p.name}
                      {isMe && <span className="text-[10px] text-emerald-400">(Tu)</span>}
                      {isTop && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                    </p>
                    {p.changeReason && (
                      <p className="text-zinc-600 text-[10px] truncate">{p.changeReason}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-bold">{p.marketValue.toFixed(2)}€</p>
                    <div className="flex items-center justify-end gap-0.5">
                      {p.change >= 0 ? (
                        <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 text-rose-400" />
                      )}
                      <span className={`text-[10px] font-medium ${p.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {p.change >= 0 ? '+' : ''}{p.change.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {sortedPlayers.length === 0 && (
            <p className="text-zinc-600 text-center text-sm py-8">Sem dados de mercado disponíveis</p>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-400">Como funciona?</span>
        </div>
        <div className="space-y-2">
          {[
            { icon: '⚽', text: 'Golos marcados aumentam o valor' },
            { icon: '🎯', text: 'Assistências contam positivamente' },
            { icon: '⭐', text: 'MVPs dão um grande boost' },
            { icon: '🔥', text: 'Streaks longos valorizam o jogador' },
            { icon: '📅', text: 'Presença regular mantém o valor' },
            { icon: '📉', text: 'Faltar jogos faz o valor descer' },
          ].map((item) => (
            <div key={item.icon} className="flex items-center gap-2 text-zinc-400 text-xs">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
        <p className="text-zinc-600 text-[10px] mt-3 italic">
          * Os valores são atualizados automaticamente após cada jogo.
        </p>
      </div>
    </div>
  );
}
