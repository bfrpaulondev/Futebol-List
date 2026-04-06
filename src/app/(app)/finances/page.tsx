'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, CreditCard, TrendingUp, TrendingDown, Users, ShieldX } from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  description: string;
  isPaid: boolean;
  createdAt: string;
}

interface FinanceData {
  current: number;
  entradas: number;
  saidas: number;
  mensalistasCount: number;
  transactions: Transaction[];
}

export default function FinancesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/finance/balance');
      if (res.status === 401 || res.status === 403) {
        setError('Acesso negado');
        setData(null);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError('Erro ao carregar dados');
        setLoading(false);
        return;
      }
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        setData(null);
      } else {
        setError(null);
        setData(json);
      }
    } catch {
      setError('Erro de ligação');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      if (user.playerType !== 'mensalista' && user.role !== 'admin') {
        setError('Acesso restrito a mensalistas');
        setLoading(false);
        return;
      }
      fetchData();
    }
  }, [user, fetchData]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 glass-card rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Access denied screen
  if (error) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
            <ShieldX className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-[250px]">
            {error === 'Acesso restrito a mensalistas'
              ? 'A área de finanças é exclusiva para mensalistas do Futebol Bonfim.'
              : 'Não tens permissão para aceder a esta página.'}
          </p>
          <Button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl px-6 transition-all duration-200"
          >
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Finanças</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Futebol Bonfim</p>
        </div>
        <div className="flex gap-2">
          <Link href="/payments">
            <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200">
              <CreditCard className="w-4 h-4 mr-1" />
              Pagamento
            </Button>
          </Link>
          <Link href="/suggestions">
            <Button variant="outline" size="sm" className="border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/50 transition-all duration-200">
              <Plus className="w-4 h-4 mr-1" />
              Sugestão
            </Button>
          </Link>
        </div>
      </div>

      {/* Balance Card */}
      <div className="glass-card rounded-2xl shadow-lg shadow-black/20 overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 p-6">
          <p className="text-zinc-400 text-sm mb-2">Saldo Atual</p>
          <p className={`text-5xl font-bold tracking-tight ${data && data.current >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {data ? `${data.current >= 0 ? '+' : ''}${data.current.toFixed(2)}€` : '0.00€'}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-2xl shadow-lg shadow-black/10 p-4 text-center">
          <div className="w-8 h-8 mx-auto rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xs text-zinc-500 mb-0.5">Entradas</p>
          <p className="text-lg font-bold text-emerald-400">
            {data ? `${data.entradas.toFixed(0)}€` : '-'}
          </p>
        </div>
        <div className="glass-card rounded-2xl shadow-lg shadow-black/10 p-4 text-center">
          <div className="w-8 h-8 mx-auto rounded-lg bg-rose-500/10 flex items-center justify-center mb-2">
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xs text-zinc-500 mb-0.5">Saídas</p>
          <p className="text-lg font-bold text-rose-400">
            {data ? `${data.saidas.toFixed(0)}€` : '-'}
          </p>
        </div>
        <div className="glass-card rounded-2xl shadow-lg shadow-black/10 p-4 text-center">
          <div className="w-8 h-8 mx-auto rounded-lg bg-teal-500/10 flex items-center justify-center mb-2">
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-xs text-zinc-500 mb-0.5">Mensalistas</p>
          <p className="text-lg font-bold text-teal-400">
            {data ? data.mensalistasCount : '-'}
          </p>
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3">Transações</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-premium">
          {data?.transactions.map((t) => (
            <div key={t.id} className="glass-card rounded-xl p-3 transition-all duration-200 hover:bg-zinc-800/60">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{t.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-zinc-500 text-xs">{formatDate(t.createdAt)}</span>
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-zinc-800/80 text-zinc-400 border-zinc-700/50">
                      {t.category}
                    </Badge>
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className={`text-sm font-bold ${t.type === 'entrada' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.type === 'entrada' ? '+' : '-'}{t.amount.toFixed(2)}€
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 py-0.5 ${
                      t.isPaid
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {t.isPaid ? 'Pago' : 'Pendente'}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
          {(!data || data.transactions.length === 0) && (
            <p className="text-zinc-600 text-center text-sm py-8">Sem transações registadas</p>
          )}
        </div>
      </div>
    </div>
  );
}
