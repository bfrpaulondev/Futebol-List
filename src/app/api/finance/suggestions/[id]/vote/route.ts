import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const suggestion = await db.suggestion.findUnique({ where: { id } });
    if (!suggestion) {
      return NextResponse.json({ error: 'Sugestão não encontrada' }, { status: 404 });
    }

    // Only allow voting if votingOpen is true
    if (!suggestion.votingOpen) {
      return NextResponse.json({ error: 'Votação não está aberta para esta sugestão' }, { status: 403 });
    }

    const votes: string[] = JSON.parse(suggestion.votesJson || '[]');
    const userId = payload.userId;

    let updatedVotes: string[];
    if (votes.includes(userId)) {
      updatedVotes = votes.filter((v) => v !== userId);
    } else {
      updatedVotes = [...votes, userId];
    }

    const updated = await db.suggestion.update({
      where: { id },
      data: { votesJson: JSON.stringify(updatedVotes) },
    });

    return NextResponse.json({ suggestion: updated, votesCount: updatedVotes.length });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Erro ao votar' }, { status: 500 });
  }
}
