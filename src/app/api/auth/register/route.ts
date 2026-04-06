import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signToken, COOKIE_OPTIONS } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed-check';

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const { name, email, password, playerType, position } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email já registrado' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        playerType: playerType || 'grupo',
        position: position || 'ALA',
      },
    });

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
      },
    });

    response.cookies.set(COOKIE_OPTIONS.name, token, {
      ...COOKIE_OPTIONS,
      value: token,
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 });
  }
}
