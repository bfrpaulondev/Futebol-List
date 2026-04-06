import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';

export async function GET() {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        playerType: user.playerType,
        position: user.position,
        role: user.role,
        avatar: user.avatar,
        skillsJson: user.skillsJson,
        overallRating: user.overallRating,
        gamesPlayed: user.gamesPlayed,
        mvpCount: user.mvpCount,
        notificationsEnabled: user.notificationsEnabled,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  await ensureSeeded();

  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, playerType, position, notificationsEnabled } = body;

    const user = await db.user.update({
      where: { id: payload.userId },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(playerType && { playerType }),
        ...(position && { position }),
        ...(notificationsEnabled !== undefined && { notificationsEnabled }),
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        playerType: user.playerType,
        position: user.position,
        role: user.role,
        avatar: user.avatar,
        skillsJson: user.skillsJson,
        overallRating: user.overallRating,
        gamesPlayed: user.gamesPlayed,
        mvpCount: user.mvpCount,
        notificationsEnabled: user.notificationsEnabled,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
  }
}
