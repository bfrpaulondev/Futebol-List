import { PrismaClient } from '@prisma/client';
import { BADGE_DEFINITIONS } from '../src/lib/badges';

const prisma = new PrismaClient();

// ==================== HELPER FUNCTIONS ====================

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

// ==================== CHRONICLE TEMPLATES ====================

const CHRONICLE_TEMPLATES = [
  "Noite memorável no Pavilhão Municipal! {teamAScore}x{teamBScore} com destaque para {mvpName}, que mostrou porque é referência. O jogo equilibrado manteve todos em suspense até ao apito final.",
  "Futebol de alta qualidade nesta jornada! {mvpName} foi o grande destaque com uma atuação brilhante. Resultado final: {teamAScore}x{teamBScore}. O público presente pode testemunhar um grande espetáculo.",
  "Jogo renhido e emocionante que acabou {teamAScore}x{teamBScore}. {mvpName} liderou o seu plantel com garra e determinação, sendo eleito o MVP da noite. Grande ambiente no pavilhão!",
  "Noite de grandes emoções! Com um resultado de {teamAScore}x{teamBScore}, {mvpName} provou mais uma vez o seu valor em campo. Jogos assim é que fazem a Palestrinha especial.",
  "Palestrinha de tirar o fôlego! {teamAScore}x{teamBScore} num jogo cheio de peripécias. {mvpName} brilhou e levou a melhor, mostrando futebol de qualidade superior ao longo dos minutos.",
  "Resultado apertado de {teamAScore}x{teamBScore} mas com muita qualidade! {mvpName} foi a estrela da noite com uma atuação completa. A rivalidade entre as equipas está cada vez mais intensa!",
  "Grande noite de futebol! {teamAScore}x{teamBScore} reflete a competitividade que existe entre os jogadores. {mvpName} foi decisivo e mereceu o prémio de melhor em campo.",
  "Jogo intenso no Pavilhão Municipal! Resultado final de {teamAScore}x{teamBScore} com {mvpName} a dominar o meio-campo. Mais uma palestrinha que ficará na memória de todos os presentes.",
];

const CHRONICLE_AI_TEMPLATES = [
  "📊 **Resumo IA**: {mvpName} registou {mvpGoals} golo(s) e {mvpAssists} assistência(s). Equipa A com {teamAPossession}% de posse de bola. Total de {totalShots} remates no jogo. A intensidade média foi de {intensity}/10.",
  "📈 **Análise IA**: Jogo com {totalGoals} golos no total. {mvpName} teve uma taxa de sucesso de {successRate}% nos passes. Velocidade média do jogo: {avgSpeed} km/h. Nível técnico elevado com {keyPasses} passes-chave.",
  "🤖 **Dados IA**: {mvpName} percorreu aproximadamente {distance}m em campo. A equipa vencedora teve {shotsOnTarget} remates enquadrados de um total de {totalShots}. Eficiência ofensiva de {efficiency}%.",
  "📋 **Relatório IA**: Partida com {totalGoals} golos, {totalShots} remates e {fouls} faltas. {mvpName} liderou com {mvpGoals} golo(s). Posse equilibrada entre as duas equipas. Jogo limpo com poucas interrupções.",
];

const COMPLAINT_TEMPLATES = [
  "O {againstName} esteve a fazer faltas o jogo todo sem o árbitro marcar nada!",
  "O {againstName} não passava a bola e ficava com ela nos pés.",
  "Falta de desportivismo do {againstName}, xingou várias vezes durante o jogo.",
  "O {againstName} bateu-me de propósito e ninguém viu nada.",
  "O {againstName} fez o golo com a mão e o árbitro não viu!",
  "Queixas sobre o horário - pediram para mudar mas ninguém foi avisado a tempo.",
  "O {againstName} estava a jogar demasiado agressivo, quase todos os duelos eram faltas.",
  "Reclamação sobre as equipas - ficaram desequilibradas, uma tinha jogadores muito mais fortes.",
  "O {againstName} fez falta grave no último lance e quase causou lesão.",
  "O {againstName} não respeitou as regras do jogo e tentou fazer trapaças várias vezes.",
];

const COMPLAINT_CATEGORIES = ['agressao', 'falta-desportivismo', 'trapaca', 'equipas', 'horario', 'outro'];

const PALESTRINHA_REPLIES = [
  "Queixa registada! Vamos analisar a situação com cuidado. O desportivismo é fundamental na nossa Palestrinha. 🤝",
  "Obrigado por reportar. Vamos falar com os envolvidos e tomar as medidas necessárias. Todos merecem jogar em respeito. 🙏",
  "Registado! A Palestrinha é para todos desfrutarem. Vamos estar mais atentos a esta situação no próximo jogo. 👀",
  "Compreendemos a frustração. Vamos conversar com o jogador em questão. O respeito mútuo é o nosso valor principal! 💪",
  "Queixa anotada! Prometemos que vamos melhorar a arbitragem nos próximos jogos. Contamos com a compreensão de todos. ⚽",
  "Vamos tratar disto! A competição saudável é o que nos move. Obrigado por contribuir para um ambiente melhor. 🏆",
];

