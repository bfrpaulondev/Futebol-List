import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, signToken, COOKIE_OPTIONS } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        playerType: user.playerType,
        position: user.position,
        role: user.role,
        avatar: user.avatar,
        skillsJson: user.skillsJson,
        overallRating: user.overallRating,
        gamesPlayed: user.gamesPlayed,
        mvpCount: user.mvpCount,
      },
    });

    response.cookies.set(COOKIE_OPTIONS.name, token, {
      ...COOKIE_OPTIONS,
      value: token,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erro ao fazer login' }, { status: 500 });
  }
}
