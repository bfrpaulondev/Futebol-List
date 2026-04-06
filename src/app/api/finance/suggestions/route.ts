import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';

export async function GET() {
  await ensureSeeded();

  try {
    // Require authentication to read suggestions
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const suggestions = await db.suggestion.findMany({
      include: {
        createdBy: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Get suggestions error:', error);
    return NextResponse.json({ error: 'Erro ao buscar sugestões' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { title, description, estimatedCost, category, isPriority } = await request.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'Título e descrição são obrigatórios' }, { status: 400 });
    }

    const suggestion = await db.suggestion.create({
      data: {
        title,
        description,
        estimatedCost: estimatedCost || 0,
        category: category || 'Geral',
        isPriority: isPriority || false,
        votesJson: JSON.stringify([]),
        approvalsJson: JSON.stringify([]),
        votingOpen: false,
        status: 'em-analise',
        createdById: payload.userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Create suggestion error:', error);
    return NextResponse.json({ error: 'Erro ao criar sugestão' }, { status: 500 });
  }
}
