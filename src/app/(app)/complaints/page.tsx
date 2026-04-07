'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Send, AlertTriangle, MessageSquare, Clock, Swords, Volume2, Timer, HelpCircle, Trophy, Target } from 'lucide-react';
import { toast } from 'sonner';

interface Complaint {
  id: string;
  complainantId: string;
  complainantName: string;
  againstId: string;
  againstName: string;
  category: string;
  description: string;
  palestrinhaReply: string | null;
  createdAt: string;
}

interface Player {
  id: string;
  name: string;
}

const CATEGORIES = [
  { value: 'agressao', label: 'Agressão', icon: Swords, color: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
  { value: 'faltas', label: 'Faltas', icon: AlertTriangle, color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  { value: 'palavras', label: 'Palavras', icon: Volume2, color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  { value: 'atraso', label: 'Atraso', icon: Timer, color: 'bg-sky-500/15 text-sky-400 border-sky-500/20' },
  { value: 'outro', label: 'Outro', icon: HelpCircle, color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' },
];

export default function ComplaintsPage() {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAgainst, setSelectedAgainst] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [lastReply, setLastReply] = useState<{ text: string; complaint: Complaint } | null>(null);
  const [rankings, setRankings] = useState<{ mostComplained: Player[]; mostQuereloso: Player[] }>({ mostComplained: [], mostQuereloso: [] });

  const fetchData = useCallback(async () => {
    try {
      const [complaintsRes, playersRes] = await Promise.all([
        fetch('/api/complaints'),
        fetch('/api/complaints/players'),
      ]);
      if (complaintsRes.ok) {
        const cData = await complaintsRes.json();
        setComplaints(cData.complaints || []);
        setRankings(cData.rankings || { mostComplained: [], mostQuereloso: [] });
      }
      if (playersRes.ok) {
        const pData = await playersRes.json();
        setPlayers((pData.players || []).filter((p: Player) => p.id !== user?.id));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!selectedAgainst || !category || !description.trim()) {
      toast.error('Preenche todos os campos!');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ againstId: selectedAgainst, category, description: description.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setLastReply({ text: data.palestrinhaReply, complaint: data.complaint });
        setSelectedAgainst('');
        setCategory('');
        setDescription('');
        fetchData();
        toast.success('Queixa registada! Palestrinha já está a analisar...');
      }
    } catch {
      toast.error('Erro ao enviar queixa');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryInfo = (cat: string) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[4];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2);

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
        <h1 className="text-2xl font-bold text-white tracking-tight">📋 Bureau de Queixas</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Palestrinha investiga tudo... 🕵️</p>
      </div>

      {/* Palestrinha Comment */}
      <div className="glass-card rounded-2xl p-4 bg-gradient-to-r from-purple-500/5 to-rose-500/5">
        <div className="flex items-start gap-3">
          <div className="text-2xl shrink-0">🎭</div>
          <div>
            <p className="text-sm text-zinc-300 italic leading-relaxed">
              &quot;Aqui no Bureau de Queixas, a justiça é servida com uma pitada de humor. Tens algo a reclamar? Vai à frente, mas cuidado — Palestrinha não tem filtro!&quot;
            </p>
          </div>
        </div>
      </div>

      {/* Submit Form */}
      <div className="glass-card rounded-2xl shadow-lg shadow-black/20 p-4">
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          Nova Queixa
        </h2>
        <div className="space-y-3">
          <Select value={selectedAgainst} onValueChange={setSelectedAgainst}>
            <SelectTrigger className="bg-zinc-800/80 border-zinc-700/50 text-white">
              <SelectValue placeholder="Contra quem?" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              {players.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-white">{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div>
            <p className="text-zinc-400 text-xs mb-2">Categoria:</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value === category ? '' : cat.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                      category === cat.value
                        ? cat.color
                        : 'bg-zinc-800/80 text-zinc-500 border-zinc-700/50 hover:border-zinc-600'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreve o que aconteceu... (sê detalhado, Palestrinha adora drama!)"
            className="bg-zinc-800/80 border-zinc-700/50 text-white placeholder:text-zinc-600 min-h-[80px] resize-none transition-all duration-200 focus:border-emerald-500/50 focus:ring-emerald-500/20"
          />

          <Button
            onClick={handleSubmit}
            disabled={submitting || !selectedAgainst || !category || !description.trim()}
            className="w-full btn-gradient-animated text-white transition-all duration-200 shadow-lg shadow-emerald-500/20"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Palestrinha está a pensar...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Enviar Queixa
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Palestrinha's Response */}
      <AnimatePresence>
        {lastReply && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25 }}
            className="glass-card rounded-2xl p-4 gradient-border-emerald overflow-hidden"
          >
            <div className="bg-zinc-900 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🎭</span>
                <span className="text-sm font-semibold text-emerald-400">Resposta de Palestrinha</span>
              </div>
              <p className="text-zinc-300 text-sm italic leading-relaxed">
                &quot;{lastReply.text}&quot;
              </p>
              <p className="text-zinc-600 text-xs mt-2">
                Sobre a queixa de {lastReply.complaint.againstName}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complaints List */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-zinc-400" />
          Queixas Recentes
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-zinc-800/80 text-zinc-400 border-zinc-700/50">
            {complaints.length}
          </Badge>
        </h2>
        <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-premium">
          <AnimatePresence>
            {complaints.map((c) => {
              const catInfo = getCategoryInfo(c.category);
              const CatIcon = catInfo.icon;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-xl p-3 transition-all duration-200 hover:bg-zinc-800/60"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                        {getInitials(c.complainantName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-sm font-medium">{c.complainantName}</span>
                        <span className="text-zinc-600 text-xs">→</span>
                        <span className="text-zinc-300 text-sm">{c.againstName}</span>
                        <Badge variant="outline" className={`text-[10px] px-2 py-0 ${catInfo.color}`}>
                          <CatIcon className="w-3 h-3 mr-1" />
                          {catInfo.label}
                        </Badge>
                      </div>
                      <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{c.description}</p>
                      {c.palestrinhaReply && (
                        <div className="mt-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2">
                          <p className="text-zinc-300 text-xs italic">
                            🎭 &quot;{c.palestrinhaReply}&quot;
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock className="w-3 h-3 text-zinc-600" />
                        <span className="text-zinc-600 text-[10px]">{formatDate(c.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {complaints.length === 0 && (
            <div className="text-center py-8">
              <p className="text-zinc-600 text-2xl mb-2">🤫</p>
              <p className="text-zinc-500 text-sm">Sem queixas! Todos os anjos por aqui...</p>
            </div>
          )}
        </div>
      </div>

      {/* Rankings */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          📊 Rankings da Polémica
        </h2>

        {/* Most Complained */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-rose-400" />
            <span className="text-sm font-semibold text-zinc-300">Jogador Mais Reclamado</span>
          </div>
          <div className="space-y-2">
            {rankings.mostComplained.slice(0, 3).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/30">
                <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                  i === 0 ? 'bg-rose-500/15 text-rose-400' : i === 1 ? 'bg-amber-500/15 text-amber-400' : 'bg-zinc-700/50 text-zinc-400'
                }`}>
                  {i + 1}
                </div>
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-zinc-800 text-zinc-300 text-[10px]">{getInitials(p.name)}</AvatarFallback>
                </Avatar>
                <span className="text-white text-sm flex-1">{p.name}</span>
                <Badge variant="outline" className="text-[10px] px-2 py-0 bg-rose-500/10 text-rose-400 border-rose-500/20">
                  😈 Polémico
                </Badge>
              </div>
            ))}
            {rankings.mostComplained.length === 0 && (
              <p className="text-zinc-600 text-xs text-center py-2">Nenhum jogador foi alvo de queixas</p>
            )}
          </div>
        </div>

        {/* Most Quereloso */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-zinc-300">Jogador Mais Quereloso</span>
          </div>
          <div className="space-y-2">
            {rankings.mostQuereloso.slice(0, 3).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/30">
                <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                  i === 0 ? 'bg-amber-500/15 text-amber-400' : i === 1 ? 'bg-zinc-500/15 text-zinc-300' : 'bg-zinc-700/50 text-zinc-400'
                }`}>
                  {i + 1}
                </div>
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-zinc-800 text-zinc-300 text-[10px]">{getInitials(p.name)}</AvatarFallback>
                </Avatar>
                <span className="text-white text-sm flex-1">{p.name}</span>
                <Badge variant="outline" className="text-[10px] px-2 py-0 bg-amber-500/10 text-amber-400 border-amber-500/20">
                  📢 Reclamador
                </Badge>
              </div>
            ))}
            {rankings.mostQuereloso.length === 0 && (
              <p className="text-zinc-600 text-xs text-center py-2">Nenhum jogador registou queixas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
