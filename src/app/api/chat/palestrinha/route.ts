import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed-check';
import { chatCompletion } from '@/lib/openai';

const PALESTRINHA_SYSTEM = `Tu és o Palestrinha, o treinador de bancada do Futebol Bonfim.

Personalidade:
- És um mini-técnico zoeiro e engraçado que NUNCA cala a boca
- Tens opiniões Fortíssimas sobre tudo no futebol (e quase sempre estás errado)
- Falas de forma casual e descontraída, usas gíria portuguesa (pt-PT)
- Gostas de "dar palestra" sobre táticas que ninguém pediu
- Ves-te a cada jogo mesmo que ninguém te convide
- Referencias os jogadores reais da equipa pelo nome quando possível
- Quando perguntam sobre táticas, dás conselhos absurdos tipo "o segredo é correr em círculos"
- De vez em quando interages com os jogadores individualmente

Estilo:
- Usa emojis frequentemente
- Faz piadas sobre futebol
- É auto-confidente mas inofensivo
- Fala sobre o histórico do jogo quando relevante
- Responde em português de Portugal

Regras:
- Nunca quebres o personagem
- Respostas curtas (2-3 frases máximo)
- Sê engraçado mas ofensivo
- Se te chamarem de Palestrinha, ficas indignado "O MEU NOME É TÉCNICO PALESTRINHA!"`;

const BOT_EMAIL = 'palestrinha-bot@futebolbonfim.pt';

export async function POST(request: Request) {
  await ensureSeeded();

  try {
    const { message, history, playerNames } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensagem obrigatória' }, { status: 400 });
    }

    // Find or create bot user
    let botUser = await db.user.findUnique({ where: { email: BOT_EMAIL } });
    if (!botUser) {
      botUser = await db.user.create({
        data: {
          email: BOT_EMAIL,
          passwordHash: 'no-login-bot',
          name: 'Palestrinha',
          playerType: 'mensalista',
          position: 'TREINADOR',
          role: 'player',
          skillsJson: '{}',
          overallRating: 0,
          gamesPlayed: 0,
          mvpCount: 0,
          notificationsEnabled: false,
        },
      });
    }

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: PALESTRINHA_SYSTEM },
    ];

    // Add player context
    if (playerNames && playerNames.length > 0) {
      messages.push({
        role: 'system',
        content: `Jogadores da equipa: ${playerNames.join(', ')}. Usa estes nomes quando relevante.`,
      });
    }

    // Add conversation history
    if (history && Array.isArray(history)) {
      const last6 = history.slice(-6);
      for (const h of last6) {
        if (h.role === 'user' || h.role === 'assistant') {
          messages.push({ role: h.role, content: h.content });
        }
      }
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    const reply = await chatCompletion(messages, 0.95);

    // Save bot message to DB so it persists
    const savedMessage = await db.message.create({
      data: {
        content: reply,
        authorId: botUser.id,
        channel: 'general',
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({
      reply,
      message: savedMessage,
    });
  } catch (error: any) {
    console.error('Palestrinha error:', error);
    return NextResponse.json({
      reply: 'Eh pá, a minha voz ficou presa no balneário! Tenta outra vez... 🤣',
    });
  }
}
