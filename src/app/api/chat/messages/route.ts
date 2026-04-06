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

    const body = await request.json();
    const { content, type, imageData, gifUrl, sticker } = body;

    const messageType = type || 'text';

    // Validate based on type
    if (messageType === 'text') {
      if (!content || !content.trim()) {
        return NextResponse.json({ error: 'Mensagem não pode estar vazia' }, { status: 400 });
      }
      const trimmed = content.trim();
      if (trimmed.length > 1000) {
        return NextResponse.json({ error: 'Mensagem demasiado longa (máx. 1000 caracteres)' }, { status: 400 });
      }
    } else if (messageType === 'image') {
      if (!imageData) {
        return NextResponse.json({ error: 'Imagem obrigatória' }, { status: 400 });
      }
      // Max 5MB base64 (~6.67MB raw but we check base64 length)
      if (imageData.length > 7_000_000) {
        return NextResponse.json({ error: 'Imagem demasiado grande (máx. 5MB)' }, { status: 400 });
      }
    } else if (messageType === 'gif') {
      if (!gifUrl) {
        return NextResponse.json({ error: 'URL do GIF obrigatória' }, { status: 400 });
      }
      if (gifUrl.length > 500) {
        return NextResponse.json({ error: 'URL do GIF demasiado longa' }, { status: 400 });
      }
    } else if (messageType === 'sticker') {
      if (!sticker) {
        return NextResponse.json({ error: 'Sticker obrigatório' }, { status: 400 });
      }
      if (sticker.length > 10) {
        return NextResponse.json({ error: 'Sticker inválido' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Tipo de mensagem inválido' }, { status: 400 });
    }

    // Build message content based on type
    let messageContent = '';
    if (messageType === 'text') {
      messageContent = content.trim();
    } else if (messageType === 'image') {
      messageContent = imageData;
    } else if (messageType === 'gif') {
      messageContent = gifUrl;
    } else if (messageType === 'sticker') {
      messageContent = sticker;
    }

    const message = await db.message.create({
      data: {
        content: messageContent,
        type: messageType,
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

    // Only text messages can be edited
    if (message.type !== 'text') {
      return NextResponse.json({ error: 'Apenas mensagens de texto podem ser editadas' }, { status: 400 });
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
    const deletedContent = message.type === 'text' ? 'Esta mensagem foi eliminada' : 'Este conteúdo foi eliminado';
    await db.message.update({
      where: { id },
      data: {
        isDeleted: true,
        content: deletedContent,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: 'Erro ao eliminar mensagem' }, { status: 500 });
  }
}
