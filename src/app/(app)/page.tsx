'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Attendee {
  id: string;
  userId: string;
  playerType: string;
  confirmedAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    playerType: string;
    position: string;
    overallRating: number;
  };
}

interface Game {
  id: string;
  date: string;
  location: string;
  maxPlayers: number;
  status: string;
  teamsJson: string;
  attendees: Attendee[];
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchGame = useCallback(async () => {
    try {
      const res = await fetch('/api/games/next');
      const data = await res.json();
      setGame(data.game);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  const isAttending = game?.attendees.some((a) => a.userId === user?.id);

  const handleConfirm = async () => {
    if (!game) return;
    setActionLoading(true);
    try {
      await fetch(`/api/games/${game.id}/confirm`, { method: 'POST' });
      await fetchGame();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!game) return;
    setActionLoading(true);
    try {
      await fetch(`/api/games/${game.id}/cancel`, { method: 'POST' });
      await fetchGame();
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  };

  const formatConfirmTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  };

  const getPlayerTypeColor = (type: string) => {
    switch (type) {
      case 'mensalista': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'grupo': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'externo': return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const vacancies = game ? game.maxPlayers - game.attendees.length : 0;

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-zinc-900 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Jogo da Semana</h1>
        <Button variant="ghost" size="sm" onClick={fetchGame} className="text-zinc-400 hover:text-white">
          ↻ Atualizar
        </Button>
      </div>

      {!game ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-3">🏟️</div>
            <p className="text-zinc-400 text-lg">Nenhum jogo agendado</p>
            <p className="text-zinc-500 text-sm mt-1">Aguarda pelo próximo jogo</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Game Card */}
          <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📅</span>
                  <div>
                    <p className="text-white font-semibold capitalize">{formatDate(game.date)}</p>
                    <p className="text-zinc-400 text-sm">{formatTime(game.date)} • {game.location}</p>
                  </div>
                </div>
                <Badge variant="outline" className={vacancies > 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                  {vacancies > 0 ? `${vacancies} vaga${vacancies > 1 ? 's' : ''}` : 'Completo'}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Confirmados</span>
                <span className="text-white font-medium">{game.attendees.length}/{game.maxPlayers}</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all"
                  style={{ width: `${(game.attendees.length / game.maxPlayers) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Confirm/Cancel Button */}
          <Button
            onClick={isAttending ? handleCancel : handleConfirm}
            disabled={actionLoading || vacancies === 0}
            className={`w-full py-5 font-semibold text-base ${
              isAttending
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
            }`}
          >
            {actionLoading
              ? 'A processar...'
              : isAttending
                ? '❌ Cancelar Presença'
                : vacancies === 0
                  ? 'Jogo Completo'
                  : '✅ Confirmar Presença'}
          </Button>

          {/* Attendees List */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Jogadores ({game.attendees.length})</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {game.attendees.map((attendee, index) => (
                <div
                  key={attendee.id}
                  className="flex items-center gap-3 p-3 bg-zinc-900 rounded-xl border border-zinc-800"
                >
                  <div className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 text-sm font-bold">
                    {index + 1}
                  </div>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                      {attendee.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {attendee.user.name}
                      {attendee.userId === user?.id && <span className="text-teal-400 ml-1">(tu)</span>}
                    </p>
                    <p className="text-zinc-500 text-xs">{attendee.user.position}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${getPlayerTypeColor(attendee.user.playerType)}`}>
                      {attendee.user.playerType}
                    </Badge>
                    <span className="text-zinc-500 text-xs">{formatConfirmTime(attendee.confirmedAt)}</span>
                  </div>
                </div>
              ))}
              {game.attendees.length === 0 && (
                <p className="text-zinc-500 text-center text-sm py-6">Nenhum jogador confirmou ainda</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
