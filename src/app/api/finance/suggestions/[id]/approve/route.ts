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

    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas admin pode aprovar sugestões' }, { status: 403 });
    }

    const { id } = await params;
    const suggestion = await db.suggestion.findUnique({ where: { id } });
    if (!suggestion) {
      return NextResponse.json({ error: 'Sugestão não encontrada' }, { status: 404 });
    }

    const approvals: string[] = JSON.parse(suggestion.approvalsJson || '[]');

    // Check if this admin already approved
    if (approvals.includes(payload.userId)) {
      return NextResponse.json({ error: 'Já aprovaste esta sugestão' }, { status: 409 });
    }

    // Add admin's userId to approvals
    approvals.push(payload.userId);
    const newApprovalsJson = JSON.stringify(approvals);

    // If 3 or more admins approved, open voting
    const votingOpen = approvals.length >= 3;

    const updated = await db.suggestion.update({
      where: { id },
      data: {
        approvalsJson: newApprovalsJson,
        votingOpen,
        ...(votingOpen ? { status: 'em-votação' } : {}),
      },
    });

    return NextResponse.json({
      suggestion: updated,
      approvalsCount: approvals.length,
      votingOpen,
    });
  } catch (error) {
    console.error('Approve suggestion error:', error);
    return NextResponse.json({ error: 'Erro ao aprovar sugestão' }, { status: 500 });
  }
}
