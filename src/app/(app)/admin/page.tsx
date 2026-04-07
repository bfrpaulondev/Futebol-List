'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Crown, CheckCircle2, XCircle, Bell, Send, Clock, CreditCard, Users, Calendar, MessageSquare, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  playerType: string;
  position: string;
  congregation?: string;
  isActive: boolean;
  overallRating: number;
}

interface SuggestionItem {
  id: string;
  title: string;
  description: string;
  status: string;
  votesJson: string;
  approvalsJson: string;
  votingOpen: boolean;
  createdAt: string;
  createdBy: { id: string; name: string };
}

interface ReceiptItem {
  id: string;
  userId: string;
  month: number;
  year: number;
  amount: number;
  imageData: string;
  status: string;
  reviewNote: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  reviewer?: { id: string; name: string };
}

const MONTHS = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function AdminPage() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Game form
  const [newGameDate, setNewGameDate] = useState('');
  const [newGameLocation, setNewGameLocation] = useState('Pavilhão Municipal de Setúbal');
  const [newGameDeadline, setNewGameDeadline] = useState('');
  const [creatingGame, setCreatingGame] = useState(false);
  const [gameMsg, setGameMsg] = useState('');

  // Notification form
  const [notifUserId, setNotifUserId] = useState('all');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifMsg, setNotifMsg] = useState('');

  // Review
  const [rejectNote, setRejectNote] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, suggestionsRes, receiptsRes] = await Promise.all([
        fetch('/api/users/leaderboard').then(r => r.json()).then(d => d.users || []),
        fetch('/api/finance/suggestions').then(r => r.json()),
        fetch('/api/payments/receipts').then(r => r.json()),
      ]);

      setUsers(usersRes as UserItem[]);
      setSuggestions(suggestionsRes.suggestions || []);
      setReceipts(receiptsRes.receipts || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-calculate deadline (Wednesday 12h before game date)
  const handleGameDateChange = (dateStr: string) => {
    setNewGameDate(dateStr);
    if (!dateStr) {
      setNewGameDeadline('');
      return;
    }
    const gameDate = new Date(dateStr);
    const dayOfWeek = gameDate.getDay();
    let daysBefore = dayOfWeek - 3;
    if (daysBefore <= 0) daysBefore += 7;
    const deadline = new Date(gameDate);
    deadline.setDate(deadline.getDate() - daysBefore);
    deadline.setHours(12, 0, 0, 0);
    const dStr = new Date(deadline.getTime() - deadline.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setNewGameDeadline(dStr);
  };

  const handleCreateGame = async () => {
    if (!newGameDate) return;
    setCreatingGame(true);
    setGameMsg('');
    try {
      const res = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newGameDate,
          location: newGameLocation,
          confirmationDeadline: newGameDeadline || null,
        }),
      });
      if (res.ok) {
        setGameMsg('✅ Jogo criado com sucesso!');
        setNewGameDate('');
        setNewGameDeadline('');
      } else {
        const data = await res.json();
        setGameMsg(data.error || 'Erro ao criar jogo');
      }
    } catch {
      setGameMsg('Erro de ligação');
    } finally {
      setCreatingGame(false);
    }
  };

  const handleApproveSuggestion = async (id: string) => {
    try {
      await fetch(`/api/finance/suggestions/${id}/approve`, { method: 'POST' });
      await fetchData();
    } catch {
      // ignore
    }
  };

  const handleRejectSuggestion = async (id: string) => {
    try {
      await fetch(`/api/finance/suggestions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejeitada' }),
      });
      await fetchData();
    } catch {
      // ignore
    }
  };

  const handleReviewReceipt = async (id: string, status: string, note?: string) => {
    try {
      await fetch(`/api/payments/receipts/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: note || null }),
      });
      setRejectingId(null);
      setRejectNote('');
      await fetchData();
    } catch {
      // ignore
    }
  };

  const handleTogglePlayerType = async (userId: string, currentType: string) => {
    const newType = currentType === 'mensalista' ? 'convidado' : 'mensalista';
    try {
      const res = await fetch(`/api/admin/users/${userId}/player-type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerType: newType }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, playerType: newType } : u))
        );
      }
    } catch {
      // ignore
    }
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    setSendingNotif(true);
    setNotifMsg('');

    try {
      let targets: string[] = [];
      if (notifUserId === 'all') {
        targets = users.map(u => u.id);
      } else {
        targets = [notifUserId];
      }

      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: targets,
          type: 'general',
          title: notifTitle.trim(),
          message: notifMessage.trim(),
        }),
      });

      if (res.ok) {
        setNotifMsg(`✅ Notificação enviada a ${targets.length} utilizador(es)`);
        setNotifTitle('');
        setNotifMessage('');
        setNotifUserId('all');
      } else {
        const data = await res.json();
        setNotifMsg(data.error || 'Erro ao enviar notificações');
      }
    } catch {
      setNotifMsg('Erro ao enviar notificações');
    } finally {
      setSendingNotif(false);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'master')) {
    return (
      <div className="p-4 text-center">
        <p className="text-rose-400">Acesso negado</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 glass-card rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const pendingReceipts = receipts.filter(r => r.status === 'pending');
  const reviewedReceipts = receipts.filter(r => r.status !== 'pending');

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Admin
            {user.role === 'master' && <Crown className="w-4 h-4 text-amber-400" />}
          </h1>
          <p className="text-zinc-500 text-xs truncate">Society Futebol Nº5</p>
        </div>
      </div>

      <Tabs defaultValue="jogos" className="w-full">
        <TabsList className="bg-zinc-900/80 backdrop-blur-sm w-full h-auto p-1 gap-1 rounded-xl border border-zinc-800/50 flex-wrap">
          <TabsTrigger value="jogos" className="flex-1 min-w-[70px] text-[11px] py-2 text-zinc-400 data-[state=active]:text-white data-[state=active]:bg-zinc-800/80 data-[state=active]:shadow-sm rounded-lg transition-all duration-200">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            Jogos
          </TabsTrigger>
          <TabsTrigger value="pagamentos" className="flex-1 min-w-[70px] text-[11px] py-2 text-zinc-400 data-[state=active]:text-white data-[state=active]:bg-zinc-800/80 data-[state=active]:shadow-sm rounded-lg transition-all duration-200">
            <CreditCard className="w-3.5 h-3.5 mr-1" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="sugestoes" className="flex-1 min-w-[70px] text-[11px] py-2 text-zinc-400 data-[state=active]:text-white data-[state=active]:bg-zinc-800/80 data-[state=active]:shadow-sm rounded-lg transition-all duration-200">
            <MessageSquare className="w-3.5 h-3.5 mr-1" />
            Sugestões
          </TabsTrigger>
          <TabsTrigger value="utilizadores" className="flex-1 min-w-[70px] text-[11px] py-2 text-zinc-400 data-[state=active]:text-white data-[state=active]:bg-zinc-800/80 data-[state=active]:shadow-sm rounded-lg transition-all duration-200">
            <Users className="w-3.5 h-3.5 mr-1" />
            Utilizadores
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex-1 min-w-[70px] text-[11px] py-2 text-zinc-400 data-[state=active]:text-white data-[state=active]:bg-zinc-800/80 data-[state=active]:shadow-sm rounded-lg transition-all duration-200">
            <Bell className="w-3.5 h-3.5 mr-1" />
            Notif.
          </TabsTrigger>
        </TabsList>

        {/* ===== JOGOS TAB ===== */}
        <TabsContent value="jogos" className="mt-4 space-y-4">
          <div className="glass-card rounded-2xl shadow-lg shadow-black/10 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Criar Novo Jogo
            </h3>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-zinc-300 text-sm">Data e Hora</Label>
                <Input
                  type="datetime-local"
                  value={newGameDate}
                  onChange={(e) => handleGameDateChange(e.target.value)}
                  className="bg-zinc-800/80 border-zinc-700/50 text-white transition-all duration-200 focus:border-emerald-500/50"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-300 text-sm">Local</Label>
                <Input
                  value={newGameLocation}
                  onChange={(e) => setNewGameLocation(e.target.value)}
                  className="bg-zinc-800/80 border-zinc-700/50 text-white transition-all duration-200 focus:border-emerald-500/50"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-300 text-sm">Prazo de Confirmação (Mensalistas)</Label>
                <Input
                  type="datetime-local"
                  value={newGameDeadline}
                  onChange={(e) => setNewGameDeadline(e.target.value)}
                  className="bg-zinc-800/80 border-zinc-700/50 text-white transition-all duration-200 focus:border-emerald-500/50"
                />
              </div>
              {gameMsg && (
                <p className={`text-sm text-center py-2 rounded-lg ${gameMsg.startsWith('✅') ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                  {gameMsg}
                </p>
              )}
              <Button
                onClick={handleCreateGame}
                disabled={creatingGame || !newGameDate}
                className="w-full btn-gradient-animated text-white transition-all duration-200 shadow-lg shadow-emerald-500/20 font-semibold"
              >
                {creatingGame ? 'A criar...' : 'Criar Jogo'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ===== PAGAMENTOS TAB ===== */}
        <TabsContent value="pagamentos" className="mt-4 space-y-4">
          {pendingReceipts.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pendentes ({pendingReceipts.length})
              </h3>
              <div className="space-y-3">
                {pendingReceipts.map((r) => (
                  <div key={r.id} className="glass-card rounded-2xl shadow-lg shadow-black/10 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                          {r.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{r.user.name}</p>
                        <p className="text-zinc-500 text-xs">{r.user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm font-bold">{r.amount.toFixed(2)}€</p>
                        <p className="text-zinc-500 text-xs">{MONTHS[r.month]} {r.year}</p>
                      </div>
                    </div>
                    <div
                      className="w-full h-40 rounded-xl overflow-hidden mb-3 cursor-pointer"
                      onClick={() => window.open(r.imageData, '_blank')}
                    >
                      <img src={r.imageData} alt="Comprovativo" className="w-full h-full object-cover" />
                    </div>
                    {rejectingId === r.id ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="Motivo da rejeição..."
                          value={rejectNote}
                          onChange={(e) => setRejectNote(e.target.value)}
                          className="bg-zinc-800/80 border-zinc-700/50 text-white text-sm transition-all duration-200 focus:border-rose-500/50"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleReviewReceipt(r.id, 'rejected', rejectNote)}
                            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Confirmar Rejeição
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setRejectingId(null); setRejectNote(''); }}
                            className="text-zinc-400 text-xs"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReviewReceipt(r.id, 'approved')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition-all duration-200"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setRejectingId(r.id)}
                          className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs transition-all duration-200"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {reviewedReceipts.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Recentes
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-premium">
                {reviewedReceipts.slice(0, 10).map((r) => (
                  <div key={r.id} className="glass-card rounded-xl p-3 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="bg-zinc-800 text-zinc-400 text-[10px]">
                            {r.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-white text-xs font-medium truncate">{r.user.name}</p>
                          <p className="text-zinc-500 text-[10px]">{MONTHS[r.month]} {r.year} • {r.amount.toFixed(2)}€</p>
                        </div>
                      </div>
                      {r.status === 'approved' ? (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Aprovado</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-rose-500/10 text-rose-400 border-rose-500/20">Rejeitado</Badge>
                      )}
                    </div>
                    {r.reviewNote && (
                      <p className="text-zinc-500 text-[10px] mt-1.5 ml-9 truncate">{r.reviewNote}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {receipts.length === 0 && (
            <p className="text-zinc-600 text-center text-sm py-8">Sem comprovativos pendentes</p>
          )}
        </TabsContent>

        {/* ===== SUGESTÕES TAB ===== */}
        <TabsContent value="sugestoes" className="mt-4 space-y-3">
          {suggestions.map((s) => {
            const approvals: string[] = JSON.parse(s.approvalsJson || '[]');
            const totalAdmins = 4;
            return (
              <div key={s.id} className="glass-card rounded-xl p-4 transition-all duration-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 pr-2">
                    <p className="text-white text-sm font-medium">{s.title}</p>
                    <p className="text-zinc-500 text-xs">{s.createdBy.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${
                      s.votingOpen
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : s.status === 'rejeitada'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : s.status === 'aprovada'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {s.votingOpen ? 'Votação aberta' : `Aprovações: ${approvals.length}/${totalAdmins}`}
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-zinc-800/80 rounded-full h-1.5 mb-3 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${s.votingOpen ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`}
                    style={{ width: `${(approvals.length / totalAdmins) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApproveSuggestion(s.id)}
                    disabled={approvals.includes(user.id)}
                    className={`text-xs transition-all duration-200 ${
                      approvals.includes(user.id)
                        ? 'text-emerald-400/50 cursor-not-allowed'
                        : 'text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    {approvals.includes(user.id) ? 'Aprovado' : 'Aprovar'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRejectSuggestion(s.id)}
                    className="text-xs text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            );
          })}
          {suggestions.length === 0 && (
            <p className="text-zinc-600 text-center text-sm py-8">Sem sugestões</p>
          )}
        </TabsContent>

        {/* ===== UTILIZADORES TAB ===== */}
        <TabsContent value="utilizadores" className="mt-4 space-y-2">
          {users.map((u) => (
            <div key={u.id} className="glass-card rounded-xl p-3 transition-all duration-200 hover:bg-zinc-800/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                      {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-white text-sm font-medium truncate">{u.name}</p>
                      {(u.role === 'admin' || u.role === 'master') && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </div>
                    <p className="text-zinc-500 text-xs truncate">{u.email}</p>
                    {u.congregation && <p className="text-zinc-600 text-[10px] truncate">⛪ {u.congregation}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePlayerType(u.id, u.playerType)}
                    className="group/badge flex items-center gap-1"
                    title={u.playerType === 'mensalista' ? 'Mudar para Convidado' : 'Mudar para Mensalista'}
                  >
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 cursor-pointer transition-all duration-200 ${
                      u.playerType === 'mensalista'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover/badge:bg-sky-500/10 group-hover/badge:text-sky-400 group-hover/badge:border-sky-500/20'
                        : 'bg-sky-500/10 text-sky-400 border-sky-500/20 group-hover/badge:bg-emerald-500/10 group-hover/badge:text-emerald-400 group-hover/badge:border-emerald-500/20'
                    }`}>
                      {u.playerType}
                      <RefreshCw className="w-2.5 h-2.5 ml-1 opacity-0 group-hover/badge:opacity-100 transition-opacity duration-200" />
                    </Badge>
                  </button>
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-zinc-800/80 text-zinc-400 border-zinc-700/50">
                    {u.position}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ===== NOTIFICAÇÕES TAB ===== */}
        <TabsContent value="notificacoes" className="mt-4 space-y-4">
          <div className="glass-card rounded-2xl shadow-lg shadow-black/10 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              Enviar Notificação
            </h3>
            <div className="space-y-1">
              <Label className="text-zinc-300 text-sm">Destinatário</Label>
              <select
                value={notifUserId}
                onChange={(e) => setNotifUserId(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700/50 text-white rounded-lg px-3 py-2 text-sm transition-all duration-200 focus:border-emerald-500/50 focus:outline-none"
              >
                <option value="all">Todos os utilizadores</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300 text-sm">Título</Label>
              <Input
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Título da notificação"
                className="bg-zinc-800/80 border-zinc-700/50 text-white placeholder:text-zinc-500 transition-all duration-200 focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300 text-sm">Mensagem</Label>
              <Textarea
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                placeholder="Escreve a mensagem..."
                className="bg-zinc-800/80 border-zinc-700/50 text-white placeholder:text-zinc-500 min-h-[80px] transition-all duration-200 focus:border-emerald-500/50"
              />
            </div>
            {notifMsg && (
              <p className={`text-sm text-center py-2 rounded-lg ${notifMsg.startsWith('✅') ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                {notifMsg}
              </p>
            )}
            <Button
              onClick={handleSendNotification}
              disabled={sendingNotif || !notifTitle.trim() || !notifMessage.trim()}
              className="w-full btn-gradient-animated text-white transition-all duration-200 shadow-lg shadow-emerald-500/20 font-semibold"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendingNotif ? 'A enviar...' : 'Enviar Notificação'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
