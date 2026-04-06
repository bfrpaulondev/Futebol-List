'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

interface GameAttendee {
  userId: string;
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
  attendees: GameAttendee[];
}

const SKILLS = [
  { key: 'defense', label: 'Defesa' },
  { key: 'attack', label: 'Ataque' },
  { key: 'passing', label: 'Passe' },
  { key: 'technique', label: 'Técnica' },
  { key: 'stamina', label: 'Resistência' },
];

export default function RateSkillsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get('game') || '';
  const { user } = useAuthStore();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ratings, setRatings] = useState<Record<string, Record<string, number>>>({});

  const fetchGame = useCallback(async () => {
    if (!gameId) return;
    try {
      const res = await fetch(`/api/games/${gameId}`);
      const data = await res.json();
      setGame(data.game);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  const teammates = game?.attendees.filter((a) => a.userId !== user?.id) || [];

  const setRating = (userId: string, skill: string, value: number) => {
    setRatings((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [skill]: value,
      },
    }));
  };

  const allRated = teammates.length > 0 && teammates.every(
    (t) => ratings[t.userId] && SKILLS.every((s) => ratings[t.userId]?.[s.key] > 0)
  );

  const handleSubmit = async () => {
    if (!allRated || !gameId) return;
    setSubmitting(true);

    try {
      const promises = teammates.map((t) =>
        fetch('/api/ratings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId,
            ratedPlayerId: t.userId,
            scores: ratings[t.userId],
          }),
        })
      );
      await Promise.all(promises);
      router.push('/');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
  };

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
        <h1 className="text-2xl font-bold text-white">Avaliar Jogadores</h1>
      </div>

      {/* Game Info */}
      {game && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="text-white font-medium capitalize">{formatDate(game.date)}</p>
                <p className="text-zinc-500 text-sm">{game.location}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teammates */}
      <div className="space-y-4">
        {teammates.map((teammate) => (
          <Card key={teammate.userId} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-zinc-800 text-zinc-300">
                    {teammate.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-semibold text-sm">{teammate.user.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-zinc-800 text-zinc-400 border-zinc-700">
                      {teammate.user.position}
                    </Badge>
                    <span className="text-zinc-500 text-xs">OVR {teammate.user.overallRating}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {SKILLS.map((skill) => {
                  const value = ratings[teammate.userId]?.[skill.key] || 5;
                  return (
                    <div key={skill.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-400">{skill.label}</span>
                        <span className="text-xs font-bold text-teal-400">{value}</span>
                      </div>
                      <Slider
                        value={[value]}
                        onValueChange={([v]) => setRating(teammate.userId, skill.key, v)}
                        min={1}
                        max={10}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {teammates.length === 0 && (
          <p className="text-zinc-500 text-center py-8">Sem colegas para avaliar neste jogo</p>
        )}
      </div>

      {/* Submit */}
      {teammates.length > 0 && (
        <Button
          onClick={handleSubmit}
          disabled={!allRated || submitting}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-5"
        >
          {submitting ? 'A enviar...' : allRated ? '✅ Submeter Avaliações' : `Avaliar ${teammates.length} jogadores`}
        </Button>
      )}
    </div>
  );
}
