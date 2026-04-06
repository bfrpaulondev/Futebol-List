'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft } from 'lucide-react';

interface ColeteMonth {
  month: string;
  monthIndex: number;
  userId: string;
  userName: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
}

interface Schedule {
  id: string;
  year: number;
  monthsJson: string;
}

export default function ColetesPage() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [months, setMonths] = useState<ColeteMonth[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await fetch('/api/coletes/schedule');
      const data = await res.json();
      if (data.schedule) {
        setSchedule(data.schedule);
        setMonths(JSON.parse(data.schedule.monthsJson));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const currentMonth = new Date().getMonth();

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-24 glass-card rounded-2xl animate-pulse" />
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
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Calendário de Coletes</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Responsáveis mensais</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl shadow-lg shadow-black/20 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 p-4 text-center">
          <h2 className="text-lg font-bold text-white">Responsáveis {schedule?.year || 2025}</h2>
          <p className="text-zinc-400 text-sm mt-1">Quem leva os coletes em cada mês</p>
        </div>
      </div>

      {/* Months Grid */}
      <div className="grid grid-cols-3 gap-3">
        {months.map((m) => {
          const isCurrentMonth = m.monthIndex === currentMonth;
          return (
            <div
              key={m.monthIndex}
              className={`glass-card rounded-2xl transition-all duration-200 ${
                isCurrentMonth
                  ? 'ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'hover:bg-zinc-800/60'
              }`}
            >
              <CardContent className="p-3 text-center">
                <p className={`text-xs font-medium mb-2 ${isCurrentMonth ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {m.month}
                </p>
                <Avatar className="w-10 h-10 mx-auto mb-1.5">
                  <AvatarFallback className={`text-sm ${isCurrentMonth ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-300'}`}>
                    {(m.user?.name || m.userName).split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <p className={`text-xs font-medium truncate ${isCurrentMonth ? 'text-white' : 'text-zinc-400'}`}>
                  {(m.user?.name || m.userName).split(' ')[0]}
                </p>
                {isCurrentMonth && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mx-auto mt-1.5 online-dot" />
                )}
              </CardContent>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="glass-card rounded-2xl shadow-lg shadow-black/10 p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
            <span className="text-sm">ℹ️</span>
          </div>
          <div>
            <p className="text-zinc-300 text-sm">
              A responsabilidade dos coletes roda entre os jogadores do clube ao longo do ano.
            </p>
            <p className="text-zinc-500 text-xs mt-1">
              O mês atual está destacado em verde.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
