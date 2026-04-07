'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Save,
  BookOpen,
  Star,
  ShieldX,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Target,
  HandMetal,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Game {
  id: string;
  scheduledAt: string;
  playedAt: string | null;
  teamsJson: string | null;
  status: string;
}

interface Attendee {
  id: string;
  userId: string;
  name: string;
  status: string;
}

interface PlayerStats {
  userId: string;
  goals: number;
  assists: number;
  ownGoals: number;
  team: 'A' | 'B';
  isMVP: boolean;
}

interface GameStatsData {
  stats: PlayerStats[];
  mvpId: string | null;
  chronicleId: string | null;
}

export default function GameStatsPage() {
  const { user } = useAuthStore();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [stats, setStats] = useState<Record<string, PlayerStats>>({});
  const [mvpId, setMvpId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [existingData, setExistingData] = useState<GameStatsData | null>(null);
  const [chronicleId, setChronicleId] = useState<string | null>(null);
  const [teamsJson, setTeamsJson] = useState<{ teamA: string[]; teamB: string[] } | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'master';

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/games');
      if (res.ok) {
        const data = await res.json();
        const pastGames = (data.games || []).filter(
          (g: Game) => g.status === 'played' || g.status === 'completed'
        );
        setGames(pastGames);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleSelectGame = async (gameId: string) => {
    setSelectedGameId(gameId);
    setStats({});
    setMvpId(null);
    setExistingData(null);
    setChronicleId(null);
    setTeamsJson(null);

    if (!gameId) return;

    try {
      const [gameRes, statsRes] = await Promise.all([
        fetch(`/api/games/${gameId}`),
        fetch(`/api/games/${gameId}/stats`),
      ]);

      if (gameRes.ok) {
        const gameData = await gameRes.json();
        const confirmed = (gameData.attendees || []).filter((a: Attendee) => a.status === 'confirmed');
        setAttendees(confirmed);
        if (gameData.game?.teamsJson) {
          try {
            setTeamsJson(JSON.parse(gameData.game.teamsJson));
          } catch {
            // ignore
          }
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.stats && statsData.stats.length > 0) {
          const statsMap: Record<string, PlayerStats> = {};
          statsData.stats.forEach((s: PlayerStats) => {
            statsMap[s.userId] = s;
          });
          setStats(statsMap);
          setMvpId(statsData.mvpId || null);
          setExistingData(statsData);
          setChronicleId(statsData.chronicleId || null);
        }
      }
    } catch {
      // ignore
    }
  };

  const updateStat = (userId: string, field: keyof PlayerStats, value: number | boolean) => {
    setStats(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        userId,
        goals: prev[userId]?.goals || 0,
        assists: prev[userId]?.assists || 0,
        ownGoals: prev[userId]?.ownGoals || 0,
        team: prev[userId]?.team || 'A',
        isMVP: prev[userId]?.isMVP || false,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedGameId || !mvpId) {
      toast.error('Seleciona um MVP antes de guardar!');
      return;
    }
    setSaving(true);
    try {
      const statsArray = Object.values(stats).map(s => ({
        ...s,
        isMVP: s.userId === mvpId,
      }));

      const res = await fetch(`/api/games/${selectedGameId}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats: statsArray, mvpId }),
      });

      if (res.ok) {
        toast.success('Estatísticas guardadas com sucesso!');
        setExistingData({ stats: statsArray, mvpId, chronicleId });
      } else {
        toast.error('Erro ao guardar estatísticas');
      }
    } catch {
      toast.error('Erro de ligação');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateChronicle = async () => {
    if (!selectedGameId) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/games/${selectedGameId}/chronicle`, {
        method: 'POST',
      });
      if (res.ok) {
        toast.success('Crónica gerada por Palestrinha! 📝');
        setChronicleId('generated');
      } else {
        toast.error('Erro ao gerar crónica');
      }
    } catch {
      toast.error('Erro de ligação');
    } finally {
      setGenerating(false);
    }
  };

  const getTeam = (userId: string): 'A' | 'B' => {
    if (teamsJson) {
      if (teamsJson.teamA?.includes(userId)) return 'A';
      if (teamsJson.teamB?.includes(userId)) return 'B';
    }
    return stats[userId]?.team || 'A';
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2);

  const selectedGame = games.find(g => g.id === selectedGameId);

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
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">📊 Estatísticas do Jogo</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Regista os números do relvado</p>
      </div>

      {/* Access Denied for non-admins */}
      {!isAdmin && (
        <div className="glass-card rounded-2xl p-6 text-center">
          <ShieldX className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-1">Acesso Restrito</h2>
          <p className="text-zinc-400 text-sm">Apenas admins podem registar estatísticas.</p>
        </div>
      )}

      {/* Game Selector */}
      {isAdmin && (
        <>
          <div className="glass-card rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              Selecionar Jogo
            </h2>
            <Select value={selectedGameId} onValueChange={handleSelectGame}>
              <SelectTrigger className="bg-zinc-800/80 border-zinc-700/50 text-white">
                <SelectValue placeholder="Escolhe um jogo..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                {games.map((game) => (
                  <SelectItem key={game.id} value={game.id} className="text-white">
                    {new Date(game.scheduledAt).toLocaleDateString('pt-PT', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                    {!game.playedAt && ' (Não realizado)'}
                  </SelectItem>
                ))}
                {games.length === 0 && (
                  <SelectItem value="none" disabled className="text-zinc-500">
                    Sem jogos disponíveis
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Not Played Warning */}
          {selectedGame && !selectedGame.playedAt && (
            <div className="glass-card rounded-2xl p-4 bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-sm font-medium">Jogo Ainda Não Realizado</span>
              </div>
              <p className="text-zinc-400 text-xs mt-1">
                Este jogo ainda não foi marcado como realizado. Podes registar estatísticas mesmo assim.
              </p>
            </div>
          )}

          {/* Stats Entry */}
          {selectedGameId && attendees.length > 0 && (
            <div className="space-y-3">
              {/* Team A */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-emerald-400 text-xs font-bold">A</span>
                  </div>
                  <span className="text-sm font-semibold text-zinc-300">Equipa A</span>
                  <Badge variant="outline" className="text-[10px] px-2 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    {attendees.filter(a => getTeam(a.userId) === 'A').length} jogadores
                  </Badge>
                </div>
                <div className="space-y-2">
                  {attendees.filter(a => getTeam(a.userId) === 'A').map((attendee) => (
                    <StatRow
                      key={attendee.userId}
                      attendee={attendee}
                      stat={stats[attendee.userId]}
                      isAdmin={isAdmin}
                      onUpdateStat={(field, value) => updateStat(attendee.userId, field, value as number | boolean)}
                      isMVP={mvpId === attendee.userId}
                      onSetMVP={() => setMvpId(mvpId === attendee.userId ? null : attendee.userId)}
                      getInitials={getInitials}
                    />
                  ))}
                </div>
              </div>

              {/* Team B */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center">
                    <span className="text-sky-400 text-xs font-bold">B</span>
                  </div>
                  <span className="text-sm font-semibold text-zinc-300">Equipa B</span>
                  <Badge variant="outline" className="text-[10px] px-2 py-0 bg-sky-500/10 text-sky-400 border-sky-500/20">
                    {attendees.filter(a => getTeam(a.userId) === 'B').length} jogadores
                  </Badge>
                </div>
                <div className="space-y-2">
                  {attendees.filter(a => getTeam(a.userId) === 'B').map((attendee) => (
                    <StatRow
                      key={attendee.userId}
                      attendee={attendee}
                      stat={stats[attendee.userId]}
                      isAdmin={isAdmin}
                      onUpdateStat={(field, value) => updateStat(attendee.userId, field, value as number | boolean)}
                      isMVP={mvpId === attendee.userId}
                      onSetMVP={() => setMvpId(mvpId === attendee.userId ? null : attendee.userId)}
                      getInitials={getInitials}
                    />
                  ))}
                </div>
              </div>

              {/* No attendees */}
              {attendees.length === 0 && (
                <div className="glass-card rounded-2xl p-6 text-center">
                  <Users className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                  <p className="text-zinc-400 text-sm">Sem jogadores confirmados neste jogo</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {selectedGameId && attendees.length > 0 && (
            <div className="space-y-2">
              <Button
                onClick={handleSave}
                disabled={saving || !mvpId}
                className="w-full btn-gradient-animated text-white transition-all duration-200 shadow-lg shadow-emerald-500/20"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    A guardar...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Guardar Estatísticas
                  </span>
                )}
              </Button>

              {existingData && (
                <Button
                  onClick={handleGenerateChronicle}
                  disabled={generating || !!chronicleId}
                  variant="outline"
                  className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200"
                >
                  {generating ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                      Palestrinha está a escrever...
                    </span>
                  ) : chronicleId ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Crónica Gerada ✓
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Gerar Crónica Automática
                    </span>
                  )}
                </Button>
              )}

              {!mvpId && attendees.length > 0 && (
                <p className="text-center text-amber-400 text-xs flex items-center justify-center gap-1">
                  <Star className="w-3 h-3" />
                  Seleciona um MVP antes de guardar
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatRow({
  attendee,
  stat,
  isAdmin,
  onUpdateStat,
  isMVP,
  onSetMVP,
  getInitials,
}: {
  attendee: Attendee;
  stat: PlayerStats | undefined;
  isAdmin: boolean;
  onUpdateStat: (field: keyof PlayerStats, value: number | boolean) => void;
  isMVP: boolean;
  onSetMVP: () => void;
  getInitials: (name: string) => string;
}) {
  return (
    <div className={`glass-card rounded-xl p-3 transition-all duration-200 ${isMVP ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="w-8 h-8">
          <AvatarFallback className={`bg-zinc-800 text-zinc-300 text-xs ${isMVP ? 'ring-1 ring-amber-500/40' : ''}`}>
            {getInitials(attendee.name)}
          </AvatarFallback>
        </Avatar>
        <span className="text-white text-sm font-medium flex-1 truncate">{attendee.name}</span>
        {isAdmin && (
          <button
            onClick={onSetMVP}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all duration-200 border ${
              isMVP
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50 hover:text-zinc-300'
            }`}
          >
            <Star className={`w-3 h-3 ${isMVP ? 'fill-amber-400' : ''}`} />
            MVP
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1">
          <Target className="w-3 h-3 text-emerald-400" />
          <span className="text-zinc-500 text-[10px]">Golos</span>
          {isAdmin ? (
            <button
              onClick={() => {
                const current = stat?.goals || 0;
                onUpdateStat('goals', current >= 10 ? 0 : current + 1);
              }}
              className="w-6 h-6 rounded bg-zinc-800/80 border border-zinc-700/50 text-white text-xs font-bold flex items-center justify-center hover:border-emerald-500/30 transition-all"
            >
              {stat?.goals || 0}
            </button>
          ) : (
            <span className="text-white text-xs font-bold">{stat?.goals || 0}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-1">
          <HandMetal className="w-3 h-3 text-sky-400" />
          <span className="text-zinc-500 text-[10px]">Assist.</span>
          {isAdmin ? (
            <button
              onClick={() => {
                const current = stat?.assists || 0;
                onUpdateStat('assists', current >= 10 ? 0 : current + 1);
              }}
              className="w-6 h-6 rounded bg-zinc-800/80 border border-zinc-700/50 text-white text-xs font-bold flex items-center justify-center hover:border-sky-500/30 transition-all"
            >
              {stat?.assists || 0}
            </button>
          ) : (
            <span className="text-white text-xs font-bold">{stat?.assists || 0}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-1">
          <XCircle className="w-3 h-3 text-rose-400" />
          <span className="text-zinc-500 text-[10px]">A.G.</span>
          {isAdmin ? (
            <button
              onClick={() => {
                const current = stat?.ownGoals || 0;
                onUpdateStat('ownGoals', current >= 5 ? 0 : current + 1);
              }}
              className="w-6 h-6 rounded bg-zinc-800/80 border border-zinc-700/50 text-white text-xs font-bold flex items-center justify-center hover:border-rose-500/30 transition-all"
            >
              {stat?.ownGoals || 0}
            </button>
          ) : (
            <span className="text-white text-xs font-bold">{stat?.ownGoals || 0}</span>
          )}
        </div>
      </div>
    </div>
  );
}
