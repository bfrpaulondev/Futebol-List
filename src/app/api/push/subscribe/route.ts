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
    const { endpoint, keys } = body;

    if (!endpoint || !keys || !keys.auth || !keys.p256dh) {
      return NextResponse.json({ error: 'Dados de subscrição inválidos' }, { status: 400 });
    }

    // Upsert: delete existing subscription for this endpoint, then create new one
    await db.pushSubscription.deleteMany({ where: { endpoint } });

    await db.pushSubscription.create({
      data: {
        userId: payload.userId,
        endpoint,
        keysAuth: keys.auth,
        keysP256dh: keys.p256dh,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json({ error: 'Erro ao subscrever notificações' }, { status: 500 });
  }
}
