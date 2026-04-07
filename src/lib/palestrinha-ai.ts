import { chatCompletion } from '@/lib/openai';

const PALESTRINHA_SYSTEM_PROMPT = `És o Palestrinha, o mini treinador oficial e comentador do Society Futebol Nº5 - Futebol Bonfim.

A tua personalidade:
- Muito engraçado e informal, usas linguagem portuguesa de Portugal com slang (bora lá, fogo, epa, pá, fixe, gajo, stuntman, etc.)
- Entusiasmado e motivador, adoras animar a rapaziada
- Gostas de exagerar nos elogios e nas críticas (sempre com bom humor)
- Referências frequentes: "Society Futebol Nº5", "Bonfim", "rapaziada", "pavilhão", "futsal society"
- Usas muitos emojis nas tuas mensagens
- Tens opinião sobre tudo e todos, nunca estás neutro
- Quando alguém falha, dizes que "precisa de mais treinos no quintal"
- Quando alguém brilha, é "o novo Messi do Bonfim"
- Falas sempre em pt-PT, nunca em pt-BR`;

/**
 * Generate a post-game chronicle using Palestrinha AI.
 */
export async function generatePostGameChronicle(
  gameData: {
    id: string;
    date: Date;
    location: string;
    scoreA: number;
    scoreB: number;
    teamsJson: string;
    aiCoachComment: string | null;
    stats: Array<{
      userId: string;
      goals: number;
      assists: number;
      ownGoals: number;
      team: string;
      isMvp: boolean;
    }>;
  },
  players: Array<{ id: string; name: string; position: string; overallRating: number }>
): Promise<string> {
  try {
    let teamsInfo: any = {};
    try {
      teamsInfo = JSON.parse(gameData.teamsJson);
    } catch {
      teamsInfo = {};
    }

    const playerMap = new Map(players.map((p) => [p.id, p]));

    // Build stat descriptions
    const statLines = gameData.stats.map((s) => {
      const player = playerMap.get(s.userId);
      const name = player?.name || 'Desconhecido';
      const parts: string[] = [];
      if (s.goals > 0) parts.push(`${s.goals} golo${s.goals > 1 ? 's' : ''}`);
      if (s.assists > 0) parts.push(`${s.assists} assistência${s.assists > 1 ? 's' : ''}`);
      if (s.ownGoals > 0) parts.push(`${s.ownGoals} autogolo${s.ownGoals > 1 ? 's' : ''}`);
      if (s.isMvp) parts.push('MVP ⭐');
      return parts.length > 0 ? `${name}: ${parts.join(', ')}` : null;
    }).filter(Boolean);

    // MVP
    const mvpStat = gameData.stats.find((s) => s.isMvp);
    const mvpName = mvpStat ? (playerMap.get(mvpStat.userId)?.name || 'Desconhecido') : null;

    // Scorers
    const scorers = gameData.stats
      .filter((s) => s.goals > 0)
      .map((s) => `${playerMap.get(s.userId)?.name || '?'} (${s.goals})`)
      .join(', ');

    // Own goal scorers
    const ownGoalers = gameData.stats
      .filter((s) => s.ownGoals > 0)
      .map((s) => playerMap.get(s.userId)?.name || '?')
      .join(', ');

    const dateStr = gameData.date.toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const chronicle = await chatCompletion([
      {
        role: 'system',
        content: `${PALESTRINHA_SYSTEM_PROMPT}

Escreve uma crónica pós-jogo do Society Futebol Nº5 - Futebol Bonfim.

Regras:
- Máximo 800 caracteres
- Em pt-PT informal com slang
- Menciona os heróis do jogo (marcadores, MVP, assistências)
- Lamenta os momentos engraçados (autogolos, falhas)
- Comenta o resultado e o ambiente
- Usa emojis
- Sê engraçado mas respeitoso
- Não uses aspas`,
      },
      {
        role: 'user',
        content: `Jogo do dia ${dateStr} no ${gameData.location}:
- Resultado: Equipa A ${gameData.scoreA} - ${gameData.scoreB} Equipa B
- Marcadores: ${scorers || 'Nenhum'}
${ownGoalers ? `- Autogolos: ${ownGoalers}` : ''}
${mvpName ? `- MVP: ${mvpName} ⭐` : ''}
- Estatísticas dos jogadores: ${statLines.join('; ') || 'Sem dados'}
${gameData.aiCoachComment ? `- Comentário do treinador: ${gameData.aiCoachComment}` : ''}
${teamsInfo.teamA ? `- Equipa A: ${(teamsInfo.teamA as any[]).map((p: any) => p.name).join(', ')}` : ''}
${teamsInfo.teamB ? `- Equipa B: ${(teamsInfo.teamB as any[]).map((p: any) => p.name).join(', ')}` : ''}

Escreve a crónica do jogo!`,
      },
    ], 1.1);

    return (chronicle || '').trim().slice(0, 800);
  } catch (error) {
    console.error('Error generating chronicle:', error);
    return 'Crónica indisponível - o Palestrinha está a descansar! ⚽😴';
  }
}

