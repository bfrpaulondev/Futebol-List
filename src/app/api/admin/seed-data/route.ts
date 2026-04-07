import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { BADGE_DEFINITIONS } from '@/lib/badges';

// Prevent concurrent seeding
let _seeding = false;

export async function POST(request: Request) {
  try {
    const payload = await getUserFromCookie();
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (payload.role !== 'admin' && payload.role !== 'master') {
      return NextResponse.json({ error: 'Apenas admins podem fazer seed' }, { status: 403 });
    }

    if (_seeding) {
      return NextResponse.json({ error: 'Seed já em curso. Aguarda...' }, { status: 429 });
    }

    _seeding = true;

    try {
      const result = await seedDemoData();
      return NextResponse.json({ success: true, ...result });
    } finally {
      _seeding = false;
    }
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Erro no seed: ' + error.message }, { status: 500 });
  }
}

// ==================== HELPERS ====================
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getSaturdays(startDate: Date, endDate: Date): Date[] {
  const saturdays: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    if (current.getDay() === 6) {
      const d = new Date(current);
      d.setHours(randomInt(18, 21), 0, 0, 0);
      saturdays.push(d);
    }
    current.setDate(current.getDate() + 1);
  }
  return saturdays;
}

// ==================== TEMPLATES ====================
const CHRONICLE_TEMPLATES = [
  "Noite memorável no Pavilhão Municipal! {teamAScore}x{teamBScore} com destaque para {mvpName}, que mostrou porque é referência.",
  "Futebol de alta qualidade nesta jornada! {mvpName} foi o grande destaque. Resultado: {teamAScore}x{teamBScore}.",
  "Jogo renhido e emocionante: {teamAScore}x{teamBScore}. {mvpName} liderou com garra e determinação.",
  "Noite de grandes emoções! {teamAScore}x{teamBScore}. {mvpName} provou mais uma vez o seu valor.",
  "Palestrinha de tirar o fôlego! {teamAScore}x{teamBScore} num jogo cheio de peripécias.",
  "Resultado apertado de {teamAScore}x{teamBScore} mas com muita qualidade! {mvpName} foi decisivo.",
  "Grande noite de futebol! {teamAScore}x{teamBScore}. {mvpName} mereceu o prémio de melhor em campo.",
  "Jogo intenso! {teamAScore}x{teamBScore} com {mvpName} a dominar o meio-campo.",
];

const CHRONICLE_AI_TEMPLATES = [
  "📊 **Resumo IA**: {mvpName} registou {mvpGoals} golo(s) e {mvpAssists} assistência(s). Equipa A com {teamAPossession}% de posse. Total de {totalShots} remates.",
  "📈 **Análise IA**: Jogo com {totalGoals} golos. {mvpName} teve taxa de sucesso de {successRate}%. Velocidade média: {avgSpeed} km/h.",
  "🤖 **Dados IA**: {mvpName} percorreu ~{distance}m. {shotsOnTarget} remates enquadrados. Eficiência ofensiva: {efficiency}%.",
  "📋 **Relatório IA**: {totalGoals} golos, {totalShots} remates, {fouls} faltas. {mvpName} liderou com {mvpGoals} golo(s).",
];

const COMPLAINT_TEMPLATES = [
  "O {againstName} esteve a fazer faltas o jogo todo sem o árbitro marcar nada!",
  "O {againstName} não passava a bola e ficava com ela nos pés.",
  "Falta de desportivismo do {againstName}, xingou várias vezes durante o jogo.",
  "O {againstName} bateu-me de propósito e ninguém viu nada.",
  "O {againstName} fez o golo com a mão e o árbitro não viu!",
  "Queixas sobre o horário - pediram para mudar mas ninguém foi avisado.",
  "O {againstName} estava a jogar demasiado agressivo.",
  "Reclamação sobre as equipas - ficaram desequilibradas.",
  "O {againstName} fez falta grave no último lance e quase causou lesão.",
];

