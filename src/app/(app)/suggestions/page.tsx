'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ThumbsUp, Lock, CheckCircle2 } from 'lucide-react';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  estimatedCost: number;
  category: string;
  isPriority: boolean;
  votesJson: string;
  approvalsJson: string;
  votingOpen: boolean;
  status: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export default function SuggestionsPage() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [category, setCategory] = useState('Geral');
  const [priority, setPriority] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/finance/suggestions');
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      await fetch('/api/finance/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          estimatedCost: parseFloat(cost) || 0,
          category,
          isPriority: priority,
        }),
      });
      setTitle('');
      setDescription('');
      setCost('');
      setCategory('Geral');
      setPriority(false);
      await fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (id: string) => {
    try {
      await fetch(`/api/finance/suggestions/${id}/vote`, { method: 'POST' });
      await fetchData();
    } catch {
      // ignore
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  };

  const getStatusBadge = (s: Suggestion) => {
    switch (s.status) {
      case 'aprovada':
        return <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Aprovada</Badge>;
      case 'rejeitada':
        return <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-rose-500/10 text-rose-400 border-rose-500/20">Rejeitada</Badge>;
      case 'em-votação':
        return <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-sky-500/10 text-sky-400 border-sky-500/20">Em Votação</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 border-amber-500/20">Em Análise</Badge>;
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-200">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sugestões</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Ideias para o clube</p>
        </div>
      </div>

      {/* Create Suggestion Form */}
      <div className="glass-card rounded-2xl shadow-lg shadow-black/20 p-4">
        <h2 className="text-base font-semibold text-white mb-3">Nova Sugestão</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-zinc-300 text-sm">Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Novas bolas de futsal"
              className="bg-zinc-800/80 border-zinc-700/50 text-white placeholder:text-zinc-500 transition-all duration-200 focus:border-emerald-500/50 focus:ring-emerald-500/20"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-zinc-300 text-sm">Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreve a sugestão..."
              className="bg-zinc-800/80 border-zinc-700/50 text-white placeholder:text-zinc-500 min-h-[80px] transition-all duration-200 focus:border-emerald-500/50 focus:ring-emerald-500/20"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-zinc-300 text-sm">Custo Estimado (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
                className="bg-zinc-800/80 border-zinc-700/50 text-white placeholder:text-zinc-500 transition-all duration-200 focus:border-emerald-500/50 focus:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300 text-sm">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-zinc-800/80 border-zinc-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="Geral" className="text-white">Geral</SelectItem>
                  <SelectItem value="Equipamento" className="text-white">Equipamento</SelectItem>
                  <SelectItem value="Instalações" className="text-white">Instalações</SelectItem>
                  <SelectItem value="Eventos" className="text-white">Eventos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={priority}
              onCheckedChange={(checked) => setPriority(checked === true)}
              className="border-zinc-600"
            />
            <Label className="text-zinc-300 text-sm">Prioritário</Label>
          </div>
          <Button
            type="submit"
            disabled={submitting || !title.trim() || !description.trim()}
            className="w-full btn-gradient-animated text-white transition-all duration-200 shadow-lg shadow-emerald-500/20"
          >
            {submitting ? 'A submeter...' : 'Submeter Sugestão'}
          </Button>
        </form>
      </div>

      {/* Suggestions List */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3">Sugestões Recentes</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-premium">
          {suggestions.map((s) => {
            const votes: string[] = JSON.parse(s.votesJson || '[]');
            const approvals: string[] = JSON.parse(s.approvalsJson || '[]');
            const totalAdmins = 4;
            const approvalProgress = (approvals.length / totalAdmins) * 100;

            return (
              <div key={s.id} className="glass-card rounded-2xl shadow-lg shadow-black/10 p-4 transition-all duration-200 hover:bg-zinc-800/60">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-semibold text-sm pr-2">{s.title}</h3>
                  {getStatusBadge(s)}
                </div>
                <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{s.description}</p>

                {/* Approval Progress */}
                {s.status === 'em-analise' || s.status === 'em-votação' ? (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-500">
                        {s.votingOpen ? (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Votação aberta
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            A aguardar aprovação dos admins
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-zinc-500">{approvals.length}/{totalAdmins} admins</span>
                    </div>
                    <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${s.votingOpen ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`}
                        style={{ width: `${approvalProgress}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-xs">{s.createdBy.name}</span>
                    <span className="text-zinc-700 text-xs">•</span>
                    <span className="text-zinc-500 text-xs">{formatDate(s.createdAt)}</span>
                    {s.estimatedCost > 0 && (
                      <>
                        <span className="text-zinc-700 text-xs">•</span>
                        <span className="text-zinc-400 text-xs">{s.estimatedCost.toFixed(2)}€</span>
                      </>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(s.id)}
                    disabled={!s.votingOpen}
                    className={`transition-all duration-200 ${s.votingOpen ? 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300' : 'text-zinc-600 cursor-not-allowed'}`}
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">{votes.length}</span>
                  </Button>
                </div>
              </div>
            );
          })}
          {suggestions.length === 0 && !loading && (
            <p className="text-zinc-600 text-center text-sm py-8">Sem sugestões ainda</p>
          )}
        </div>
      </div>
    </div>
  );
}
