import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';

export async function GET() {
  await ensureSeeded();

  try {
    // Require authentication to read messages
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const messages = await db.message.findMany({
      where: { isDeleted: false, channel: 'general' },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Erro ao buscar mensagens' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { content } = await request.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Mensagem não pode estar vazia' }, { status: 400 });
    }

    const trimmed = content.trim();

    // Limit message length
    if (trimmed.length > 1000) {
      return NextResponse.json({ error: 'Mensagem demasiado longa (máx. 1000 caracteres)' }, { status: 400 });
    }

    const message = await db.message.create({
      data: {
        content: trimmed,
        authorId: payload.userId,
        channel: 'general',
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Create message error:', error);
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id, content } = await request.json();

    if (!id || !content || !content.trim()) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const trimmed = content.trim();

    if (trimmed.length > 1000) {
      return NextResponse.json({ error: 'Mensagem demasiado longa (máx. 1000 caracteres)' }, { status: 400 });
    }

    // Check if message exists
    const message = await db.message.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 });
    }

    if (message.isDeleted) {
      return NextResponse.json({ error: 'Mensagem eliminada' }, { status: 400 });
    }

    // Check permissions: own message or master
    const user = await db.user.findUnique({ where: { id: payload.userId } });
    const isMaster = user?.role === 'master';

    if (message.authorId !== payload.userId && !isMaster) {
      return NextResponse.json({ error: 'Não podes editar esta mensagem' }, { status: 403 });
    }

    const updated = await db.message.update({
      where: { id },
      data: { content: trimmed, updatedAt: new Date() },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ message: updated });
  } catch (error) {
    console.error('Update message error:', error);
    return NextResponse.json({ error: 'Erro ao editar mensagem' }, { status: 500 });
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
      return NextResponse.json({ error: 'ID da mensagem obrigatório' }, { status: 400 });
    }

    // Check if message exists
    const message = await db.message.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 });
    }

    if (message.isDeleted) {
      return NextResponse.json({ error: 'Mensagem já eliminada' }, { status: 400 });
    }

    // Check permissions: own message or master
    const user = await db.user.findUnique({ where: { id: payload.userId } });
    const isMaster = user?.role === 'master';

    if (message.authorId !== payload.userId && !isMaster) {
      return NextResponse.json({ error: 'Não podes eliminar esta mensagem' }, { status: 403 });
    }

    // Soft delete
    const updated = await db.message.update({
      where: { id },
      data: {
        isDeleted: true,
        content: 'Esta mensagem foi eliminada',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: 'Erro ao eliminar mensagem' }, { status: 500 });
  }
}
