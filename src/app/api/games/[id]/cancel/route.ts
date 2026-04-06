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

    await db.gameAttendee.deleteMany({
      where: { gameId: id, userId: payload.userId },
    });

    // Clear teams if drawn
    await db.game.update({
      where: { id },
      data: { teamsJson: '{}', aiCoachComment: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel error:', error);
    return NextResponse.json({ error: 'Erro ao cancelar presença' }, { status: 500 });
  }
}
