import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';

export async function POST(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint obrigatório' }, { status: 400 });
    }

    // Delete subscription belonging to this user for this endpoint
    const deleted = await db.pushSubscription.deleteMany({
      where: {
        userId: payload.userId,
        endpoint,
      },
    });

    return NextResponse.json({ success: true, deleted: deleted.count });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    return NextResponse.json({ error: 'Erro ao cancelar subscrição' }, { status: 500 });
  }
}