const PALESTRINNA_REPLIES = [
  "Queixa registada! Vamos analisar a situação com cuidado. O desportivismo é fundamental. 🤝",
  "Obrigado por reportar. Vamos falar com os envolvidos. Todos merecem jogar em respeito. 🙏",
  "Registado! Vamos estar mais atentos a esta situação no próximo jogo. 👀",
  "Compreendemos a frustração. Vamos conversar com o jogador em questão. 💪",
  "Queixa anotada! Vamos melhorar a arbitragem nos próximos jogos. ⚽",
];

const WEEKLY_TEMPLATES = [
  "🔥 **Semana {weekNum} em Revista**\n\nMais uma semana fantástica! Tivemos 2 jogos com {totalGoals} golos.\n\n**Destaques:**\n- {topScorer}: goleador com {topGoals} golo(s)\n- {topAssister}: {topAssists} assistências\n- {mvpName}: MVP da semana ({mvpRating}/10)\n\nContinuem assim! 🏆",
  "📊 **Relatório #{weekNum}**\n\n- Jogos: 2 | Golos: {totalGoals} | Média: {avgGoals}/jogo\n\n🥇 {topScorer} ({topGoals} golos)\n🥈 {topAssister} ({topAssists} assistências)\n🥉 {mvpName} (MVP)\n\nIntensidade competitiva a subir! ⚡",
];

const WEEKLY_AI = [
  "🤖 **IA Semana {weekNum}**: Ofensiva {offRating}/10, Defensiva {defRating}/10, Desportivismo {sportRating}/10. Tendência positiva!",
  "📈 **Radar #{weekNum}**: Velocidade {avgSpeed}km/h, Passes {passRate}%, Eficiência {shotEff}%. {mvpName} em destaque.",
];

const SPEECH_TEMPLATES = [
  "Obrigado a todos! Este prémio é de toda a equipa. Vamos continuar! 💪",
  "Grato pelo reconhecimento! A Palestrinha é o melhor momento da semana. 🏆",
  "Surpreendido e feliz! Vamos manter esta energia! ⚽🔥",
  "Obrigado pelo voto de confiança. Prometo continuar a dar o meu melhor! ⭐",
];