/**
 * Generate a pre-game motivational summary.
 */
export async function generatePreGameSummary(
  lastGame: any,
  upcomingGame: any,
  playerStats: Array<{ name: string; totalGoals: number; totalAssists: number; mvpCount: number; consecutiveGames: number; gamesPlayed: number }>
): Promise<string> {
  try {
    const dateStr = upcomingGame?.date
      ? new Date(upcomingGame.date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })
      : 'data por definir';

    let lastGameInfo = 'Não houve jogo anterior.';
    if (lastGame && lastGame.playedAt) {
      const lastDateStr = new Date(lastGame.playedAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });
      lastGameInfo = `Último jogo (${lastDateStr}): Equipa A ${lastGame.scoreA} - ${lastGame.scoreB} Equipa B`;
    }

    // Highlight top players
    const topScorers = playerStats
      .filter((p) => p.totalGoals > 0)
      .sort((a, b) => b.totalGoals - a.totalGoals)
      .slice(0, 3);

    const topMvps = playerStats
      .filter((p) => p.mvpCount > 0)
      .sort((a, b) => b.mvpCount - a.mvpCount)
      .slice(0, 3);

    const streakPlayers = playerStats
      .filter((p) => p.consecutiveGames >= 3)
      .sort((a, b) => b.consecutiveGames - a.consecutiveGames);

    const summary = await chatCompletion([
      {
        role: 'system',
        content: `${PALESTRINHA_SYSTEM_PROMPT}

Gera um resumo motivacional pré-jogo do Society Futebol Nº5 - Futebol Bonfim.

Regras:
- Máximo 600 caracteres
- Em pt-PT informal com slang
- Motiva a rapaziada para o próximo jogo
- Destaca quem esteve bem no último jogo
- Menciona os melhores marcadores e MVPs
- Fala dos jogadores com rachas (streaks)
- Usa emojis
- Sê entusiasmado e engraçado`,
      },
      {
        role: 'user',
        content: `Próximo jogo: ${dateStr} no ${upcomingGame?.location || 'Pavilhão Municipal'}
${lastGameInfo}
${topScorers.length > 0 ? `Top marcadores: ${topScorers.map((p) => `${p.name} (${p.totalGoals}g)`).join(', ')}` : ''}
${topMvps.length > 0 ? `Top MVPs: ${topMvps.map((p) => `${p.name} (${p.mvpCount}x)`).join(', ')}` : ''}
${streakPlayers.length > 0 ? `Jogadores em racha: ${streakPlayers.map((p) => `${p.name} (${p.consecutiveGames} jogos)`).join(', ')}` : ''}

Bora motivar a rapaziada!`,
      },
    ], 1.0);

    return (summary || '').trim().slice(0, 600);
  } catch (error) {
    console.error('Error generating pre-game summary:', error);
    return 'Bora lá rapaziada! Mais um jogo épico no Bonfim! ⚽🔥';
  }
}

/**
 * Generate a weekly review article.
 */
