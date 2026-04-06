import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed-check';

export async function GET() {
  await ensureSeeded();

  try {
    const schedule = await db.coleteSchedule.findFirst({
      where: { year: new Date().getFullYear() },
    });

    if (!schedule) {
      return NextResponse.json({ schedule: null });
    }

    // Enrich with user data
    const months = JSON.parse(schedule.monthsJson);
    const enrichedMonths = await Promise.all(
      months.map(async (m: { month: string; monthIndex: number; userId: string; userName: string }) => {
        const user = await db.user.findUnique({
          where: { id: m.userId },
          select: { id: true, name: true, avatar: true },
        });
        return { ...m, user };
      })
    );

    return NextResponse.json({ schedule: { ...schedule, monthsJson: JSON.stringify(enrichedMonths) } });
  } catch (error) {
    console.error('Coletes error:', error);
    return NextResponse.json({ error: 'Erro ao buscar calendário' }, { status: 500 });
  }
}
