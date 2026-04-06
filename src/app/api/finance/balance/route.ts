import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed-check';

export async function GET() {
  await ensureSeeded();

  try {
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
