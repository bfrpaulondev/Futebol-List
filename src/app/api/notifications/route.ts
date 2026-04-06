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

    const body = await request.json();

    // Support batch creation with userIds array
    if (body.userIds && Array.isArray(body.userIds) && body.userIds.length > 0) {
      const { userIds, type, title, message } = body;

      if (!type || !title || !message) {
        return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
      }

      if (userIds.length > 100) {
        return NextResponse.json({ error: 'Máximo 100 destinatários por envio' }, { status: 400 });
      }

      const notifications = await db.notification.createMany({
        data: userIds.map((userId: string) => ({
          userId,
          type,
          title,
          message,
        })),
      });

      return NextResponse.json({ notifications, count: notifications.count });
    }

    // Legacy single user creation
    const { userId, type, title, message: notifMessage } = body;

    if (!userId || !type || !title || !notifMessage) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const notification = await db.notification.create({
      data: {
        userId,
        type,
        title,
        message: notifMessage,
      },
    });

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json({ error: 'Erro ao criar notificação' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Mark all as read
    if (action === 'mark-all-read') {
      await db.notification.updateMany({
        where: { userId: payload.userId, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    // Mark single as read
    const id = searchParams.get('id');
    if (id) {
      const notification = await db.notification.findUnique({ where: { id } });
      if (!notification || notification.userId !== payload.userId) {
        return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 });
      }
      await db.notification.update({
        where: { id },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar notificação' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da notificação obrigatório' }, { status: 400 });
    }

    const notification = await db.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== payload.userId) {
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 });
    }

    await db.notification.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ error: 'Erro ao eliminar notificação' }, { status: 500 });
  }
}
