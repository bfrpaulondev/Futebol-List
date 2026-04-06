import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const game = await db.game.findUnique({
      where: { id },
      include: {
        attendees: {
          where: { status: 'confirmed' },
          include: { user: true },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    // Get arrived players
    const arrivedAttendees = game.attendees.filter((a) => a.arrivedAt);
    const arrivedPlayers = arrivedAttendees.map((a) => ({
      userId: a.user.id,
      name: a.user.name,
      position: a.user.position,
      overallRating: a.user.overallRating,
      avatar: a.user.avatar,
      arrivedAt: a.arrivedAt,
    }));

    // Check 10-minute rule
    const canDraw =
      arrivedAttendees.length >= 2 &&
      arrivedAttendees[0].arrivedAt &&
      new Date().getTime() - arrivedAttendees[0].arrivedAt.getTime() >= 10 * 60 * 1000;

    // Friday 20:40 auto-draw check
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    const fridayAutoDraw = dayOfWeek === 5 && (hours > 20 || (hours === 20 && minutes >= 40));

    // Check if teams already drawn
    const teamsJson = JSON.parse(game.teamsJson || '{}');
    const teamsDrawn = !!(teamsJson.teamA && teamsJson.teamB);

    // Time until draw available
    let timeUntilDraw: number | null = null;
    if (arrivedAttendees.length >= 2 && arrivedAttendees[0].arrivedAt) {
      const elapsed = new Date().getTime() - arrivedAttendees[0].arrivedAt.getTime();
      const remaining = 10 * 60 * 1000 - elapsed;
      if (remaining > 0) {
        timeUntilDraw = remaining;
      }
    }

    return NextResponse.json({
      arrived: arrivedPlayers,
      totalConfirmed: game.attendees.length,
      canDraw: canDraw || fridayAutoDraw || false,
      teamsDrawn,
      teams: teamsDrawn ? teamsJson : null,
      aiCoachComment: game.aiCoachComment,
      timeUntilDraw,
    });
  } catch (error) {
    console.error('Draw status error:', error);
    return NextResponse.json({ error: 'Erro ao obter estado do sorteio' }, { status: 500 });
  }
}
