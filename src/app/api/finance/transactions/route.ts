import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed-check';

export async function GET() {
  await ensureSeeded();

  try {
    const transactions = await db.transaction.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Transactions error:', error);
    return NextResponse.json({ error: 'Erro ao buscar transações' }, { status: 500 });
  }
}
