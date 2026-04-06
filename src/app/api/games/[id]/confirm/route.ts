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
    const game = await db.game.findUnique({
      where: { id },
      include: {
        attendees: {
          orderBy: { confirmedAt: 'asc' },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    // Check if game is still open for confirmations
    if (game.status === 'closed' || game.status === 'completed') {
      return NextResponse.json({ error: 'As confirmações estão fechadas para este jogo' }, { status: 400 });
    }

    // Check if already registered
    const existingAttendee = game.attendees.find((a) => a.userId === payload.userId);
    if (existingAttendee) {
      return NextResponse.json({ error: 'Já confirmaste presença', attendee: existingAttendee }, { status: 409 });
    }

    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    const now = new Date();
    const deadline = game.confirmationDeadline ? new Date(game.confirmationDeadline) : null;
    const isMensalista = user.playerType === 'mensalista';
    const isBeforeDeadline = deadline ? now < deadline : false;

    // Count confirmed and total attendees
    const confirmedCount = game.attendees.filter((a) => a.status === 'confirmed').length;
    const totalOnList = game.attendees.length;

    // Determine status with proper priority logic
    let status: 'confirmed' | 'waiting';

    if (isMensalista && isBeforeDeadline) {
      // Mensalista BEFORE Wednesday 12h: always confirmed, even if >12 (others go to waiting)
      status = 'confirmed';
    } else {
      // Convidado OR mensalista AFTER deadline: confirmed only if < 12 confirmed, otherwise waiting
      status = confirmedCount < game.maxPlayers ? 'confirmed' : 'waiting';
    }

    // If mensalista confirms after deadline and there are already 12, but some are convidados,
    // we don't bump them - just goes to waiting list like everyone else
    // But before deadline, mensalista always gets a spot

    // Check total list capacity (confirmed + waiting)
    if (totalOnList >= game.maxPlayers + 5) {
      return NextResponse.json({ error: 'A lista de espera está cheia' }, { status: 400 });
    }

    const priority = isMensalista ? 1 : 2;

    const attendee = await db.gameAttendee.create({
      data: {
        gameId: id,
        userId: payload.userId,
        playerType: user.playerType,
        priority,
        status,
      },
    });

    return NextResponse.json({ success: true, attendee });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Já confirmaste presença' }, { status: 409 });
    }
    console.error('Confirm error:', error);
    return NextResponse.json({ error: 'Erro ao confirmar presença' }, { status: 500 });
  }
}
