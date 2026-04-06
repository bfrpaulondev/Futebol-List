'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Crown, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  playerType: string;
  position: string;
  isActive: boolean;
}

interface GameItem {
  id: string;
  date: string;
  location: string;
  status: string;
  maxPlayers: number;
}

interface SuggestionItem {
  id: string;
  title: string;
  description: string;
  status: string;
  votesJson: string;
  createdAt: string;
  createdBy: { name: string };
}

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [games, setGames] = useState<GameItem[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New game form
  const [newGameDate, setNewGameDate] = useState('');
  const [newGameLocation, setNewGameLocation] = useState('Pavilhão Municipal de Setúbal');
  const [creatingGame, setCreatingGame] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, gamesRes, suggestionsRes] = await Promise.all([
        fetch('/api/users/leaderboard').then(r => r.json()).then(d => d.users || []),
        Promise.resolve([]),
        fetch('/api/finance/suggestions').then(r => r.json()),
      ]);

      setUsers(usersRes as UserItem[]);
      setSuggestions(suggestionsRes.suggestions || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleAdmin = async (userId: string) => {
    try {
      // Direct DB call via a simple approach
      const res = await fetch('/api/auth/me');
      // We'll use a simple approach - this would normally be an API
      // For demo, just toggle locally
      setUsers(users.map(u =>
        u.id === userId ? { ...u, role: u.role === 'admin' ? 'player' : 'admin' } : u
      ));
    } catch {
      // ignore
    }
  };

  const handleCreateGame = async () => {
    if (!newGameDate) return;
    setCreatingGame(true);
    try {
      const res = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newGameDate, location: newGameLocation }),
      });
      if (res.ok) {
        setNewGameDate('');
        await fetchData();
      }
    } catch {
      // ignore
    } finally {
      setCreatingGame(false);
    }
  };

  const handleSuggestionStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/suggestions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await fetchData();
    } catch {
      // ignore
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-4 text-center">
        <p className="text-red-400">Acesso negado</p>
      </div>
    );
  }

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
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-white">Admin Painel</h1>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-zinc-900 w-full">
          <TabsTrigger value="users" className="flex-1 text-zinc-400 data-[state=active]:text-white data-[state=active]:bg-zinc-800">
            Utilizadores
          </TabsTrigger>
          <TabsTrigger value="games" className="flex-1 text-zinc-400 data-[state=active]:text-white data-[state=active]:bg-zinc-800">
            Jogos
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex-1 text-zinc-400 data-[state=active]:text-white data-[state=active]:bg-zinc-800">
            Sugestões
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4 space-y-2">
          {users.map((u) => (
            <Card key={u.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-medium truncate">{u.name}</p>
                    {u.role === 'admin' && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </div>
                  <p className="text-zinc-500 text-xs truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-zinc-800 text-zinc-400 border-zinc-700">
                    {u.position}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleAdmin(u.id)}
                    className={`text-xs ${u.role === 'admin' ? 'text-amber-400' : 'text-zinc-500'}`}
                  >
                    {u.role === 'admin' ? 'Admin' : 'Player'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Games Tab */}
        <TabsContent value="games" className="mt-4 space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-zinc-400">Criar Novo Jogo</h3>
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-zinc-300 text-sm">Data e Hora</Label>
                  <Input
                    type="datetime-local"
                    value={newGameDate}
                    onChange={(e) => setNewGameDate(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-300 text-sm">Local</Label>
                  <Input
                    value={newGameLocation}
                    onChange={(e) => setNewGameLocation(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <Button
                  onClick={handleCreateGame}
                  disabled={creatingGame || !newGameDate}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                >
                  {creatingGame ? 'A criar...' : 'Criar Jogo'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {games.length === 0 && (
            <p className="text-zinc-500 text-center text-sm">A criação de jogos avançada requer endpoints adicionais</p>
          )}
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="mt-4 space-y-2">
          {suggestions.map((s) => {
            const votes: string[] = JSON.parse(s.votesJson || '[]');
            return (
              <Card key={s.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{s.title}</p>
                      <p className="text-zinc-500 text-xs">{s.createdBy.name} • {votes.length} votos</p>
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 ml-2 ${
                      s.status === 'aprovada' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      s.status === 'rejeitada' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {s.status === 'em-analise' ? 'Em Análise' : s.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSuggestionStatus(s.id, 'aprovada')}
                      className="text-emerald-400 text-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSuggestionStatus(s.id, 'rejeitada')}
                      className="text-red-400 text-xs"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {suggestions.length === 0 && (
            <p className="text-zinc-500 text-center text-sm py-6">Sem sugestões</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
