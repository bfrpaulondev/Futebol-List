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

    // Get the game to check if teams have been drawn
    const game = await db.game.findUnique({
      where: { id },
    });

    if (!game) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    // Delete the attendee
    const deleted = await db.gameAttendee.deleteMany({
      where: { gameId: id, userId: payload.userId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Não estás inscrito neste jogo' }, { status: 404 });
    }

    // Only clear teams if they were actually drawn (teamsJson is not empty/default)
    const teamsDrawn = game.teamsJson && game.teamsJson !== '{}' && game.teamsJson !== 'null';
    if (teamsDrawn) {
      await db.game.update({
        where: { id },
        data: { teamsJson: '{}', aiCoachComment: null },
      });
    }

    // Auto-promote first person from waiting list to confirmed
    // Sort by priority first (mensalistas=1 before convidados=2), then by confirmedAt
    const waitingAttendees = await db.gameAttendee.findMany({
      where: { gameId: id, status: 'waiting' },
      orderBy: [
        { priority: 'asc' },
        { confirmedAt: 'asc' },
      ],
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    let promoted = null;
    if (waitingAttendees.length > 0) {
      const firstWaiting = waitingAttendees[0];
      await db.gameAttendee.update({
        where: { id: firstWaiting.id },
        data: { status: 'confirmed' },
      });
      promoted = {
        id: firstWaiting.user.id,
        name: firstWaiting.user.name,
      };
    }

    return NextResponse.json({
      success: true,
      promoted,
    });
  } catch (error) {
    console.error('Cancel error:', error);
    return NextResponse.json({ error: 'Erro ao cancelar presença' }, { status: 500 });
  }
}
