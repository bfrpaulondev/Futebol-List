'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, CreditCard, CheckCircle2, XCircle, Clock, Lock, ImageIcon } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

interface Receipt {
  id: string;
  month: number;
  year: number;
  amount: number;
  imageData: string;
  status: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
  reviewer?: {
    id: string;
    name: string;
  };
}

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export default function PaymentsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState('25.00');
  const [imageData, setImageData] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [viewingImage, setViewingImage] = useState('');

  const fetchReceipts = useCallback(async () => {
    try {
      const res = await fetch('/api/payments/receipts');
      if (res.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setReceipts(data.receipts || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter menos de 5MB');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImageData(base64);
      setPreviewUrl(base64);
      setUploading(false);
    };
    reader.onerror = () => {
      setError('Erro ao ler a imagem');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageData) {
      setError('Por favor, seleciona uma imagem');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/payments/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          year,
          amount: parseFloat(amount) || 25.00,
          imageData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao enviar comprovativo');
        setSubmitting(false);
        return;
      }

      setImageData('');
      setPreviewUrl('');
      await fetchReceipts();
    } catch {
      setError('Erro de ligação');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Aprovado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-rose-500/10 text-rose-400 border-rose-500/20 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Rejeitado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pendente
          </Badge>
        );
    }
  };

  const currentMonthPaid = receipts.some(
    (r) => r.month === new Date().getMonth() + 1 && r.year === new Date().getFullYear() && r.status === 'approved'
  );

  if (accessDenied) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-200">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white tracking-tight">💳 Pagamentos</h1>
        </div>
        <div className="glass-card rounded-2xl shadow-lg shadow-black/20 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-rose-400" />
          </div>
          <p className="text-zinc-300 text-lg font-medium">Acesso restrito a mensalistas</p>
          <p className="text-zinc-500 text-sm mt-2">
            Esta funcionalidade está disponível apenas para jogadores mensalistas.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 glass-card rounded-2xl animate-pulse" />
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
          <h1 className="text-2xl font-bold text-white tracking-tight">💳 Pagamentos</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Futebol Bonfim</p>
        </div>
      </div>

      {/* Current Month Status */}
      <div className={`glass-card rounded-2xl shadow-lg shadow-black/20 overflow-hidden ${
        currentMonthPaid ? 'gradient-border-emerald' : ''
      }`}>
        <div className={`p-5 ${currentMonthPaid ? 'bg-emerald-500/5' : 'bg-amber-500/5'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              currentMonthPaid ? 'bg-emerald-500/15' : 'bg-amber-500/15'
            }`}>
              <CreditCard className={`w-6 h-6 ${currentMonthPaid ? 'text-emerald-400' : 'text-amber-400'}`} />
            </div>
            <div>
              <p className="text-white font-semibold">
                {MONTHS[new Date().getMonth()].label} {new Date().getFullYear()}
              </p>
              <p className={`text-sm ${currentMonthPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                {currentMonthPaid ? '✅ Mensalidade paga' : '⏳ Aguardando pagamento'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <div className="glass-card rounded-2xl shadow-lg shadow-black/10 p-4">
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4 text-emerald-400" />
          Enviar Comprovativo
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-zinc-300 text-sm">Mês</Label>
              <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
                <SelectTrigger className="bg-zinc-800/80 border-zinc-700/50 text-white transition-all duration-200 focus:border-emerald-500/50 focus:ring-emerald-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)} className="text-white">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300 text-sm">Ano</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger className="bg-zinc-800/80 border-zinc-700/50 text-white transition-all duration-200 focus:border-emerald-500/50 focus:ring-emerald-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="2025" className="text-white">2025</SelectItem>
                  <SelectItem value="2026" className="text-white">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-zinc-300 text-sm">Montante (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-zinc-800/80 border-zinc-700/50 text-white transition-all duration-200 focus:border-emerald-500/50 focus:ring-emerald-500/20"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-zinc-300 text-sm">Comprovativo (MBWay)</Label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="receipt-upload"
              />
              <label htmlFor="receipt-upload" className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-zinc-700/50 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-all duration-200 bg-zinc-800/30">
                {uploading ? (
                  <span className="text-zinc-400 text-sm">A processar...</span>
                ) : previewUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={previewUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                    <span className="text-emerald-400 text-sm">Imagem selecionada</span>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5 text-zinc-500" />
                    <span className="text-zinc-400 text-sm">Clica para selecionar</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {error && (
            <p className="text-rose-400 text-sm text-center bg-rose-500/10 py-2 px-3 rounded-lg">{error}</p>
          )}

          <Button
            type="submit"
            disabled={submitting || !imageData}
            className="w-full btn-gradient-animated text-white transition-all duration-200 shadow-lg shadow-emerald-500/20 font-semibold"
          >
            {submitting ? 'A enviar...' : 'Enviar Comprovativo'}
          </Button>
        </form>
      </div>

      {/* Receipts History */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3">Histórico</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-premium">
          {receipts.map((r) => (
            <div key={r.id} className="glass-card rounded-xl p-4 transition-all duration-200 hover:bg-zinc-800/60">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => setViewingImage(r.imageData)}>
                    <img src={r.imageData} alt="Comprovativo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {MONTHS[r.month - 1]?.label} {r.year}
                    </p>
                    <p className="text-zinc-500 text-xs">{r.amount.toFixed(2)}€</p>
                  </div>
                </div>
                {getStatusBadge(r.status)}
              </div>
              {r.status === 'rejected' && r.reviewNote && (
                <div className="mt-2 p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/10">
                  <p className="text-rose-400 text-xs">
                    <span className="font-medium">Motivo:</span> {r.reviewNote}
                  </p>
                </div>
              )}
              {r.reviewedAt && (
                <p className="text-zinc-600 text-xs mt-1.5">
                  Revisto em {new Date(r.reviewedAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          ))}
          {receipts.length === 0 && (
            <p className="text-zinc-600 text-center text-sm py-8">Sem comprovativos enviados</p>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setViewingImage('')}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative max-w-lg w-full">
            <img src={viewingImage} alt="Comprovativo" className="w-full rounded-2xl shadow-2xl" />
            <button
              onClick={() => setViewingImage('')}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
