'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Medal } from 'lucide-react';

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

  const getRankStyle = (index: number) => {
    if (index === 0) return { bg: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/50', medal: '🥇' };
    if (index === 1) return { bg: 'bg-gradient-to-r from-zinc-400/10 to-zinc-300/10', border: 'border-zinc-400/50', medal: '🥈' };
    if (index === 2) return { bg: 'bg-gradient-to-r from-amber-700/10 to-amber-600/10', border: 'border-amber-700/50', medal: '🥉' };
    return { bg: 'bg-zinc-900', border: 'border-zinc-800', medal: '' };
  };

  const getOvrColor = (rating: number) => {
    if (rating >= 8) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (rating >= 6) return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
    return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-zinc-900 rounded-xl animate-pulse" />
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
        <div className="flex items-center gap-2">
          <Medal className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold text-white">Ranking</h1>
        </div>
      </div>

      {/* Top 3 Podium */}
      {users.length >= 3 && (
        <div className="flex items-end justify-center gap-3 pt-4">
          {/* 2nd Place */}
          <Card className={`${getRankStyle(1).bg} ${getRankStyle(1).border} w-24 text-center`}>
            <CardContent className="p-3">
              <span className="text-2xl">{getRankStyle(1).medal}</span>
              <Avatar className="w-12 h-12 mx-auto my-2">
                <AvatarFallback className="bg-zinc-700 text-zinc-300 text-sm">
                  {users[1].name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <p className="text-white text-xs font-medium truncate">{users[1].name.split(' ')[0]}</p>
              <Badge variant="outline" className={`text-xs mt-1 ${getOvrColor(users[1].overallRating)}`}>
                {users[1].overallRating}
              </Badge>
            </CardContent>
          </Card>

          {/* 1st Place */}
          <Card className={`${getRankStyle(0).bg} ${getRankStyle(0).border} w-28 text-center`}>
            <CardContent className="p-3">
              <span className="text-3xl">{getRankStyle(0).medal}</span>
              <Avatar className="w-14 h-14 mx-auto my-2">
                <AvatarFallback className="bg-zinc-700 text-zinc-300 text-lg">
                  {users[0].name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <p className="text-white text-sm font-medium truncate">{users[0].name.split(' ')[0]}</p>
              <Badge variant="outline" className={`text-xs mt-1 ${getOvrColor(users[0].overallRating)}`}>
                {users[0].overallRating}
              </Badge>
            </CardContent>
          </Card>

          {/* 3rd Place */}
          <Card className={`${getRankStyle(2).bg} ${getRankStyle(2).border} w-24 text-center`}>
            <CardContent className="p-3">
              <span className="text-2xl">{getRankStyle(2).medal}</span>
              <Avatar className="w-12 h-12 mx-auto my-2">
                <AvatarFallback className="bg-zinc-700 text-zinc-300 text-sm">
                  {users[2].name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <p className="text-white text-xs font-medium truncate">{users[2].name.split(' ')[0]}</p>
              <Badge variant="outline" className={`text-xs mt-1 ${getOvrColor(users[2].overallRating)}`}>
                {users[2].overallRating}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {users.map((u, index) => (
          <Card key={u.id} className={`${getRankStyle(index).bg} ${getRankStyle(index).border}`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 text-sm font-bold">
                  {index + 1}
                </div>
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                    {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{u.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-xs">{u.gamesPlayed} jogos</span>
                    <span className="text-zinc-600 text-xs">•</span>
                    <span className="text-amber-400 text-xs">{u.mvpCount} MVPs</span>
                  </div>
                </div>
                <Badge variant="outline" className={`text-xs ${getOvrColor(u.overallRating)}`}>
                  OVR {u.overallRating}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}

        {users.length === 0 && !loading && (
          <p className="text-zinc-500 text-center py-8">Sem jogadores no ranking</p>
        )}
      </div>
    </div>
  );
}