export async function generateWeeklyReview(
  weekGames: Array<{
    id: string;
    date: Date;
    location: string;
    scoreA: number;
    scoreB: number;
    playedAt: Date | null;
  }>,
  topPlayers: Array<{ name: string; goals: number; assists: number; mvpCount: number; rating: number }>,
  complaints: Array<{ description: string; complainantName: string; againstName: string; category: string }>,
  badges: Array<{ playerName: string; badgeName: string }>
): Promise<string> {
  try {
    const gamesInfo = weekGames
      .filter((g) => g.playedAt)
      .map((g) => {
        const dateStr = new Date(g.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
        return `${dateStr}: A ${g.scoreA} - ${g.scoreB} B`;
      })
      .join('\n');

    const topPlayersInfo = topPlayers
      .slice(0, 5)
      .map((p) => `${p.name}: ${p.goals}g, ${p.assists}a, ${p.mvpCount} MVP, rating ${p.rating}`)
      .join('\n');

    const complaintsInfo = complaints.length > 0
      ? complaints.slice(0, 3).map((c) => `- ${c.complainantName} queixou-se de ${c.againstName} (${c.category})`).join('\n')
      : 'Sem queixas esta semana! 😇';

    const badgesInfo = badges.length > 0
      ? badges.map((b) => `🎉 ${b.playerName} ganhou: ${b.badgeName}`).join('\n')
      : 'Sem novos badges esta semana.';

    const review = await chatCompletion([
      {
        role: 'system',
        content: `${PALESTRINHA_SYSTEM_PROMPT}

Escreve um artigo de revisão semanal do Society Futebol Nº5 - Futebol Bonfim.

Regras:
- Máximo 1000 caracteres
- Em pt-PT informal com slang
- Resume os jogos da semana
- Destaca os melhores jogadores
- Comenta os badges ganhos
- Fala das queixas de forma engraçada (se houver)
- Conclui com motivação para a próxima semana
- Usa emojis
- Sê engraçado e informal`,
      },
      {
        role: 'user',
        content: `Revisão da semana do Society Futebol Nº5:

Jogos realizados:
${gamesInfo || 'Nenhum jogo realizado'}

Melhores jogadores:
${topPlayersInfo || 'Sem dados'}

Queixas:
${complaintsInfo}

Badges ganhos:
${badgesInfo}

Escreve a revisão semanal!`,
      },
    ], 1.1);

    return (review || '').trim().slice(0, 1000);
  } catch (error) {
    console.error('Error generating weekly review:', error);
    return 'Revisão semanal indisponível - o Palestrinha foi jantar! ⚽🍝';
  }
}

/**
 * Generate a funny response to a complaint from Palestrinha.
 */
export async function generateComplaintResponse(
  complaint: {
    description: string;
    category: string;
    complainantName: string;
    againstName: string;
    againstComplaintsCount: number;
  }
): Promise<string> {
  try {
    const categoryLabels: Record<string, string> = {
      agressao: 'agressão física',
      faltas: 'faltas excessivas',
      palavras: 'palavras menos próprias',
      atraso: 'atraso recorrente',
      outro: 'outro motivo',
    };

    const categoryLabel = categoryLabels[complaint.category] || complaint.category;

    const response = await chatCompletion([
      {
        role: 'system',
        content: `${PALESTRINHA_SYSTEM_PROMPT}

És o juiz e investigador do Bureau de Queixas do Society Futebol Nº5 - Futebol Bonfim.

Quando alguém apresenta uma queixa, tu investigas e dás a tua "sentença" de forma engraçada:

Regras:
- Máximo 400 caracteres
- Em pt-PT informal com slang
- Dá a tua opinião sobre a queixa (sempre com humor)
- Se o acusado já tem muitas queixas, pica mais
- Tenta ser justo mas engraçado
- Usa emojis
- Não leves nada a sério demais
- Propõe uma "pena" engraçada (ex: pagar o almoço, lavar os coletes, etc.)`,
      },
      {
        role: 'user',
        content: `Nova queixa no Bureau:
- Queixoso: ${complaint.complainantName}
- Acusado: ${complaint.againstName} (já tem ${complaint.againstComplaintsCount} queixa${complaint.againstComplaintsCount !== 1 ? 's' : ''} contra si)
- Motivo: ${categoryLabel}
- Descrição: ${complaint.description}

Investiga e dá a tua sentença!`,
      },
    ], 1.2);

    return (response || '').trim().slice(0, 400);
  } catch (error) {
    console.error('Error generating complaint response:', error);
    return 'O Bureau de Queixas está em reunião. Resposta em breve! 📋';
  }
}

/**
 * Generate a speech for the player of the month award ceremony.
 */
export async function generatePlayerOfMonthSpeech(
  playerName: string,
  stats: { month: number; year: number; mvpCount: number; avgRating: number; gamesPlayed: number; goals: number }
): Promise<string> {
  try {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];

    const monthStr = monthNames[stats.month - 1] || 'mês';

    const speech = await chatCompletion([
      {
        role: 'system',
        content: `${PALESTRINHA_SYSTEM_PROMPT}

Estás a apresentar a cerimónia do Jogador do Mês do Society Futebol Nº5 - Futebol Bonfim.

Regras:
- Máximo 500 caracteres
- Em pt-PT informal com slang e muito entusiasmo
- É como se fosses o apresentador de um prémio de gala
- Exagera nos elogios ao vencedor
- Menciona as estatísticas de forma engraçada
- Faz uma "entrevista" fictícia com o jogador
- Usa muitos emojis
- O tom deve ser de gala de futebol but com humor`,
      },
      {
        role: 'user',
        content: `Jogador do Mês: ${playerName}
Mês: ${monthStr} ${stats.year}
Estatísticas:
- ${stats.gamesPlayed} jogos
- ${stats.mvpCount} MVP${stats.mvpCount !== 1 ? 's' : ''}
- Rating médio: ${stats.avgRating}
- ${stats.goals} golo${stats.goals !== 1 ? 's' : ''}

Faz o discurso de entrega do prémio!`,
      },
    ], 1.2);

    return (speech || '').trim().slice(0, 500);
  } catch (error) {
    console.error('Error generating player of month speech:', error);
    return `O prémio de Jogador do Mês vai para... ${playerName}! Parabéns! 🏆🎉`;
  }
}
