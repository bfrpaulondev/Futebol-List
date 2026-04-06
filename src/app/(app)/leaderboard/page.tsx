'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Medal, Trophy, Star } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string | null;
  playerType: string;
  position: string;
  overallRating: number;
  gamesPlayed: number;
  mvpCount: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/users/leaderboard');
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getOvrColor = (rating: number) => {
    if (rating >= 8) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
    if (rating >= 6) return 'bg-teal-500/15 text-teal-400 border-teal-500/20';
    return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20';
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 glass-card rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-200">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <Medal className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Ranking</h1>
            <p className="text-zinc-500 text-xs">Futebol Bonfim</p>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {users.length >= 3 && (
        <div className="flex items-end justify-center gap-3 pt-4 pb-2">
          {/* 2nd Place */}
          <div className="glass-card rounded-2xl w-28 text-center shadow-lg shadow-black/10">
            <CardContent className="p-3">
              <span className="text-2xl">🥈</span>
              <Avatar className="w-12 h-12 mx-auto my-2">
                <AvatarFallback className="bg-zinc-800 text-zinc-300 text-sm ring-1 ring-zinc-600/50">
                  {users[1].name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <p className="text-white text-xs font-medium truncate">{users[1].name.split(' ')[0]}</p>
              <Badge variant="outline" className={`text-[10px] mt-1 ${getOvrColor(users[1].overallRating)}`}>
                {users[1].overallRating}
              </Badge>
            </CardContent>
          </div>

          {/* 1st Place */}
          <div className="glass-card rounded-2xl w-32 text-center shadow-xl shadow-amber-500/10 gradient-border-emerald">
            <CardContent className="p-3 bg-zinc-900 rounded-2xl">
              <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <Avatar className="w-14 h-14 mx-auto my-2 ring-2 ring-amber-500/40 ring-offset-2 ring-offset-zinc-900">
                <AvatarFallback className="bg-zinc-800 text-white text-lg">
                  {users[0].name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <p className="text-white text-sm font-bold truncate">{users[0].name.split(' ')[0]}</p>
              <Badge variant="outline" className={`text-[10px] mt-1 ${getOvrColor(users[0].overallRating)}`}>
                OVR {users[0].overallRating}
              </Badge>
            </CardContent>
          </div>

          {/* 3rd Place */}
          <div className="glass-card rounded-2xl w-28 text-center shadow-lg shadow-black/10">
            <CardContent className="p-3">
              <span className="text-2xl">🥉</span>
              <Avatar className="w-12 h-12 mx-auto my-2">
                <AvatarFallback className="bg-zinc-800 text-zinc-300 text-sm ring-1 ring-zinc-600/50">
                  {users[2].name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <p className="text-white text-xs font-medium truncate">{users[2].name.split(' ')[0]}</p>
              <Badge variant="outline" className={`text-[10px] mt-1 ${getOvrColor(users[2].overallRating)}`}>
                {users[2].overallRating}
              </Badge>
            </CardContent>
          </div>
        </div>
      )}

      {/* Full List */}
      <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-premium">
        {users.map((u, index) => {
          const isTop3 = index < 3;
          return (
            <div
              key={u.id}
              className={`glass-card rounded-xl transition-all duration-200 hover:bg-zinc-800/60 ${
                isTop3 ? 'shadow-md shadow-black/10' : ''
              }`}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                    index === 0
                      ? 'bg-amber-500/15 text-amber-400'
                      : index === 1
                        ? 'bg-zinc-400/15 text-zinc-300'
                        : index === 2
                          ? 'bg-amber-700/15 text-amber-500'
                          : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {index + 1}
                  </div>
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                      {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate flex items-center gap-1.5">
                      {u.name}
                      {u.mvpCount > 0 && (
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-xs">{u.gamesPlayed} jogos</span>
                      <span className="text-zinc-700 text-xs">•</span>
                      <span className="text-amber-400 text-xs">{u.mvpCount} MVPs</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${getOvrColor(u.overallRating)}`}>
                    OVR {u.overallRating}
                  </Badge>
                </div>
              </CardContent>
            </div>
          );
        })}

        {users.length === 0 && !loading && (
          <p className="text-zinc-600 text-center py-8">Sem jogadores no ranking</p>
        )}
      </div>
    </div>
  );
}
