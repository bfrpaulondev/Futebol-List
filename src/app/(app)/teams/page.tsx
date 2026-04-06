'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TeamPlayer {
  userId: string;
  name: string;
  position: string;
  overallRating: number;
  playerType: string;
  avatar: string | null;
}

interface ArrivedPlayer {
  userId: string;
  name: string;
  position: string;
  overallRating: number;
  avatar: string | null;
  arrivedAt: string;
}

interface DrawStatus {
  arrived: ArrivedPlayer[];
  totalConfirmed: number;
  canDraw: boolean;
  teamsDrawn: boolean;
  teams: { teamA: TeamPlayer[]; teamB: TeamPlayer[]; reserves?: TeamPlayer[] } | null;
  aiCoachComment: string | null;
  timeUntilDraw: number | null;
}

type PageState = 'loading' | 'pre_draw' | 'drawing' | 'drawn';

export default function TeamsPage() {
  const { user } = useAuthStore();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [status, setStatus] = useState<DrawStatus | null>(null);
  const [drawingPhase, setDrawingPhase] = useState(0);
  const [animatedTeamA, setAnimatedTeamA] = useState<TeamPlayer[]>([]);
  const [animatedTeamB, setAnimatedTeamB] = useState<TeamPlayer[]>([]);
  const [animatedReserves, setAnimatedReserves] = useState<TeamPlayer[]>([]);
  const [drawError, setDrawError] = useState('');
  const [arriving, setArriving] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const gameIdRef = useRef<string | null>(null);

  const getGameId = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/games/next');
      const data = await res.json();
      if (data.game?.id) {
        gameIdRef.current = data.game.id;
        return data.game.id;
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  const fetchStatus = useCallback(async (gid: string) => {
    try {
      const res = await fetch(`/api/games/${gid}/draw-status`);
      const data = await res.json();
      setStatus(data);
      if (data.teamsDrawn && data.teams) {
        setPageState('drawn');
        setAnimatedTeamA(data.teams.teamA || []);
        setAnimatedTeamB(data.teams.teamB || []);
        setAnimatedReserves(data.teams.reserves || []);
      } else {
        setPageState('pre_draw');
      }
    } catch {
      // ignore
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      const gid = await getGameId();
      if (gid) {
        await fetchStatus(gid);
      } else {
        setPageState('pre_draw');
      }
    };
    init();
  }, [getGameId, fetchStatus]);

  // Polling for pre_draw state
  useEffect(() => {
    if (pageState === 'pre_draw' && gameIdRef.current) {
      pollingRef.current = setInterval(() => {
        fetchStatus(gameIdRef.current!);
      }, 5000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [pageState, fetchStatus]);

  const handleArrive = async () => {
    if (!gameIdRef.current || arriving) return;
    setArriving(user?.id || null);
    try {
      const res = await fetch(`/api/games/${gameIdRef.current}/arrive`, { method: 'POST' });
      const data = await res.json();
      if (data.success && gameIdRef.current) {
        await fetchStatus(gameIdRef.current);
      }
    } catch {
      // ignore
    } finally {
      setArriving(null);
    }
  };

  const handleDraw = async () => {
    if (!gameIdRef.current) return;
    setDrawError('');
    setPageState('drawing');
    setDrawingPhase(0);
    setAnimatedTeamA([]);
    setAnimatedTeamB([]);
    setAnimatedReserves([]);

    // Phase 1: GK spinning (0-2.5s)
    await delay(2500);
    setDrawingPhase(1);

    // Phase 2: A/B coin flip (2.5-5s)
    await delay(2500);
    setDrawingPhase(2);

    // Trigger actual draw
    try {
      const res = await fetch(`/api/games/${gameIdRef.current}/draw`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setDrawError(data.error || 'Erro no sorteio');
        setPageState('pre_draw');
        return;
      }

      const teams = JSON.parse(data.game.teamsJson);
      const teamA = teams.teamA || [];
      const teamB = teams.teamB || [];
      const reserves = teams.reserves || [];

      // Phase 3: Players flying in one by one (5-8s)
      setDrawingPhase(3);
      const allPlayers = [...teamA, ...teamB];
      const totalPlayers = allPlayers.length;
      const intervalMs = Math.max(150, 3000 / totalPlayers);

      for (let i = 0; i < totalPlayers; i++) {
        if (i < teamA.length) {
          setAnimatedTeamA((prev) => [...prev, teamA[i]]);
        } else {
          const bIdx = i - teamA.length;
          setAnimatedTeamB((prev) => [...prev, teamB[bIdx]]);
        }
        await delay(intervalMs);
      }

      if (reserves.length > 0) {
        for (let i = 0; i < reserves.length; i++) {
          setAnimatedReserves((prev) => [...prev, reserves[i]]);
          await delay(200);
        }
      }

      // Phase 4: Done! (8s+)
      setDrawingPhase(4);
      setStatus({
        arrived: [],
        totalConfirmed: 0,
        canDraw: false,
        teamsDrawn: true,
        teams,
        aiCoachComment: data.game.aiCoachComment,
        timeUntilDraw: null,
      });

      await delay(1000);
      setPageState('drawn');
    } catch {
      setDrawError('Erro no sorteio');
      setPageState('pre_draw');
    }
  };

  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const formatCountdown = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const isArrived = (userId: string) => {
    return status?.arrived?.some((a) => a.userId === userId) || false;
  };

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="p-4 space-y-4">
        <div className="h-8 bg-zinc-900 rounded animate-pulse w-32" />
        <div className="h-80 glass-card rounded-2xl animate-pulse" />
      </div>
    );
  }

  // DRAWING state - animated
  if (pageState === 'drawing') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Sorteio</h1>
            <p className="text-zinc-500 text-sm mt-0.5">A formar equipas...</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl shadow-lg shadow-black/20 overflow-hidden">
          {/* Drawing animation area */}
          <div className="relative min-h-[400px] flex flex-col">
            {/* Phase indicator */}
            <div className="absolute top-4 left-0 right-0 flex justify-center gap-2 z-10">
              {[0, 1, 2, 3, 4].map((p) => (
                <div
                  key={p}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    drawingPhase >= p ? 'bg-emerald-400 scale-110' : 'bg-zinc-700'
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* Phase 0: GK spinning */}
              {drawingPhase === 0 && (
                <motion.div
                  key="phase0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 flex flex-col items-center justify-center gap-4"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50 flex items-center justify-center"
                  >
                    <span className="text-3xl">🧤</span>
                  </motion.div>
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-white text-lg font-semibold"
                  >
                    A sortear goleiro...
                  </motion.p>
                  <p className="text-zinc-500 text-sm">A bola gira...</p>
                </motion.div>
              )}

              {/* Phase 1: GK assigned to sides */}
              {drawingPhase === 1 && (
                <motion.div
                  key="phase1"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  className="flex-1 flex flex-col items-center justify-center gap-4"
                >
                  <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="flex items-center gap-3"
                  >
                    <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40">
                      <span className="text-emerald-400 font-bold">GR A</span>
                    </div>
                    <span className="text-2xl">⚽</span>
                    <div className="px-4 py-2 rounded-xl bg-teal-500/20 border border-teal-500/40">
                      <span className="text-teal-400 font-bold">GR B</span>
                    </div>
                  </motion.div>
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-white text-lg font-semibold"
                  >
                    Goleiro A vs Goleiro B... A BOLA GIRA!
                  </motion.p>
                </motion.div>
              )}

              {/* Phase 2: waiting for server */}
              {drawingPhase === 2 && (
                <motion.div
                  key="phase2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center gap-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    <span className="text-5xl">🎲</span>
                  </motion.div>
                  <p className="text-white text-lg font-semibold">A sortear jogadores...</p>
                </motion.div>
              )}

              {/* Phase 3: Players flying in */}
              {drawingPhase === 3 && (
                <motion.div
                  key="phase3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex gap-4 p-4 pt-12"
                >
                  {/* Team A column */}
                  <div className="flex-1 flex flex-col gap-2 items-center">
                    <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 mb-2">
                      EQUIPA A
                    </Badge>
                    <AnimatePresence>
                      {animatedTeamA.map((player, i) => (
                        <motion.div
                          key={player.userId}
                          initial={{ x: -80, opacity: 0, scale: 0.5 }}
                          animate={{ x: 0, opacity: 1, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          className="w-full flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-emerald-400">{player.position}</span>
                          </div>
                          <span className="text-white text-sm font-medium flex-1">{player.name}</span>
                          <span className="text-emerald-400 text-xs font-bold">{player.overallRating}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* VS */}
                  <div className="flex items-center justify-center">
                    <motion.span
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-zinc-600 text-xl font-black"
                    >
                      VS
                    </motion.span>
                  </div>

                  {/* Team B column */}
                  <div className="flex-1 flex flex-col gap-2 items-center">
                    <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 mb-2">
                      EQUIPA B
                    </Badge>
                    <AnimatePresence>
                      {animatedTeamB.map((player, i) => (
                        <motion.div
                          key={player.userId}
                          initial={{ x: 80, opacity: 0, scale: 0.5 }}
                          animate={{ x: 0, opacity: 1, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          className="w-full flex items-center gap-2 p-2 rounded-xl bg-teal-500/10 border border-teal-500/30"
                        >
                          <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-teal-400">{player.position}</span>
                          </div>
                          <span className="text-white text-sm font-medium flex-1">{player.name}</span>
                          <span className="text-teal-400 text-xs font-bold">{player.overallRating}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* Phase 4: Done! */}
              {drawingPhase === 4 && (
                <motion.div
                  key="phase4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center gap-3"
                >
                  {/* Confetti particles */}
                  {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: ['#10b981', '#14b8a6', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'][i % 6],
                        left: `${Math.random() * 100}%`,
                        top: '-10px',
                      }}
                      initial={{ y: -10, opacity: 1, scale: 1 }}
                      animate={{
                        y: [0, 300 + Math.random() * 200],
                        x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200],
                        opacity: [1, 1, 0],
                        rotate: [0, 360 + Math.random() * 360],
                      }}
                      transition={{ duration: 2.5, ease: 'easeOut' }}
                    />
                  ))}
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.5, 1] }}
                    transition={{ duration: 0.6 }}
                    className="text-6xl"
                  >
                    🎉
                  </motion.span>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent"
                  >
                    EQUIPAS DEFINIDAS!
                  </motion.h2>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // DRAWN state - final teams
  if (pageState === 'drawn') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Equipas</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Sorteio concluído</p>
          </div>
          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-sm px-3 py-1">
            ✅ Definidas
          </Badge>
        </div>

        {/* Field Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative glass-card rounded-2xl shadow-lg shadow-black/20 overflow-hidden"
        >
          <div className="flex min-h-[380px]">
            {/* Team A */}
            <div className="flex-1 bg-gradient-to-b from-emerald-900/30 to-emerald-950/30 p-4 flex flex-col justify-between relative border-r border-zinc-700/30">
              <div className="text-center mb-2">
                <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-sm">EQUIPA VERDE</Badge>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <AnimatePresence>
                  {animatedTeamA.map((player, i) => (
                    <motion.div
                      key={player.userId}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className="w-14 h-14 rounded-full bg-emerald-500/15 border-2 border-emerald-500/60 flex flex-col items-center justify-center backdrop-blur-sm shadow-lg shadow-emerald-500/10">
                        <span className="text-xs font-bold text-emerald-400">{player.overallRating}</span>
                        <span className="text-[10px] text-emerald-300/70">{player.position}</span>
                      </div>
                      <p className="text-white text-xs font-medium">{player.name.split(' ')[0]}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Team B */}
            <div className="flex-1 bg-gradient-to-b from-teal-900/30 to-teal-950/30 p-4 flex flex-col justify-between relative">
              <div className="text-center mb-2">
                <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 shadow-sm">EQUIPA AZUL</Badge>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <AnimatePresence>
                  {animatedTeamB.map((player, i) => (
                    <motion.div
                      key={player.userId}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className="w-14 h-14 rounded-full bg-teal-500/15 border-2 border-teal-500/60 flex flex-col items-center justify-center backdrop-blur-sm shadow-lg shadow-teal-500/10">
                        <span className="text-xs font-bold text-teal-400">{player.overallRating}</span>
                        <span className="text-[10px] text-teal-300/70">{player.position}</span>
                      </div>
                      <p className="text-white text-xs font-medium">{player.name.split(' ')[0]}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-zinc-600/30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-zinc-600/30" />
        </motion.div>

        {/* Reserves */}
        {animatedReserves.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl shadow-lg shadow-black/20 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-amber-400">🪑</span>
              <h3 className="text-white font-semibold text-sm">Suplentes</h3>
              <Badge variant="outline" className="text-amber-400 border-amber-400/30 text-xs">
                {animatedReserves.length}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {animatedReserves.map((player) => (
                <div
                  key={player.userId}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20"
                >
                  <span className="text-xs font-bold text-amber-400">{player.position}</span>
                  <span className="text-zinc-300 text-sm">{player.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Coach Comment */}
        {status?.aiCoachComment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl shadow-lg shadow-black/20 overflow-hidden"
          >
            <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center shrink-0">
                  <span className="text-sm">🧠</span>
                </div>
                <div>
                  <p className="text-emerald-400 font-semibold text-sm mb-1">Treinador IA</p>
                  <p className="text-zinc-300 text-sm leading-relaxed">{status.aiCoachComment}</p>
                </div>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
          </motion.div>
        )}
      </div>
    );
  }

  // PRE_DRAW state
  const arrivedCount = status?.arrived?.length || 0;
  const totalCount = status?.totalConfirmed || 0;
  const canDraw = status?.canDraw || false;
  const timeUntil = status?.timeUntilDraw;
  const hasArrived = status?.arrived?.some((a) => a.userId === user?.id);
  const isAdmin = user?.role === 'admin' || user?.role === 'master';

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Equipas</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Sorteio das equipas</p>
        </div>
      </div>

      {/* Arrival Status */}
      <div className="glass-card rounded-2xl shadow-lg shadow-black/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📍</span>
            <div>
              <h3 className="text-white font-semibold text-sm">Aguardar Chegada</h3>
              <p className="text-zinc-500 text-xs">
                {arrivedCount} de {totalCount} chegaram
              </p>
            </div>
          </div>
          <div className="text-right">
            {timeUntil && !canDraw ? (
              <div className="text-amber-400 text-sm font-mono font-bold">
                {formatCountdown(timeUntil)}
              </div>
            ) : canDraw ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                Sorteio disponível!
              </Badge>
            ) : (
              <p className="text-zinc-600 text-xs">Aguardando primeiro jogador</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: totalCount > 0 ? `${(arrivedCount / totalCount) * 100}%` : '0%' }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Player list */}
        <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-premium">
          {status?.arrived?.map((p) => (
            <motion.div
              key={p.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-400">{p.position}</span>
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{p.name}</p>
                <p className="text-emerald-400/60 text-xs">Chegou ✓</p>
              </div>
              <span className="text-emerald-400 text-xs font-bold">{p.overallRating}</span>
            </motion.div>
          ))}

          {arrivedCount === 0 && (
            <div className="text-center py-6">
              <span className="text-3xl mb-2 block">🏟️</span>
              <p className="text-zinc-500 text-sm">Ninguém chegou ainda</p>
              <p className="text-zinc-600 text-xs mt-1">Confirma a tua chegada!</p>
            </div>
          )}
        </div>

        {/* Arrive button */}
        {!hasArrived && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <Button
              onClick={handleArrive}
              disabled={arriving || !status}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold py-5 shadow-lg shadow-emerald-500/20 transition-all duration-200"
            >
              {arriving ? '...' : '👋 Cheguei!'}
            </Button>
          </motion.div>
        )}

        {hasArrived && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-emerald-400 text-sm font-medium">✅ Chegada confirmada</p>
          </div>
        )}
      </div>

      {/* Draw button (admin only) */}
      {isAdmin && canDraw && arrivedCount >= 2 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Button
            onClick={handleDraw}
            disabled={drawing}
            className="w-full btn-gradient-animated text-white font-bold py-6 text-lg shadow-xl shadow-emerald-500/30 transition-all duration-200"
          >
            {drawing ? (
              <span className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  🎲
                </motion.span>
                A sortear...
              </span>
            ) : (
              <span className="flex items-center gap-2">🎲 Iniciar Sorteio</span>
            )}
          </Button>
        </motion.div>
      )}

      {isAdmin && !canDraw && arrivedCount >= 1 && timeUntil && (
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-zinc-400 text-sm">
            Sorteio disponível em{' '}
            <span className="text-amber-400 font-mono font-bold">{formatCountdown(timeUntil)}</span>
          </p>
          <p className="text-zinc-600 text-xs mt-1">(10 min após primeiro jogador)</p>
        </div>
      )}

      {drawError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
          <p className="text-rose-400 text-sm">{drawError}</p>
        </div>
      )}

      {/* Rules card */}
      <div className="glass-card rounded-2xl p-4">
        <h3 className="text-zinc-400 font-semibold text-sm mb-2 flex items-center gap-2">
          <span>📋</span> Regras do Sorteio
        </h3>
        <ul className="space-y-1.5 text-zinc-500 text-xs">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">•</span>
            1. Jogadores chegam e confirmam chegada
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">•</span>
            2. Após 10 min do primeiro, o sorteio fica disponível
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">•</span>
            3. Goleiros são sorteados primeiro
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">•</span>
            4. Jogadores distribuídos alternadamente (A, B, A, B...)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">•</span>
            5. 5 jogadores por equipa (1 goleiro + 4 na linha) e 1 suplente por equipa
          </li>
        </ul>
      </div>
    </div>
  );
}