const WEEKLY_REVIEW_TEMPLATES = [
  "🔥 **Semana {weekNum} em Revista**\n\nMais uma semana fantástica na Palestrinha! Tivemos {gamesCount} jogo(s) com um total de {totalGoals} golos marcados.\n\n**Destaques:**\n- {topScorer} foi o goleador da semana com {topGoals} golo(s)\n- {topAssister} liderou em assistências com {topAssists}\n- {mvpName} foi eleito MVP com uma atuação de nota {mvpRating}/10\n\nA média de golos por jogo foi de {avgGoals}, mostrando o nível ofensivo dos nossos jogadores. A presença média foi de {avgAttendance} jogadores por jogo.\n\nContinuem assim! 🏆",
  "📊 **Relatório Semanal #{weekNum}**\n\nResumo da semana:\n- Jogos realizados: {gamesCount}\n- Total de golos: {totalGoals}\n- Média de golos/jogo: {avgGoals}\n- Presença média: {avgAttendance} jogadores\n\n**Top Performers:**\n🥇 {topScorer} - {topGoals} golos\n🥈 {topAssister} - {topAssists} assistências\n🥉 {mvpName} - MVP da semana\n\nA intensidade competitiva continua a subir! Os jogadores estão cada vez mais empenhados. Próxima semana promete! ⚡",
  "⚽ **Revista da Semana {weekNum}**\n\n{gamesCount} jogo(s) realizado(s) nesta semana com {totalGoals} golos no total!\n\n**Estatísticas:**\n- Goleador: {topScorer} ({topGoals} golos)\n- Melhor passador: {topAssister} ({topAssists} assistências)\n- MVP: {mvpName} ({mvpRating}/10)\n- Presença média: {avgAttendance}/jogadores\n\nA qualidade do futebol praticado tem sido notável. Os números falam por si - média de {avgGoals} golos por jogo! 👏",
];

const WEEKLY_AI_TEMPLATES = [
  "🤖 **Análise IA da Semana {weekNum}**\n\nBaseado nos dados recolhidos:\n- Performance ofensiva: {offensiveRating}/10\n- Performance defensiva: {defensiveRating}/10\n- Espírito desportivo: {sportsmanshipRating}/10\n- Nível técnico médio: {technicalRating}/10\n\n**Observações:**\nA tendência de melhoria é positiva. {topScorer} mostrou consistência ofensiva. Recomendo atenção à disciplina defensiva nas próximas semanas.",
  "📈 **Radar IA - Semana {weekNum}**\n\nApós análise dos {gamesCount} jogo(s):\n- Velocidade de jogo: {avgSpeed}km/h (média)\n- Taxa de passes certos: {passRate}%\n- Eficiência de remate: {shotEfficiency}%\n\nO nível técnico subiu comparativamente à semana anterior. Destaque para a evolução de {mvpName} em várias métricas.",
];

const PLAYER_SPEECH_TEMPLATES = [
  "Queria agradecer a todos os colegas pelo prémio! É uma honra ser escolhido Jogador do Mês. Vamos continuar a dar o nosso melhor em cada jogo! 💪",
  "Obrigado a todos! Este prémio é de toda a equipa. Sem os meus companheiros, nada disto seria possível. Próximo mês vamos com tudo! 🏆",
  "Fico muito feliz com este reconhecimento! A Palestrinha é o melhor momento da minha semana. Vamos manter esta energia! ⚽🔥",
  "Surpreendido e grato! Estou a dar o meu melhor em cada jogo e ver que isso é reconhecido motiva-me ainda mais. Obrigado a todos! 🙏",
  "Mais um mês incrível na Palestrinha! Obrigado pelo voto de confiança. Prometo continuar a trabalhar duro para ajudar a equipa! ⭐",
];

// ==================== MAIN SEED FUNCTION ====================

