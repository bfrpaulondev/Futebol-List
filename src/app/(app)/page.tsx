'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RefreshCw, Clock, Users, AlertCircle } from 'lucide-react';

interface Attendee {
  id: string;
  userId: string;
  playerType: string;
  status: string;
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
  confirmationDeadline: string | null;
  teamsJson: string;
  confirmed: Attendee[];
  waiting: Attendee[];
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

  const allAttendees = game
    ? [...(game.confirmed || []), ...(game.waiting || [])]
    : [];

  const isAttending = allAttendees.some((a) => a.userId === user?.id);
  const isConfirmed = game?.confirmed.some((a) => a.userId === user?.id);
  const isWaiting = game?.waiting.some((a) => a.userId === user?.id);
  const vacancies = game ? game.maxPlayers - (game.confirmed?.length || 0) : 0;

  const isMensalista = user?.playerType === 'mensalista';
  const isBeforeDeadline = game?.confirmationDeadline
    ? new Date() < new Date(game.confirmationDeadline)
    : false;
  const isGameFull = vacancies === 0;

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

  const getConfirmLabel = () => {
    if (isAttending) return { text: '❌ Cancelar Presença', color: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20' };
    if (isWaiting) return { text: '⏳ Na Lista de Espera (Clica para sair)', color: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20' };
    if (isGameFull && !isConfirmed) return { text: '🔄 Lista de Espera', color: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20' };
    if (isMensalista && isBeforeDeadline) return { text: '✅ Confirmar com Preferência', color: 'btn-gradient-animated text-white shadow-lg shadow-emerald-500/20' };
    return { text: '📋 Entrar na Lista', color: 'btn-gradient-animated text-white shadow-lg shadow-emerald-500/20' };
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 glass-card rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Jogo da Semana</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Futebol Bonfim</p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchGame} className="text-zinc-500 hover:text-emerald-400 transition-all duration-200 hover:bg-zinc-800/50">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {!game ? (
        <div className="glass-card rounded-2xl shadow-lg shadow-black/20 p-8 text-center">
          <div className="text-5xl mb-3">🏟️</div>
          <p className="text-zinc-300 text-lg font-medium">Nenhum jogo agendado</p>
          <p className="text-zinc-500 text-sm mt-1">Aguarda pelo próximo jogo</p>
        </div>
      ) : (
        <>
          {/* Game Card */}
          <div className="glass-card rounded-2xl shadow-lg shadow-black/20 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                    <span className="text-lg">📅</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold capitalize">{formatDate(game.date)}</p>
                    <p className="text-zinc-400 text-sm">{formatTime(game.date)} • {game.location}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-xs transition-all duration-200 ${
                  vacancies > 0
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}>
                  {vacancies > 0 ? `${vacancies} vaga${vacancies > 1 ? 's' : ''}` : 'Completo'}
                </Badge>
              </div>

              {/* Confirmation Deadline */}
              {game.confirmationDeadline && (
                <div className={`flex items-center gap-2 mt-3 p-2.5 rounded-xl ${isBeforeDeadline ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-amber-500/5 border border-amber-500/10'}`}>
                  <Clock className={`w-3.5 h-3.5 ${isBeforeDeadline ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className={`text-xs font-medium ${isBeforeDeadline ? 'text-emerald-400' : 'text-amber-400'}`}>
                    Prazo mensalistas: {formatDate(game.confirmationDeadline)} às {formatTime(game.confirmationDeadline)}
                  </span>
                </div>
              )}
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-400">Confirmados</span>
                </div>
                <span className="text-white font-bold">{game.confirmed?.length || 0}/{game.maxPlayers}</span>
              </div>
              <div className="w-full bg-zinc-800/80 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-teal-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(((game.confirmed?.length || 0) / game.maxPlayers) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </div>

          {/* Confirm/Cancel Button */}
          <Button
            onClick={isAttending ? handleCancel : handleConfirm}
            disabled={actionLoading}
            className={`w-full py-5 font-semibold text-base transition-all duration-200 shadow-lg ${getConfirmLabel().color}`}
          >
            {actionLoading ? 'A processar...' : getConfirmLabel().text}
          </Button>

          {/* Confirmed Players */}
          <div>
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Confirmados ({game.confirmed?.length || 0})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-premium">
              {(game.confirmed || []).map((attendee, index) => (
                <div
                  key={attendee.id}
                  className="flex items-center gap-3 p-3 glass-card rounded-xl transition-all duration-200 hover:bg-zinc-800/60"
                >
                  <div className="w-7 h-7 flex items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold">
                    {index + 1}
                  </div>
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                      {attendee.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {attendee.user.name}
                      {attendee.userId === user?.id && <span className="text-emerald-400 ml-1 text-xs">(tu)</span>}
                    </p>
                    <p className="text-zinc-500 text-xs">{attendee.user.position} • OVR {attendee.user.overallRating}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${
                    attendee.user.playerType === 'mensalista'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                  }`}>
                    {attendee.user.playerType}
                  </Badge>
                </div>
              ))}
              {(!game.confirmed || game.confirmed.length === 0) && (
                <p className="text-zinc-600 text-center text-sm py-8">Nenhum jogador confirmou ainda</p>
              )}
            </div>
          </div>

          {/* Waiting List */}
          {game.waiting && game.waiting.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-amber-400 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Lista de Espera ({game.waiting.length})
              </h2>
              <div className="space-y-2">
                {game.waiting.map((attendee, index) => (
                  <div
                    key={attendee.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 transition-all duration-200"
                  >
                    <div className="w-7 h-7 flex items-center justify-center rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold">
                      {index + 1}
                    </div>
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs">
                        {attendee.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-300 text-sm font-medium truncate">
                        {attendee.user.name}
                        {attendee.userId === user?.id && <span className="text-amber-400 ml-1 text-xs">(tu)</span>}
                      </p>
                      <p className="text-zinc-600 text-xs">{attendee.user.position}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-500 border-amber-500/20">
                      ⏳ Espera
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
