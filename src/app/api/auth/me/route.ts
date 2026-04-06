import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';

export async function GET() {
  try {
    await ensureSeeded();
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
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
    console.error('Auth me error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
