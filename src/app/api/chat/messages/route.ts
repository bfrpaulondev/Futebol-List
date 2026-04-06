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
