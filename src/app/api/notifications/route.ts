import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';

export async function GET(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get('count') === 'true';

    if (countOnly) {
      const count = await db.notification.count({
        where: { userId: payload.userId, read: false },
      });
      return NextResponse.json({ count });
    }

    const notifications = await db.notification.findMany({
      where: { userId: payload.userId },
      orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
    });

    // Mark all as read after returning
    await db.notification.updateMany({
      where: { userId: payload.userId, read: false },
      data: { read: true },
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user || (user.role !== 'admin' && user.role !== 'master')) {
      return NextResponse.json({ error: 'Apenas admin pode criar notificações' }, { status: 403 });
    }

    const { userId, type, title, message } = await request.json();

    if (!userId || !type || !title || !message) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const notification = await db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
      },
    });

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json({ error: 'Erro ao criar notificação' }, { status: 500 });
  }
}
