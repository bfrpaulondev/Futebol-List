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

    // Check if user is confirmed for this game
    const attendee = await db.gameAttendee.findUnique({
      where: {
        gameId_userId: { gameId: id, userId: payload.userId },
      },
    });

    if (!attendee) {
      return NextResponse.json({ error: 'Não estás confirmado neste jogo' }, { status: 400 });
    }

    if (attendee.status !== 'confirmed') {
      return NextResponse.json({ error: 'Apenas jogadores confirmados podem marcar chegada' }, { status: 400 });
    }

    // Mark arrival
    const updated = await db.gameAttendee.update({
      where: { id: attendee.id },
      data: { arrivedAt: new Date() },
    });

    // Get all arrived players
    const arrivedAttendees = await db.gameAttendee.findMany({
      where: {
        gameId: id,
        status: 'confirmed',
        arrivedAt: { not: null },
      },
      include: { user: true },
      orderBy: { arrivedAt: 'asc' },
    });

    const arrivedPlayers = arrivedAttendees.map((a) => ({
      userId: a.user.id,
      name: a.user.name,
      position: a.user.position,
      overallRating: a.user.overallRating,
      arrivedAt: a.arrivedAt,
    }));

    // Check if 10 minutes have passed since first arrival
    const canDraw =
      arrivedAttendees.length >= 2 &&
      arrivedAttendees[0].arrivedAt &&
      new Date().getTime() - arrivedAttendees[0].arrivedAt.getTime() >= 10 * 60 * 1000;

    // Check if game is on Friday and time >= 20:40 Lisbon time
    const game = await db.game.findUnique({ where: { id } });
    let fridayAutoDraw = false;
    if (game) {
      const now = new Date();
      const lisbonOffset = 0; // UTC matches Lisbon in summer, but we'll use UTC+0 as approximation
      const dayOfWeek = now.getUTCDay();
      const hours = now.getUTCHours();
      const minutes = now.getUTCMinutes();
      if (dayOfWeek === 5 && (hours > 20 || (hours === 20 && minutes >= 40))) {
        fridayAutoDraw = true;
      }
    }

    return NextResponse.json({
      success: true,
      arrived: arrivedPlayers,
      canDraw: canDraw || fridayAutoDraw,
    });
  } catch (error) {
    console.error('Arrive error:', error);
    return NextResponse.json({ error: 'Erro ao registar chegada' }, { status: 500 });
  }
}