async function seed3Months() {
  console.log('🌱 Iniciando seed de 3 meses de dados...');

  // Clean new tables (keep users and the next game)
  const allGames = await prisma.game.findMany({ orderBy: { date: 'asc' } });

  // Find the "future" game (the one already in the seed) - keep it
  const futureGames = allGames.filter(g => g.date > new Date());
  const pastGamesToDelete = allGames.filter(g => g.date <= new Date());

  console.log(`Found ${futureGames.length} future games to keep, ${pastGamesToDelete.length} past games to replace`);

  // Delete everything in reverse dependency order
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.marketValueEntry.deleteMany();
  await prisma.playerOfMonth.deleteMany();
  await prisma.weeklyReview.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.gameStat.deleteMany();
  await prisma.gameAttendee.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();

  // Delete past games
  if (pastGamesToDelete.length > 0) {
    await prisma.game.deleteMany({
      where: { id: { in: pastGamesToDelete.map(g => g.id) } },
    });
  }

  // Get all users
  const users = await prisma.user.findMany();
  console.log(`📊 Found ${users.length} users`);

  if (users.length === 0) {
    console.error('❌ No users found! Run the basic seed first.');
    return;
  }

  // ==================== 1. SEED BADGES ====================
  console.log('\n🏅 Seeding badges...');
  const badgeMap: Map<string, any> = new Map();

  for (const badgeDef of BADGE_DEFINITIONS) {
    const badge = await prisma.badge.create({
      data: {
        slug: badgeDef.slug,
        name: badgeDef.name,
        description: badgeDef.description,
        icon: badgeDef.icon,
        category: badgeDef.category,
        tier: badgeDef.tier,
      },
    });
    badgeMap.set(badgeDef.slug, badge);
  }
  console.log(`✅ ${BADGE_DEFINITIONS.length} badges created`);

  // ==================== 2. GENERATE 3 MONTHS OF GAMES ====================
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const saturdays = getSaturdays(threeMonthsAgo, today);
  console.log(`\n📅 Found ${saturdays.length} Saturdays in the last 3 months`);

  // Create games (some weeks have 2 games - Wednesday + Saturday)
  const gameDates: Date[] = [];
  for (const sat of saturdays) {
    gameDates.push(sat);
    // ~30% chance of a second game (Wednesday)
    if (Math.random() < 0.3) {
      const wed = new Date(sat);
      wed.setDate(wed.getDate() - 3);
      wed.setHours(randomInt(19, 21), 0, 0, 0);
      gameDates.push(wed);
    }
  }

  console.log(`📅 Creating ${gameDates.length} games...`);

  // Performance profiles for each player
  const playerProfiles = users.map((user, i) => ({
    user,
    attackBias: user.position === 'ALA' ? 0.8 : user.position === 'PIVO' ? 0.6 : 0.3,
    defenseBias: user.position === 'DEF' ? 0.7 : user.position === 'GR' ? 0.9 : 0.3,
    assistBias: user.position === 'PIVO' ? 0.7 : 0.4,
    baseGoalsPerGame: user.position === 'ALA' ? 0.8 : user.position === 'PIVO' ? 1.0 : 0.15,
    baseAssistsPerGame: user.position === 'PIVO' ? 0.6 : 0.3,
    overallMultiplier: randomFloat(0.6, 1.4), // Makes some players consistently better
  }));

  const allCreatedGames: any[] = [];
  const userTotals: Map<string, { goals: number; assists: number; games: number; mvps: number; consecutiveGames: number; bestStreak: number; rating: number; ratingsCount: number }> = new Map();

  // Initialize totals
  for (const user of users) {
    userTotals.set(user.id, {
      goals: 0, assists: 0, games: 0, mvps: 0,
      consecutiveGames: 0, bestStreak: 0,
      rating: 0, ratingsCount: 0,
    });
  }

  let weekNum = 0;

  for (let gi = 0; gi < gameDates.length; gi++) {
    const gameDate = gameDates[gi];

    // Random score
    const scoreA = randomInt(0, 7);
    const scoreB = randomInt(0, 7);

    // Generate chronicle
    const locations = [
      'Pavilhão Municipal de Setúbal',
      'Pavilhão da Baixa da Banheira',
      'Pavilhão de Palmela',
      'Pavilhão de Monte Belo',
      'Pavilhão do Bonfim',
    ];

    const game = await prisma.game.create({
      data: {
        date: gameDate,
        location: pick(locations),
        maxPlayers: randomInt(10, 14),
        status: 'played',
        scoreA,
        scoreB,
        playedAt: gameDate,
        ratingsOpen: false,
      },
    });

    allCreatedGames.push(game);

    // Pick attendees (shuffle and take 10-12)
    const numAttendees = randomInt(8, Math.min(12, users.length));
    const shuffledUsers = shuffle(users);
    const attendees = shuffledUsers.slice(0, numAttendees);

    // Split into teams
    const teamA = attendees.slice(0, Math.ceil(numAttendees / 2));
    const teamB = attendees.slice(Math.ceil(numAttendees / 2));

    // Create attendees
    for (const attendee of attendees) {
      await prisma.gameAttendee.create({
        data: {
          gameId: game.id,
          userId: attendee.id,
          playerType: attendee.playerType,
          priority: attendee.playerType === 'mensalista' ? 1 : 2,
          status: 'confirmed',
          arrivedAt: gameDate,
        },
      });

      // Update consecutive games
      const totals = userTotals.get(attendee.id)!;
      totals.games++;
      totals.consecutiveGames++;
      if (totals.consecutiveGames > totals.bestStreak) {
        totals.bestStreak = totals.consecutiveGames;
      }
    }

    // Track who didn't attend (reset streak)
    for (const user of users) {
      if (!attendees.find(a => a.id === user.id)) {
        const totals = userTotals.get(user.id)!;
        totals.consecutiveGames = 0;
      }
    }

    // Create game stats
    let gameMvp: any = null;
    let gameMvpRating = 0;
    const allStats: any[] = [];

    for (const profile of playerProfiles) {
      if (!attendees.find(a => a.id === profile.user.id)) continue;

      const team = teamA.find(u => u.id === profile.user.id) ? 'A' : 'B';

      // Goals
      let goals = 0;
      const goalRoll = Math.random() * profile.baseGoalsPerGame * profile.overallMultiplier;
      if (goalRoll > 0.5) goals = 1;
      if (goalRoll > 1.0) goals = 2;
      if (goalRoll > 1.5) goals = 3; // Hat-trick chance
      if (goals > 0) {
        const totals = userTotals.get(profile.user.id)!;
        totals.goals += goals;
      }

      // Assists
      let assists = 0;
      const assistRoll = Math.random() * profile.baseAssistsPerGame * profile.overallMultiplier;
      if (assistRoll > 0.6) assists = 1;
      if (assistRoll > 1.2) assists = 2;
      if (assists > 0) {
        const totals = userTotals.get(profile.user.id)!;
        totals.assists += assists;
      }

      // Own goals (rare)
      const ownGoals = Math.random() > 0.95 ? 1 : 0;

      // Calculate rating for this game
      const rating = randomFloat(3.5, 9.5);

      const isMvp = false; // Will set after
      const stat = await prisma.gameStat.create({
        data: {
          gameId: game.id,
          userId: profile.user.id,
          goals,
          assists,
          ownGoals,
          team,
          isMvp,
        },
      });

      allStats.push({ stat, profile, rating, team });
    }

    // Pick MVP (highest rating with bonus for goals/assists)
    let bestMvpScore = -1;
    let mvpStat = null;
    for (const s of allStats) {
      const mvpScore = s.rating + s.stat.goals * 0.5 + s.stat.assists * 0.3;
      if (mvpScore > bestMvpScore) {
        bestMvpScore = mvpScore;
        mvpStat = s;
      }
    }

    if (mvpStat) {
      await prisma.gameStat.update({
        where: { id: mvpStat.stat.id },
        data: { isMvp: true },
      });
      await prisma.game.update({
        where: { id: game.id },
        data: { mvpId: mvpStat.profile.user.id },
      });
      gameMvp = mvpStat.profile.user;
      gameMvpRating = mvpStat.rating;
      const totals = userTotals.get(mvpStat.profile.user.id)!;
      totals.mvps++;
    }

    // Generate chronicle
    const mvpName = gameMvp?.name || 'Jogador anónimo';
    const chronicle = pick(CHRONICLE_TEMPLATES)
      .replace('{teamAScore}', String(scoreA))
      .replace('{teamBScore}', String(scoreB))
      .replace('{mvpName}', mvpName);

    const mvpGoals = mvpStat?.stat.goals || 0;
    const mvpAssists = mvpStat?.stat.assists || 0;
    const totalGoals = scoreA + scoreB;
    const chronicleAi = pick(CHRONICLE_AI_TEMPLATES)
      .replace('{mvpName}', mvpName)
      .replace('{mvpGoals}', String(mvpGoals))
      .replace('{mvpAssists}', String(mvpAssists))
      .replace('{teamAPossession}', String(randomInt(40, 60)))
      .replace('{totalShots}', String(randomInt(8, 25)))
      .replace('{intensity}', String(randomInt(6, 10)))
      .replace('{successRate}', String(randomInt(60, 95)))
      .replace('{avgSpeed}', String(randomFloat(4.5, 8.0, 1)))
      .replace('{keyPasses}', String(randomInt(5, 20)))
      .replace('{distance}', String(randomInt(3000, 7000)))
      .replace('{shotsOnTarget}', String(randomInt(4, 15)))
      .replace('{efficiency}', String(randomInt(20, 60)))
      .replace('{fouls}', String(randomInt(5, 20)))
      .replace('{totalGoals}', String(totalGoals));

    await prisma.game.update({
      where: { id: game.id },
      data: { chronicle, chronicleAi },
    });

    // Create ratings between players
    const ratingsCreated: Map<string, { sum: number; count: number }> = new Map();
    for (const attendee of attendees) {
      ratingsCreated.set(attendee.id, { sum: 0, count: 0 });
    }

    for (const rater of attendees) {
      for (const rated of attendees) {
        if (rater.id === rated.id) continue;
        if (Math.random() < 0.2) continue; // Not everyone rates everyone

        const scores = {
          technique: randomInt(3, 10),
          passing: randomInt(3, 10),
          defense: randomInt(3, 10),
          attack: randomInt(3, 10),
          stamina: randomInt(3, 10),
          teamplay: randomInt(3, 10),
        };

        await prisma.rating.create({
          data: {
            gameId: game.id,
            raterId: rater.id,
            ratedPlayerId: rated.id,
            scoresJson: JSON.stringify(scores),
          },
        });

        const avg = (scores.technique + scores.passing + scores.defense + scores.attack + scores.stamina + scores.teamplay) / 6;
        const r = ratingsCreated.get(rated.id)!;
        r.sum += avg;
        r.count++;
      }
    }

    // Update user ratings
    for (const [userId, r] of ratingsCreated) {
      if (r.count > 0) {
        const totals = userTotals.get(userId)!;
        totals.rating += r.sum;
        totals.ratingsCount += r.count;
      }
    }

    // Create some messages for the game
    const messageTemplates = [
      'Boa jogo rapazes! 🔥',
      'Vamos lá dar o nosso melhor!',
      'Quem vai hoje? 🏃',
      'Que jogo incrível!',
      'Goloasso! ⚽⚽',
      'Bom jogo a todos',
      'A equipa A está a dominar!',
      'Grande defesa!',
      'Que remate! 💥',
      'Ainda estamos a tempo de virar!',
    ];

    for (let m = 0; m < randomInt(3, 8); m++) {
      const author = pick(attendees);
      const msgDate = new Date(gameDate);
      msgDate.setMinutes(msgDate.getMinutes() + randomInt(-30, 90));

      await prisma.message.create({
        data: {
          content: pick(messageTemplates),
          type: 'text',
          channel: 'general',
          authorId: author.id,
          createdAt: msgDate,
        },
      });
    }

    // Weekly review (every 2 games)
    if ((gi + 1) % 2 === 0) {
      weekNum++;
      const weekStart = new Date(allCreatedGames[allCreatedGames.length - 2].date);
      const weekEnd = new Date(gameDate);

      const recentStats = allStats;
      const topScorerEntry = recentStats.reduce((best, s) => s.stat.goals > (best?.stat.goals || 0) ? s : best, recentStats[0]);
      const topAssisterEntry = recentStats.reduce((best, s) => s.stat.assists > (best?.stat.assists || 0) ? s : best, recentStats[0]);

      const topScorer = topScorerEntry.profile.user.name;
      const topGoals = topScorerEntry.stat.goals;
      const topAssister = topAssisterEntry.profile.user.name;
      const topAssists = topAssisterEntry.stat.assists;
      const totalWeeklyGoals = recentStats.reduce((sum, s) => sum + s.stat.goals, 0);
      const avgGoals = (totalWeeklyGoals / 2).toFixed(1);

      const reviewContent = pick(WEEKLY_REVIEW_TEMPLATES)
        .replace('{weekNum}', String(weekNum))
        .replace('{gamesCount}', '2')
        .replace('{totalGoals}', String(totalWeeklyGoals))
        .replace('{topScorer}', topScorer)
        .replace('{topGoals}', String(topGoals))
        .replace('{topAssister}', topAssister)
        .replace('{topAssists}', String(topAssists))
        .replace('{mvpName}', mvpName)
        .replace('{mvpRating}', gameMvpRating.toFixed(1))
        .replace('{avgGoals}', avgGoals)
        .replace('{avgAttendance}', String(numAttendees));

      const weeklyAiContent = pick(WEEKLY_AI_TEMPLATES)
        .replace('{weekNum}', String(weekNum))
        .replace('{offensiveRating}', String(randomInt(5, 9)))
        .replace('{defensiveRating}', String(randomInt(5, 9)))
        .replace('{sportsmanshipRating}', String(randomInt(6, 10)))
        .replace('{technicalRating}', String(randomInt(5, 9)))
        .replace('{topScorer}', topScorer)
        .replace('{mvpName}', mvpName)
        .replace('{avgSpeed}', String(randomFloat(5.0, 7.5, 1)))
        .replace('{passRate}', String(randomInt(65, 90)))
        .replace('{shotEfficiency}', String(randomInt(25, 55)))
        .replace('{gamesCount}', '2');

      await prisma.weeklyReview.create({
        data: {
          weekStart,
          weekEnd,
          content: reviewContent,
          aiContent: weeklyAiContent,
          statsJson: JSON.stringify({
            gamesPlayed: 2,
            totalGoals: totalWeeklyGoals,
            avgGoalsPerGame: parseFloat(avgGoals),
            topScorer: { name: topScorer, goals: topGoals },
            topAssister: { name: topAssister, assists: topAssists },
            mvp: { name: mvpName, rating: gameMvpRating },
            avgAttendance: numAttendees,
          }),
        },
      });
    }

    // Occasional complaint (~40% of games)
    if (Math.random() < 0.4 && attendees.length >= 4) {
      const complainant = pick(attendees);
      let against = pick(attendees.filter(u => u.id !== complainant.id));
      const complaint = pick(COMPLAINT_TEMPLATES)
        .replace('{againstName}', against.name);

      await prisma.complaint.create({
        data: {
          gameId: game.id,
          complainantId: complainant.id,
          againstId: against.id,
          description: complaint,
          category: pick(COMPLAINT_CATEGORIES),
          palestrinhaReply: pick(PALESTRINHA_REPLIES),
          createdAt: new Date(gameDate.getTime() + randomInt(3600000, 86400000)),
        },
      });

      // Update complaint counts
      const cTotals = userTotals.get(complainant.id)!;
      const aTotals = userTotals.get(against.id)!;
      // We'll handle complaints count at the end
    }

    // Create notifications for the game
    const notifTypes = [
      { type: 'game_reminder', title: '⏰ Lembrete de Jogo', message: `O jogo de amanhã às ${gameDate.getHours()}:00 está confirmado! Confirma a tua presença.` },
      { type: 'game_result', title: '📊 Resultado do Jogo', message: `Resultado: ${scoreA}x${scoreB}. MVP: ${mvpName}. Parabéns a todos!` },
    ];

    for (const attendee of attendees) {
      for (const notif of notifTypes) {
        if (Math.random() < 0.7) {
          const notifDate = new Date(gameDate);
          if (notif.type === 'game_reminder') {
            notifDate.setDate(notifDate.getDate() - 1);
          } else {
            notifDate.setHours(notifDate.getHours() + 2);
          }
          await prisma.notification.create({
            data: {
              userId: attendee.id,
              type: notif.type,
              title: notif.title,
              message: notif.message,
              read: Math.random() < 0.6,
              createdAt: notifDate,
            },
          });
        }
      }
    }

    if ((gi + 1) % 5 === 0) {
      console.log(`  ✅ ${gi + 1}/${gameDates.length} games processed...`);
    }
  }

  console.log(`✅ ${gameDates.length} games created with full data`);

  // ==================== 3. PLAYER OF THE MONTH ====================
  console.log('\n🌟 Creating Player of the Month entries...');

  const months = [
    { month: today.getMonth() - 2, year: today.getFullYear(), label: 'Mês -2' },
    { month: today.getMonth() - 1, year: today.getFullYear(), label: 'Mês -1' },
  ];

  // Handle year rollover
  for (const m of months) {
    if (m.month < 0) { m.month += 12; m.year--; }
  }

  for (const monthInfo of months) {
    const monthGames = allCreatedGames.filter(g => {
      const d = new Date(g.date);
      return d.getMonth() === monthInfo.month && d.getFullYear() === monthInfo.year;
    });

    if (monthGames.length === 0) continue;

    // Get stats for games in this month
    const monthGameIds = monthGames.map(g => g.id);
    const monthStats = await prisma.gameStat.findMany({
      where: { gameId: { in: monthGameIds } },
      include: { user: true },
    });

    // Find best player
    const playerAgg: Map<string, { goals: number; assists: number; mvps: number; games: number; rating: number }> = new Map();

    for (const stat of monthStats) {
      if (!playerAgg.has(stat.userId)) {
        playerAgg.set(stat.userId, { goals: 0, assists: 0, mvps: 0, games: 0, rating: 0 });
      }
      const p = playerAgg.get(stat.userId)!;
      p.goals += stat.goals;
      p.assists += stat.assists;
      if (stat.isMvp) p.mvps++;
      p.games++;
      p.rating += randomFloat(6, 9);
    }

    let bestPlayer: string | null = null;
    let bestScore = -1;
    let bestStats = { goals: 0, assists: 0, mvps: 0, games: 0, rating: 0 };

    for (const [userId, p] of playerAgg) {
      const score = p.goals * 2 + p.assists * 1.5 + p.mvps * 3 + p.rating;
      if (score > bestScore) {
        bestScore = score;
        bestPlayer = userId;
        bestStats = p;
      }
    }

    if (bestPlayer) {
      const avgRating = bestStats.games > 0 ? parseFloat((bestStats.rating / bestStats.games).toFixed(1)) : 7.0;
      await prisma.playerOfMonth.create({
        data: {
          userId: bestPlayer,
          month: monthInfo.month + 1, // 1-indexed
          year: monthInfo.year,
          mvpCount: bestStats.mvps,
          avgRating,
          gamesPlayed: bestStats.games,
          goals: bestStats.goals,
          speech: pick(PLAYER_SPEECH_TEMPLATES),
        },
      });
      console.log(`  ✅ ${monthInfo.label}: ${users.find(u => u.id === bestPlayer)?.name} (${bestStats.goals} golos, ${bestStats.mvps} MVPs)`);
    }
  }

  // ==================== 4. MARKET VALUE HISTORY ====================
  console.log('\n📈 Creating market value history...');

  for (const user of users) {
    const totals = userTotals.get(user.id)!;
    let currentValue = randomFloat(2.0, 5.0);

    // Create ~8 market value entries over 3 months
    const numEntries = randomInt(6, 10);
    const entryInterval = 90 / numEntries;

    for (let i = 0; i < numEntries; i++) {
      const entryDate = new Date(today);
      entryDate.setDate(entryDate.getDate() - Math.round(entryInterval * (numEntries - i)));

      // Value changes based on player performance at that point
      const change = (Math.random() - 0.4) * 0.8; // Slight upward bias
      currentValue = Math.max(1.0, Math.min(15.0, currentValue + change));

      const reasons = [
        'Ajuste semanal de mercado',
        'Boa performance nos últimos jogos',
        'Golos marcados recentemente',
        'Presença consistente',
        'MVP recente',
        'Ajuste de mercado',
        'Sequência de bons jogos',
        'Evolução técnica notada',
      ];

      await prisma.marketValueEntry.create({
        data: {
          userId: user.id,
          value: parseFloat(currentValue.toFixed(2)),
          reason: pick(reasons),
          createdAt: entryDate,
        },
      });
    }
  }
  console.log(`✅ Market value history created for ${users.length} players`);

  // ==================== 5. AWARD BADGES ====================
  console.log('\n🏅 Awarding badges based on performance...');

  const userBadgeCount = { bronze: 0, silver: 0, gold: 0, platinum: 0, legendary: 0 };

  for (const user of users) {
    const totals = userTotals.get(user.id)!;
    const badgesToAward: string[] = [];

    // Streak badges
    if (totals.consecutiveGames >= 5) badgesToAward.push('fogo');
    if (totals.consecutiveGames >= 20) badgesToAward.push('diamante');

    // Goal badges
    if (totals.goals >= 1) badgesToAward.push('primeiro-golo');
    if (totals.goals >= 10) badgesToAward.push('goleador-10');

    // Assist badges
    if (totals.assists >= 5) badgesToAward.push('assistente-10');

    // MVP badges
    if (totals.mvps >= 1) badgesToAward.push('primeiro-mvp');
    if (totals.mvps >= 3) badgesToAward.push('mvp-5x');

    // Award badges
    for (const slug of badgesToAward) {
      const badge = badgeMap.get(slug);
      if (badge) {
        try {
          await prisma.userBadge.create({
            data: {
              userId: user.id,
              badgeId: badge.id,
              earnedAt: new Date(today.getTime() - randomInt(86400000, 7776000000)),
              gameContext: `Conquistado após ${totals.games} jogos`,
            },
          });
          userBadgeCount[badge.tier as keyof typeof userBadgeCount]++;
        } catch (e) {
          // Ignore unique constraint errors
        }
      }
    }
  }

  console.log(`  ✅ Badges awarded: ${JSON.stringify(userBadgeCount)}`);

  // ==================== 6. UPDATE USER TOTALS ====================
  console.log('\n🔄 Updating user totals...');

  // Count complaints
  const complaints = await prisma.complaint.findMany();
  const complaintsByComplainant: Map<string, number> = new Map();
  const complaintsByAgainst: Map<string, number> = new Map();

  for (const c of complaints) {
    complaintsByComplainant.set(c.complainantId, (complaintsByComplainant.get(c.complainantId) || 0) + 1);
    complaintsByAgainst.set(c.againstId, (complaintsByAgainst.get(c.againstId) || 0) + 1);
  }

  // Update all users
  for (const user of users) {
    const totals = userTotals.get(user.id)!;
    const avgRating = totals.ratingsCount > 0
      ? parseFloat((totals.rating / totals.ratingsCount).toFixed(2))
      : 5.0;

    // Calculate market value
    let marketValue = 2.0 + (avgRating / 10) * 3.0;
    marketValue += Math.min(totals.goals * 0.03, 1.5);
    marketValue += Math.min(totals.assists * 0.02, 1.0);
    marketValue += Math.min(totals.mvps * 0.15, 2.0);
    if (totals.consecutiveGames >= 5) marketValue += 0.15;
    if (totals.consecutiveGames >= 10) marketValue += 0.3;
    marketValue += Math.min(totals.games * 0.01, 0.5);
    marketValue = Math.max(1.0, Math.min(15.0, parseFloat(marketValue.toFixed(2))));

    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalGoals: totals.goals,
        totalAssists: totals.assists,
        gamesPlayed: totals.games,
        mvpCount: totals.mvps,
        consecutiveGames: totals.consecutiveGames,
        bestStreak: totals.bestStreak,
        overallRating: avgRating,
        marketValue,
        complaintsFiled: complaintsByComplainant.get(user.id) || 0,
        complaintsReceived: complaintsByAgainst.get(user.id) || 0,
      },
    });

    console.log(`  📊 ${user.name}: ${totals.games} jogos, ${totals.goals} golos, ${totals.assists} assist., ${totals.mvps} MVPs, rating ${avgRating}, streak ${totals.consecutiveGames}, valor €${marketValue}M`);
  }

  // ==================== 7. CREATE SOME TRANSACTIONS ====================
  console.log('\n💰 Creating financial transactions...');

  const transactionTypes = [
    { type: 'receita', category: 'mensalidade', desc: 'Mensalidade de {month}' },
    { type: 'despesa', category: 'pavilhao', desc: 'Aluguer do pavilhão - {month}' },
    { type: 'despesa', category: 'coletes', desc: 'Compra de coletes novos' },
    { type: 'despesa', category: 'bolas', desc: 'Bola de futsal' },
    { type: 'receita', category: 'multa', desc: 'Multa por falta de {playerName}' },
    { type: 'despesa', category: 'agua', desc: 'Garrafões de água - {month}' },
    { type: 'despesa', category: 'arbitro', desc: 'Pagamento ao árbitro - {month}' },
  ];

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  for (let m = 0; m < 3; m++) {
    const monthDate = new Date(today);
    monthDate.setMonth(monthDate.getMonth() - (2 - m));
    const monthName = monthNames[monthDate.getMonth()];

    // Mensalidades
    for (const user of users) {
      await prisma.transaction.create({
        data: {
          type: 'receita',
          amount: randomFloat(15, 25),
          category: 'mensalidade',
          description: `Mensalidade de ${user.name} - ${monthName}`,
          isPaid: Math.random() < 0.7,
          paidAt: Math.random() < 0.7 ? new Date(monthDate.getFullYear(), monthDate.getMonth(), randomInt(1, 15)) : null,
          createdAt: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
        },
      });
    }

    // Despesas do pavilhão
    await prisma.transaction.create({
      data: {
        type: 'despesa',
        amount: randomFloat(30, 60),
        category: 'pavilhao',
        description: `Aluguer do pavilhão - ${monthName}`,
        isPaid: true,
        paidAt: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5),
        createdAt: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
      },
    });

    // Água
    await prisma.transaction.create({
      data: {
        type: 'despesa',
        amount: randomFloat(5, 15),
        category: 'agua',
        description: `Garrafões de água - ${monthName}`,
        isPaid: true,
        paidAt: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5),
        createdAt: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
      },
    });

    // Multas
    if (Math.random() < 0.6) {
      const finedPlayer = pick(users);
      await prisma.transaction.create({
        data: {
          type: 'receita',
          amount: 5,
          category: 'multa',
          description: `Multa por falta de ${finedPlayer.name} - ${monthName}`,
          isPaid: Math.random() < 0.5,
          createdAt: new Date(monthDate.getFullYear(), monthDate.getMonth(), randomInt(1, 20)),
        },
      });
    }
  }
  console.log('✅ Financial transactions created');

  // ==================== 8. CREATE SUGGESTIONS ====================
  console.log('\n💡 Creating suggestions...');

  const suggestions = [
    { title: 'Comprar coletes novos', description: 'Os coletes atuais estão gastos e com rasgões. Precisamos de um novo conjunto com cores diferentes para cada equipa.', estimatedCost: 35, category: 'equipamento' },
    { title: 'Organizar torneio mensal', description: 'Podemos organizar um torneio no último sábado de cada mês com prémios para o vencedor.', estimatedCost: 20, category: 'evento' },
    { title: 'Atualizar bolas', description: 'As bolas atuais já perderam pressão e estão muito desgastadas. Precisamos de pelo menos 2 novas.', estimatedCost: 40, category: 'equipamento' },
    { title: 'Contratar árbitro fixo', description: 'Ter um árbitro fixo melhoraria a qualidade dos jogos e reduziria as queixas entre os jogadores.', estimatedCost: 50, category: 'organização' },
    { title: 'Criar canal do YouTube', description: 'Gravar os jogos e criar highlights para o canal da Palestrinha no YouTube.', estimatedCost: 15, category: 'marketing' },
    { title: 'Sistema de camisolas personalizadas', description: 'Criar camisolas com nomes e números para todos os jogadores mensalistas.', estimatedCost: 150, category: 'equipamento' },
  ];

  for (let i = 0; i < suggestions.length; i++) {
    const s = suggestions[i];
    const createdBy = users[i % users.length];
    await prisma.suggestion.create({
      data: {
        title: s.title,
        description: s.description,
        estimatedCost: s.estimatedCost,
        category: s.category,
        isPriority: Math.random() < 0.3,
        votesJson: JSON.stringify(shuffle(users).slice(0, randomInt(2, 8)).map(u => u.id)),
        votingOpen: true,
        status: pick(['em-analise', 'aprovada', 'em-analise', 'rejeitada', 'em-analise']),
        createdById: createdBy.id,
        createdAt: new Date(today.getTime() - randomInt(2592000000, 7776000000)),
      },
    });
  }
  console.log('✅ Suggestions created');

  console.log('\n🎉 Seed de 3 meses completo! Dados criados:');
  console.log(`  📅 ${gameDates.length} jogos`);
  console.log(`  ⚽ ${[...userTotals.values()].reduce((s, t) => s + t.goals, 0)} golos no total`);
  console.log(`  🎯 ${[...userTotals.values()].reduce((s, t) => s + t.assists, 0)} assistências no total`);
  console.log(`  🌟 ${[...userTotals.values()].reduce((s, t) => s + t.mvps, 0)} MVPs no total`);
  console.log(`  🏅 ${BADGE_DEFINITIONS.length} tipos de badges disponíveis`);
  console.log(`  📝 ${complaints.length} queixas`);
  console.log(`  💰 Transações financeiras criadas`);
  console.log(`  💡 ${suggestions.length} sugestões`);
}

seed3Months()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