// ==================== MAIN SEED ====================
async function seedDemoData() {
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const users = await db.user.findMany();
  const realUsers = users.filter(u => u.id !== 'user-palestrinha-bot');

  if (realUsers.length === 0) {
    throw new Error('Sem utilizadores. Faz login primeiro para criar os users base.');
  }

  // Check if demo data already exists
  const existingStats = await db.gameStat.count();
  if (existingStats > 50) {
    throw new Error('Dados de demo já existem (' + existingStats + ' stats encontrados). Apaga primeiro se quiser re-seed.');
  }

  // 0. ENSURE Badge table has 'name' column (migration fix)
  try {
    await db.$executeRawUnsafe(`ALTER TABLE "Badge" ADD COLUMN "name" TEXT NOT NULL DEFAULT '';`);
  } catch (e: any) {
    // Column already exists - fine
  }

  // 1. SEED BADGES
  const badgeMap = new Map<string, any>();
  for (const def of BADGE_DEFINITIONS) {
    const badge = await db.badge.upsert({
      where: { slug: def.slug },
      create: { slug: def.slug, name: def.name, description: def.description, icon: def.icon, category: def.category, tier: def.tier },
      update: {},
    });
    badgeMap.set(def.slug, badge);
  }

  // 2. CLEAN EXISTING DEMO DATA
  await db.userBadge.deleteMany();
  await db.marketValueEntry.deleteMany();
  await db.playerOfMonth.deleteMany();
  await db.weeklyReview.deleteMany();
  await db.complaint.deleteMany();
  await db.gameStat.deleteMany();
  await db.gameAttendee.deleteMany();
  await db.rating.deleteMany();
  await db.notification.deleteMany();

  // Delete past games but keep future ones
  const pastGames = await db.game.findMany({ where: { date: { lte: today } } });
  if (pastGames.length > 0) {
    await db.game.deleteMany({ where: { id: { in: pastGames.map(g => g.id) } } });
  }

  // 3. GENERATE GAMES
  const saturdays = getSaturdays(threeMonthsAgo, today);
  const gameDates: Date[] = [];
  for (const sat of saturdays) {
    gameDates.push(sat);
    if (Math.random() < 0.3) {
      const wed = new Date(sat);
      wed.setDate(wed.getDate() - 3);
      wed.setHours(randomInt(19, 21), 0, 0, 0);
      gameDates.push(wed);
    }
  }

  const locations = ['Pavilhão Municipal de Setúbal', 'Pavilhão da Baixa da Banheira', 'Pavilhão de Palmela', 'Pavilhão de Monte Belo', 'Pavilhão do Bonfim'];

  const profiles = realUsers.map(u => ({
    user: u,
    baseGoals: u.position === 'ALA' ? 0.8 : u.position === 'PIVO' ? 1.0 : 0.15,
    baseAssists: u.position === 'PIVO' ? 0.6 : 0.3,
    mult: randomFloat(0.6, 1.4),
  }));

  const totals = new Map<string, { goals: number; assists: number; games: number; mvps: number; streak: number; bestStreak: number; rating: number; rCount: number }>();
  for (const u of realUsers) totals.set(u.id, { goals: 0, assists: 0, games: 0, mvps: 0, streak: 0, bestStreak: 0, rating: 0, rCount: 0 });

  const allGames: any[] = [];
  let weekNum = 0;

  for (let gi = 0; gi < gameDates.length; gi++) {
    const gd = gameDates[gi];
    const sA = randomInt(0, 7), sB = randomInt(0, 7);

    const game = await db.game.create({
      data: {
        date: gd,
        location: pick(locations),
        maxPlayers: randomInt(10, 14),
        status: 'played',
        scoreA: sA, scoreB: sB,
        playedAt: gd,
      },
    });
    allGames.push(game);

    const numAtt = randomInt(8, Math.min(12, realUsers.length));
    const attendees = shuffle(realUsers).slice(0, numAtt);
    const teamA = attendees.slice(0, Math.ceil(numAtt / 2));
    const teamB = attendees.slice(Math.ceil(numAtt / 2));

    for (const a of attendees) {
      await db.gameAttendee.create({
        data: { gameId: game.id, userId: a.id, playerType: a.playerType, priority: a.playerType === 'mensalista' ? 1 : 2, status: 'confirmed', arrivedAt: gd },
      });
      const t = totals.get(a.id)!;
      t.games++;
      t.streak++;
      if (t.streak > t.bestStreak) t.bestStreak = t.streak;
    }

    for (const u of realUsers) {
      if (!attendees.find(a => a.id === u.id)) {
        totals.get(u.id)!.streak = 0;
      }
    }

    let gameMvpUser: any = null, gameMvpRating = 0;
    const allRoundStats: any[] = [];

    for (const prof of profiles) {
      if (!attendees.find(a => a.id === prof.user.id)) continue;
      const team = teamA.find(u => u.id === prof.user.id) ? 'A' : 'B';

      let goals = 0;
      const gr = Math.random() * prof.baseGoals * prof.mult;
      if (gr > 0.5) goals = 1;
      if (gr > 1.0) goals = 2;
      if (gr > 1.5) goals = 3;
      if (goals) totals.get(prof.user.id)!.goals += goals;

      let assists = 0;
      const ar = Math.random() * prof.baseAssists * prof.mult;
      if (ar > 0.6) assists = 1;
      if (ar > 1.2) assists = 2;
      if (assists) totals.get(prof.user.id)!.assists += assists;

      const ownGoals = Math.random() > 0.95 ? 1 : 0;
      const rating = randomFloat(3.5, 9.5);

      const stat = await db.gameStat.create({
        data: { gameId: game.id, userId: prof.user.id, goals, assists, ownGoals, team },
      });

      allRoundStats.push({ stat, prof, rating });
    }

    // MVP
    let bestScore = -1, mvpRound = null;
    for (const s of allRoundStats) {
      const sc = s.rating + s.stat.goals * 0.5 + s.stat.assists * 0.3;
      if (sc > bestScore) { bestScore = sc; mvpRound = s; }
    }
    if (mvpRound) {
      await db.gameStat.update({ where: { id: mvpRound.stat.id }, data: { isMvp: true } });
      await db.game.update({ where: { id: game.id }, data: { mvpId: mvpRound.prof.user.id } });
      gameMvpUser = mvpRound.prof.user;
      gameMvpRating = mvpRound.rating;
      totals.get(mvpRound.prof.user.id)!.mvps++;
    }

    const mvName = gameMvpUser?.name || 'N/A';
    const mvGoals = mvpRound?.stat.goals || 0;
    const mvAssists = mvpRound?.stat.assists || 0;

    await db.game.update({
      where: { id: game.id },
      data: {
        chronicle: pick(CHRONICLE_TEMPLATES).replace('{teamAScore}', String(sA)).replace('{teamBScore}', String(sB)).replace('{mvpName}', mvName),
        chronicleAi: pick(CHRONICLE_AI_TEMPLATES)
          .replace('{mvpName}', mvName).replace('{mvpGoals}', String(mvGoals)).replace('{mvpAssists}', String(mvAssists))
          .replace('{teamAPossession}', String(randomInt(40, 60))).replace('{totalShots}', String(randomInt(8, 25)))
          .replace('{totalGoals}', String(sA + sB)).replace('{successRate}', String(randomInt(60, 95)))
          .replace('{avgSpeed}', String(randomFloat(4.5, 8.0, 1))).replace('{keyPasses}', String(randomInt(5, 20)))
          .replace('{distance}', String(randomInt(3000, 7000))).replace('{shotsOnTarget}', String(randomInt(4, 15)))
          .replace('{efficiency}', String(randomInt(20, 60))).replace('{fouls}', String(randomInt(5, 20))),
      },
    });

    // Ratings
    const rAgg = new Map<string, { sum: number; count: number }>();
    for (const a of attendees) rAgg.set(a.id, { sum: 0, count: 0 });

    for (const rater of attendees) {
      for (const rated of attendees) {
        if (rater.id === rated.id || Math.random() < 0.2) continue;
        const scores = { technique: randomInt(3, 10), passing: randomInt(3, 10), defense: randomInt(3, 10), attack: randomInt(3, 10), stamina: randomInt(3, 10), teamplay: randomInt(3, 10) };
        try {
          await db.rating.create({ data: { gameId: game.id, raterId: rater.id, ratedPlayerId: rated.id, scoresJson: JSON.stringify(scores) } });
          const avg = (scores.technique + scores.passing + scores.defense + scores.attack + scores.stamina + scores.teamplay) / 6;
          const r = rAgg.get(rated.id)!;
          r.sum += avg; r.count++;
        } catch { /* unique constraint */ }
      }
    }

    for (const [uid, r] of rAgg) {
      if (r.count > 0) { const t = totals.get(uid)!; t.rating += r.sum; t.rCount += r.count; }
    }

    // Messages
    const msgTemplates = ['Boa jogo rapazes! 🔥', 'Vamos lá dar o nosso máximo!', 'Que jogo incrível!', 'Goloasso! ⚽⚽', 'Bom jogo a todos', 'Grande defesa!', 'Que remate! 💥', 'Ainda dá tempo de virar!', 'Foi um jogo épico!'];
    for (let m = 0; m < randomInt(3, 7); m++) {
      const author = pick(attendees);
      const md = new Date(gd); md.setMinutes(md.getMinutes() + randomInt(-30, 90));
      await db.message.create({ data: { content: pick(msgTemplates), type: 'text', channel: 'general', authorId: author.id, createdAt: md } });
    }

    // Weekly review every 2 games
    if ((gi + 1) % 2 === 0) {
      weekNum++;
      const prevGame = allGames[allGames.length - 2];
      const topS = allRoundStats.reduce((b, s) => s.stat.goals > (b?.stat.goals || 0) ? s : b, allRoundStats[0]);
      const topA = allRoundStats.reduce((b, s) => s.stat.assists > (b?.stat.assists || 0) ? s : b, allRoundStats[0]);
      const totalG = allRoundStats.reduce((s, x) => s + x.stat.goals, 0);

      await db.weeklyReview.create({
        data: {
          weekStart: new Date(prevGame.date),
          weekEnd: new Date(gd),
          content: pick(WEEKLY_TEMPLATES).replace('{weekNum}', String(weekNum)).replace('{totalGoals}', String(totalG))
            .replace('{topScorer}', topS.prof.user.name).replace('{topGoals}', String(topS.stat.goals))
            .replace('{topAssister}', topA.prof.user.name).replace('{topAssists}', String(topA.stat.assists))
            .replace('{mvpName}', mvName).replace('{mvpRating}', gameMvpRating.toFixed(1)).replace('{avgGoals}', (totalG / 2).toFixed(1)),
          aiContent: pick(WEEKLY_AI).replace('{weekNum}', String(weekNum))
            .replace('{offRating}', String(randomInt(5, 9))).replace('{defRating}', String(randomInt(5, 9)))
            .replace('{sportRating}', String(randomInt(6, 10))).replace('{avgSpeed}', String(randomFloat(5.0, 7.5, 1)))
            .replace('{passRate}', String(randomInt(65, 90))).replace('{shotEff}', String(randomInt(25, 55))).replace('{mvpName}', mvName),
          statsJson: JSON.stringify({ gamesPlayed: 2, totalGoals: totalG, topScorer: topS.prof.user.name, topAssister: topA.prof.user.name, mvp: mvName, avgAttendance: numAtt }),
        },
      });
    }

    // Complaints (~40%)
    if (Math.random() < 0.4 && attendees.length >= 4) {
      const complainant = pick(attendees);
      const against = pick(attendees.filter(u => u.id !== complainant.id));
      await db.complaint.create({
        data: {
          gameId: game.id,
          complainantId: complainant.id,
          againstId: against.id,
          description: pick(COMPLAINT_TEMPLATES).replace('{againstName}', against.name),
          category: pick(['agressao', 'falta-desportivismo', 'trapaca', 'equipas', 'horario']),
          palestrinhaReply: pick(PALESTRINNA_REPLIES),
          createdAt: new Date(gd.getTime() + randomInt(3600000, 86400000)),
        },
      });
    }

    // Notifications
    for (const a of attendees) {
      if (Math.random() < 0.7) {
        const nd = new Date(gd); nd.setDate(nd.getDate() - 1);
        await db.notification.create({ data: { userId: a.id, type: 'game_reminder', title: '⏰ Lembrete', message: `Jogo amanhã às ${gd.getHours()}:00!`, read: Math.random() < 0.6, createdAt: nd } });
      }
      if (Math.random() < 0.7) {
        const nd = new Date(gd); nd.setHours(nd.getHours() + 2);
        await db.notification.create({ data: { userId: a.id, type: 'game_result', title: '📊 Resultado', message: `${sA}x${sB}. MVP: ${mvName}`, read: Math.random() < 0.4, createdAt: nd } });
      }
    }
  }

  // 4. PLAYER OF THE MONTH
  const months = [];
  for (let i = 2; i >= 1; i--) {
    const d = new Date(today); d.setMonth(d.getMonth() - i);
    months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }

  for (const mi of months) {
    const mGames = allGames.filter(g => { const d = new Date(g.date); return d.getMonth() + 1 === mi.month && d.getFullYear() === mi.year; });
    if (!mGames.length) continue;

    const mStats = await db.gameStat.findMany({ where: { gameId: { in: mGames.map(g => g.id) } } });
    const agg = new Map<string, { goals: number; assists: number; mvps: number; games: number }>();
    for (const s of mStats) {
      if (!agg.has(s.userId)) agg.set(s.userId, { goals: 0, assists: 0, mvps: 0, games: 0 });
      const p = agg.get(s.userId)!;
      p.goals += s.goals; p.assists += s.assists; if (s.isMvp) p.mvps++; p.games++;
    }

    let bestUid: string | null = null, bestSc = -1, bestSt = { goals: 0, assists: 0, mvps: 0, games: 0 };
    for (const [uid, p] of agg) {
      const sc = p.goals * 2 + p.assists * 1.5 + p.mvps * 3;
      if (sc > bestSc) { bestSc = sc; bestUid = uid; bestSt = p; }
    }

    if (bestUid) {
      try {
        await db.playerOfMonth.create({
          data: { userId: bestUid, month: mi.month, year: mi.year, mvpCount: bestSt.mvps, avgRating: randomFloat(6, 8.5), gamesPlayed: bestSt.games, goals: bestSt.goals, speech: pick(SPEECH_TEMPLATES) },
        });
      } catch { /* unique month/year */ }
    }
  }

  // 5. MARKET VALUE HISTORY
  for (const u of realUsers) {
    let val = randomFloat(2.0, 5.0);
    const numEntries = randomInt(6, 10);
    const interval = 90 / numEntries;

    for (let i = 0; i < numEntries; i++) {
      const ed = new Date(today); ed.setDate(ed.getDate() - Math.round(interval * (numEntries - i)));
      val = Math.max(1.0, Math.min(15.0, val + (Math.random() - 0.4) * 0.8));

      await db.marketValueEntry.create({
        data: { userId: u.id, value: parseFloat(val.toFixed(2)), reason: pick(['Ajuste semanal', 'Boa performance', 'Golos marcados', 'Presença consistente', 'MVP recente', 'Evolução técnica']), createdAt: ed },
      });
    }
  }

  // 6. AWARD BADGES
  let badgeCount = 0;
  for (const u of realUsers) {
    const t = totals.get(u.id)!;
    const slugs: string[] = [];
    if (t.streak >= 5) slugs.push('fogo');
    if (t.streak >= 20) slugs.push('diamante');
    if (t.goals >= 1) slugs.push('primeiro-golo');
    if (t.goals >= 10) slugs.push('goleador-10');
    if (t.assists >= 5) slugs.push('assistente-10');
    if (t.mvps >= 1) slugs.push('primeiro-mvp');
    if (t.mvps >= 3) slugs.push('mvp-5x');

    for (const slug of slugs) {
      const badge = badgeMap.get(slug);
      if (badge) {
        try {
          await db.userBadge.create({ data: { userId: u.id, badgeId: badge.id, earnedAt: new Date(today.getTime() - randomInt(86400000, 7776000000)), gameContext: `Conquistado após ${t.games} jogos` } });
          badgeCount++;
        } catch { /* unique */ }
      }
    }
  }

  // 7. UPDATE USER TOTALS
  const complaints = await db.complaint.findMany();
  const cBy = new Map<string, number>(), cAg = new Map<string, number>();
  for (const c of complaints) { cBy.set(c.complainantId, (cBy.get(c.complainantId) || 0) + 1); cAg.set(c.againstId, (cAg.get(c.againstId) || 0) + 1); }

  for (const u of realUsers) {
    const t = totals.get(u.id)!;
    const avgR = t.rCount > 0 ? parseFloat((t.rating / t.rCount).toFixed(2)) : 5.0;
    let mv = 2.0 + (avgR / 10) * 3.0 + Math.min(t.goals * 0.03, 1.5) + Math.min(t.assists * 0.02, 1.0) + Math.min(t.mvps * 0.15, 2.0);
    if (t.streak >= 5) mv += 0.15; if (t.streak >= 10) mv += 0.3;
    mv = Math.max(1.0, Math.min(15.0, parseFloat(mv.toFixed(2))));

    await db.user.update({
      where: { id: u.id },
      data: { totalGoals: t.goals, totalAssists: t.assists, gamesPlayed: t.games, mvpCount: t.mvps, consecutiveGames: t.streak, bestStreak: t.bestStreak, overallRating: avgR, marketValue: mv, complaintsFiled: cBy.get(u.id) || 0, complaintsReceived: cAg.get(u.id) || 0 },
    });
  }

  // 8. TRANSACTIONS
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  for (let m = 0; m < 3; m++) {
    const md = new Date(today); md.setMonth(md.getMonth() - (2 - m));
    const mn = monthNames[md.getMonth()];

    for (const u of realUsers) {
      await db.transaction.create({
        data: { type: 'receita', amount: randomFloat(15, 25), category: 'mensalidade', description: `Mensalidade ${u.name} - ${mn}`, isPaid: Math.random() < 0.7, paidAt: Math.random() < 0.7 ? new Date(md.getFullYear(), md.getMonth(), randomInt(1, 15)) : null, createdAt: new Date(md.getFullYear(), md.getMonth(), 1) },
      });
    }
    await db.transaction.create({ data: { type: 'despesa', amount: randomFloat(30, 60), category: 'pavilhao', description: `Aluguer do pavilhão - ${mn}`, isPaid: true, paidAt: new Date(md.getFullYear(), md.getMonth(), 5), createdAt: new Date(md.getFullYear(), md.getMonth(), 1) } });
    await db.transaction.create({ data: { type: 'despesa', amount: randomFloat(5, 15), category: 'agua', description: `Água - ${mn}`, isPaid: true, createdAt: new Date(md.getFullYear(), md.getMonth(), 1) } });

    if (Math.random() < 0.6) {
      const fp = pick(realUsers);
      await db.transaction.create({ data: { type: 'receita', amount: 5, category: 'multa', description: `Multa ${fp.name} - ${mn}`, isPaid: Math.random() < 0.5, createdAt: new Date(md.getFullYear(), md.getMonth(), randomInt(1, 20)) } });
    }
  }

  // 9. SUGGESTIONS
  const sugData = [
    { title: 'Comprar coletes novos', description: 'Os coletes atuais estão gastos. Precisamos de um novo conjunto com cores diferentes.', estimatedCost: 35, category: 'equipamento' },
    { title: 'Organizar torneio mensal', description: 'Torneio no último sábado de cada mês com prémios para o vencedor.', estimatedCost: 20, category: 'evento' },
    { title: 'Atualizar bolas', description: 'As bolas perderam pressão e estão desgastadas.', estimatedCost: 40, category: 'equipamento' },
    { title: 'Contratar árbitro fixo', description: 'Árbitro fixo melhoraria a qualidade e reduziria queixas.', estimatedCost: 50, category: 'organização' },
    { title: 'Canal do YouTube', description: 'Gravar jogos e criar highlights.', estimatedCost: 15, category: 'marketing' },
  ];

  for (let i = 0; i < sugData.length; i++) {
    const s = sugData[i];
    await db.suggestion.create({
      data: { ...s, isPriority: Math.random() < 0.3, votesJson: JSON.stringify(shuffle(realUsers).slice(0, randomInt(2, 8)).map(u => u.id)), votingOpen: true, status: pick(['em-analise', 'aprovada', 'em-analise']), createdById: realUsers[i % realUsers.length].id, createdAt: new Date(today.getTime() - randomInt(2592000000, 7776000000)) },
    });
  }

  // Summary
  const totalGoals = [...totals.values()].reduce((s, t) => s + t.goals, 0);
  const totalAssists = [...totals.values()].reduce((s, t) => s + t.assists, 0);
  const totalMvps = [...totals.values()].reduce((s, t) => s + t.mvps, 0);

  return {
    message: 'Dados de demo de 3 meses criados com sucesso!',
    stats: {
      jogos: gameDates.length,
      golos: totalGoals,
      assistencias: totalAssists,
      mvps: totalMvps,
      badges: badgeCount,
      badgesDisponiveis: BADGE_DEFINITIONS.length,
      weeklyReviews: weekNum,
      queixas: await db.complaint.count(),
      marketValueEntries: await db.marketValueEntry.count(),
      transacoes: await db.transaction.count(),
      sugestoes: sugData.length,
    },
    jogadores: realUsers.map(u => {
      const t = totals.get(u.id)!;
      return { nome: u.name, jogos: t.games, golos: t.goals, assist: t.assists, mvps: t.mvps, streak: t.streak };
    }),
  };
}
