import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';

export async function GET() {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    // Mensalistas and admins can access balance
    const isMensalista = user.playerType === 'mensalista';
    const isAdmin = user.role === 'admin' || user.role === 'master';
    if (!isMensalista && !isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const transactions = await db.transaction.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const entradas = transactions.filter((t) => t.type === 'entrada').reduce((sum, t) => sum + t.amount, 0);
    const saidas = transactions.filter((t) => t.type === 'saida').reduce((sum, t) => sum + t.amount, 0);

    const mensalistasCount = await db.user.count({
      where: { playerType: 'mensalista', isActive: true },
    });

    return NextResponse.json({
      current: entradas - saidas,
      entradas,
      saidas,
      mensalistasCount,
      transactions,
    });
  } catch (error) {
    console.error('Balance error:', error);
    return NextResponse.json({ error: 'Erro ao buscar saldo' }, { status: 500 });
  }
}
