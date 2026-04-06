'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TeamPlayer {
  userId: string;
  name: string;
  position: string;
  overallRating: number;
  playerType: string;
  avatar: string | null;
}

interface Attendee {
  id: string;
  userId: string;
  status: string;
}

interface GameData {
  id: string;
  date: string;
  location: string;
  teamsJson: string;
  aiCoachComment: string | null;
  status: string;
  confirmed: Attendee[];
  waiting: Attendee[];
}

export default function TeamsPage() {
  const { user } = useAuthStore();
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [teams, setTeams] = useState<{ teamA: TeamPlayer[]; teamB: TeamPlayer[] } | null>(null);

  const fetchGame = useCallback(async () => {
    try {
      const res = await fetch('/api/games/next');
      const data = await res.json();
      if (data.game) {
        setGame(data.game);
        const parsed = JSON.parse(data.game.teamsJson || '{}');
        if (parsed.teamA && parsed.teamB) {
          setTeams(parsed);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  const handleDraw = async () => {
    if (!game) return;
    setDrawing(true);
    try {
      const res = await fetch(`/api/games/${game.id}/draw`, { method: 'POST' });
      const data = await res.json();
      if (data.game) {
        setGame(data.game);
        setTeams(JSON.parse(data.game.teamsJson));
      }
    } finally {
      setDrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-8 bg-zinc-900 rounded animate-pulse w-32" />
        <div className="h-80 glass-card rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Equipas</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Sorteio das equipas</p>
        </div>
        {user?.role === 'admin' && !teams && game && (
          <Button
            onClick={handleDraw}
            disabled={drawing || (game ? (game.confirmed?.length || 0) < 2 : true)}
            className="btn-gradient-animated text-white transition-all duration-200 shadow-lg shadow-emerald-500/20"
          >
            {drawing ? 'A sortear...' : '🎲 Sortear'}
          </Button>
        )}
      </div>

      {!teams ? (
        <div className="glass-card rounded-2xl shadow-lg shadow-black/20 p-8 text-center">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-zinc-300 text-lg font-medium">Aguardando sorteio</p>
          <p className="text-zinc-500 text-sm mt-2">
            O admin precisa fazer o sorteio das equipas após confirmações
          </p>
        </div>
      ) : (
        <>
          {/* Field Visualization */}
          <div className="relative glass-card rounded-2xl shadow-lg shadow-black/20 overflow-hidden">
            <div className="flex min-h-[420px]">
              {/* Team A - Green */}
              <div className="flex-1 bg-gradient-to-b from-emerald-900/30 to-emerald-950/30 p-4 flex flex-col justify-between relative border-r border-zinc-700/30">
                <div className="text-center mb-2">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-sm">EQUIPA VERDE</Badge>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  {teams.teamA.map((player) => (
                    <div key={player.userId} className="flex flex-col items-center gap-1.5">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/15 border-2 border-emerald-500/60 flex flex-col items-center justify-center backdrop-blur-sm shadow-lg shadow-emerald-500/10">
                        <span className="text-xs font-bold text-emerald-400">{player.overallRating}</span>
                        <span className="text-[10px] text-emerald-300/70">{player.position}</span>
                      </div>
                      <div className="text-center">
                        <p className="text-white text-xs font-medium">{player.name.split(' ')[0]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team B - Teal */}
              <div className="flex-1 bg-gradient-to-b from-teal-900/30 to-teal-950/30 p-4 flex flex-col justify-between relative">
                <div className="text-center mb-2">
                  <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 shadow-sm">EQUIPA AZUL</Badge>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  {teams.teamB.map((player) => (
                    <div key={player.userId} className="flex flex-col items-center gap-1.5">
                      <div className="w-14 h-14 rounded-full bg-teal-500/15 border-2 border-teal-500/60 flex flex-col items-center justify-center backdrop-blur-sm shadow-lg shadow-teal-500/10">
                        <span className="text-xs font-bold text-teal-400">{player.overallRating}</span>
                        <span className="text-[10px] text-teal-300/70">{player.position}</span>
                      </div>
                      <div className="text-center">
                        <p className="text-white text-xs font-medium">{player.name.split(' ')[0]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Center line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-zinc-600/30" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-zinc-600/30" />
          </div>

          {/* AI Coach Comment */}
          {game?.aiCoachComment && (
            <div className="glass-card rounded-2xl shadow-lg shadow-black/20 overflow-hidden">
              <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center shrink-0">
                    <span className="text-sm">🧠</span>
                  </div>
                  <div>
                    <p className="text-emerald-400 font-semibold text-sm mb-1">Treinador IA</p>
                    <p className="text-zinc-300 text-sm leading-relaxed">{game.aiCoachComment}</p>
                  </div>
                </div>
              </CardContent>
              <div className="h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
