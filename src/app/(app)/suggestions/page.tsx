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
import { ArrowLeft, ThumbsUp } from 'lucide-react';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  estimatedCost: number;
  category: string;
  isPriority: boolean;
  votesJson: string;
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

  // Form
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovada': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'rejeitada': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-white">Sugestões</h1>
      </div>

      {/* Create Suggestion Form */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold text-white mb-3">Nova Sugestão</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-zinc-300 text-sm">Título</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Novas bolas de futsal"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300 text-sm">Descrição</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreve a sugestão..."
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[80px]"
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
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-300 text-sm">Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
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
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
            >
              {submitting ? 'A submeter...' : 'Submeter Sugestão'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Suggestions List */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Sugestões Recentes</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {suggestions.map((s) => {
            const votes: string[] = JSON.parse(s.votesJson || '[]');
            return (
              <Card key={s.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-semibold text-sm">{s.title}</h3>
                    <Badge variant="outline" className={`text-xs shrink-0 ml-2 ${getStatusColor(s.status)}`}>
                      {s.status === 'em-analise' ? 'Em Análise' : s.status === 'aprovada' ? 'Aprovada' : 'Rejeitada'}
                    </Badge>
                  </div>
                  <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{s.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-xs">{s.createdBy.name}</span>
                      <span className="text-zinc-600 text-xs">•</span>
                      <span className="text-zinc-500 text-xs">{formatDate(s.createdAt)}</span>
                      {s.estimatedCost > 0 && (
                        <>
                          <span className="text-zinc-600 text-xs">•</span>
                          <span className="text-zinc-400 text-xs">{s.estimatedCost.toFixed(2)}€</span>
                        </>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(s.id)}
                      className="text-zinc-400 hover:text-teal-400"
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      <span className="text-sm">{votes.length}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {suggestions.length === 0 && !loading && (
            <p className="text-zinc-500 text-center text-sm py-6">Sem sugestões ainda</p>
          )}
        </div>
      </div>
    </div>
  );
}
