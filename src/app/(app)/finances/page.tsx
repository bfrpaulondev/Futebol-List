'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus } from 'lucide-react';

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
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/finance/balance');
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-zinc-900 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Finanças</h1>
        <Link href="/suggestions">
          <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            <Plus className="w-4 h-4 mr-1" />
            Sugestão
          </Button>
        </Link>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-700 overflow-hidden">
        <CardContent className="p-6">
          <p className="text-zinc-400 text-sm mb-1">Saldo Atual</p>
          <p className={`text-4xl font-bold ${data && data.current >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {data ? `${data.current >= 0 ? '+' : ''}${data.current.toFixed(2)}€` : '0.00€'}
          </p>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-zinc-400 mb-1">Entradas</p>
            <p className="text-lg font-bold text-emerald-400">
              {data ? `${data.entradas.toFixed(0)}€` : '-'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-zinc-400 mb-1">Saídas</p>
            <p className="text-lg font-bold text-red-400">
              {data ? `${data.saidas.toFixed(0)}€` : '-'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-zinc-400 mb-1">Mensalistas</p>
            <p className="text-lg font-bold text-teal-400">
              {data ? data.mensalistasCount : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Transações</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {data?.transactions.map((t) => (
            <Card key={t.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{t.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-zinc-500 text-xs">{formatDate(t.createdAt)}</span>
                      <Badge variant="outline" className="text-xs bg-zinc-800 text-zinc-400 border-zinc-700">
                        {t.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <p className={`text-sm font-bold ${t.type === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.type === 'entrada' ? '+' : '-'}{t.amount.toFixed(2)}€
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        t.isPaid
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {t.isPaid ? 'Pago' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!data || data.transactions.length === 0) && (
            <p className="text-zinc-500 text-center text-sm py-6">Sem transações registadas</p>
          )}
        </div>
      </div>
    </div>
  );
}
