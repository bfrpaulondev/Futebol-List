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

interface GameData {
  id: string;
  date: string;
  location: string;
  teamsJson: string;
  aiCoachComment: string | null;
  status: string;
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
        <div className="h-64 bg-zinc-900 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Equipas</h1>
        {user?.role === 'admin' && !teams && game && (
          <Button
            onClick={handleDraw}
            disabled={drawing || (game ? game.attendees?.length < 2 : true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
          >
            {drawing ? 'A sortear...' : '🎲 Sortear'}
          </Button>
        )}
      </div>

      {!teams ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-zinc-400 text-lg">Aguardando sorteio</p>
            <p className="text-zinc-500 text-sm mt-2">
              O admin precisa fazer o sorteio das equipas após confirmações
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Field Visualization */}
          <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="flex min-h-[400px]">
              {/* Team A - Green */}
              <div className="flex-1 bg-gradient-to-b from-emerald-900/40 to-emerald-950/40 p-4 flex flex-col justify-between relative border-r border-zinc-700/50">
                <div className="text-center mb-2">
                  <Badge className="bg-emerald-600 text-white">EQUIPA VERDE</Badge>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  {teams.teamA.map((player, i) => (
                    <div key={player.userId} className="flex flex-col items-center gap-1">
                      <div className="w-14 h-14 rounded-full bg-emerald-600/30 border-2 border-emerald-500 flex flex-col items-center justify-center">
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
              <div className="flex-1 bg-gradient-to-b from-teal-900/40 to-teal-950/40 p-4 flex flex-col justify-between relative">
                <div className="text-center mb-2">
                  <Badge className="bg-teal-600 text-white">EQUIPA AZUL</Badge>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  {teams.teamB.map((player, i) => (
                    <div key={player.userId} className="flex flex-col items-center gap-1">
                      <div className="w-14 h-14 rounded-full bg-teal-600/30 border-2 border-teal-500 flex flex-col items-center justify-center">
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
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-zinc-600/50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-zinc-600/50" />
          </div>

          {/* AI Coach Comment */}
          {game?.aiCoachComment && (
            <Card className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border-emerald-800/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🧠</span>
                  <div>
                    <p className="text-emerald-400 font-semibold text-sm mb-1">Treinador IA</p>
                    <p className="text-zinc-300 text-sm leading-relaxed">{game.aiCoachComment}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
