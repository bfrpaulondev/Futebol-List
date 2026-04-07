import { db } from '@/lib/db';
import { hashPassword } from './auth';
import { BADGE_DEFINITIONS } from './badges';

let _seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (_seedPromise) {
    await _seedPromise;
    return;
  }

  _seedPromise = seedDatabase();
  try {
    await _seedPromise;
  } finally {
    _seedPromise = null;
  }
}

// ===================== HELPERS =====================
function rInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rFloat(min: number, max: number, d = 2) { return parseFloat((Math.random() * (max - min) + min).toFixed(d)); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ===================== TABLE CREATION =====================
async function ensureTables() {
  const sql = `
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL, "passwordHash" TEXT NOT NULL,
      "name" TEXT NOT NULL, "phone" TEXT, "congregation" TEXT,
      "playerType" TEXT NOT NULL DEFAULT 'convidado', "position" TEXT NOT NULL DEFAULT 'ALA', "avatar" TEXT,
      "role" TEXT NOT NULL DEFAULT 'player', "skillsJson" TEXT NOT NULL DEFAULT '{}',
      "overallRating" REAL NOT NULL DEFAULT 5.0, "gamesPlayed" INTEGER NOT NULL DEFAULT 0, "mvpCount" INTEGER NOT NULL DEFAULT 0,
      "notificationsEnabled" BOOLEAN NOT NULL DEFAULT 1, "isActive" BOOLEAN NOT NULL DEFAULT 1,
      "totalGoals" INTEGER NOT NULL DEFAULT 0, "totalAssists" INTEGER NOT NULL DEFAULT 0,
      "consecutiveGames" INTEGER NOT NULL DEFAULT 0, "bestStreak" INTEGER NOT NULL DEFAULT 0,
      "marketValue" REAL NOT NULL DEFAULT 2.5, "complaintsReceived" INTEGER NOT NULL DEFAULT 0,
      "complaintsFiled" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

    CREATE TABLE IF NOT EXISTS "Game" (
      "id" TEXT NOT NULL PRIMARY KEY, "date" DATETIME NOT NULL,
      "location" TEXT NOT NULL DEFAULT 'Pavilhão Municipal', "maxPlayers" INTEGER NOT NULL DEFAULT 12,
      "status" TEXT NOT NULL DEFAULT 'open', "confirmationDeadline" DATETIME,
      "teamsJson" TEXT NOT NULL DEFAULT '{}', "scoreA" INTEGER NOT NULL DEFAULT 0, "scoreB" INTEGER NOT NULL DEFAULT 0,
      "aiCoachComment" TEXT, "ratingsOpen" BOOLEAN NOT NULL DEFAULT 0, "ratingsCloseAt" DATETIME,
      "playedAt" DATETIME, "chronicle" TEXT, "chronicleAi" TEXT, "mvpId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "GameAttendee" (
      "id" TEXT NOT NULL PRIMARY KEY, "gameId" TEXT NOT NULL, "userId" TEXT NOT NULL,
      "playerType" TEXT NOT NULL DEFAULT 'convidado', "priority" INTEGER NOT NULL DEFAULT 2,
      "status" TEXT NOT NULL DEFAULT 'confirmed', "confirmedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "arrivedAt" DATETIME,
      CONSTRAINT "GameAttendee_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "GameAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "GameAttendee_gameId_userId_key" ON "GameAttendee"("gameId", "userId");

    CREATE TABLE IF NOT EXISTS "GameStat" (
      "id" TEXT NOT NULL PRIMARY KEY, "gameId" TEXT NOT NULL, "userId" TEXT NOT NULL,
      "goals" INTEGER NOT NULL DEFAULT 0, "assists" INTEGER NOT NULL DEFAULT 0, "ownGoals" INTEGER NOT NULL DEFAULT 0,
      "team" TEXT NOT NULL DEFAULT 'A', "isMvp" BOOLEAN NOT NULL DEFAULT 0, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "GameStat_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "GameStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "GameStat_gameId_userId_key" ON "GameStat"("gameId", "userId");

    CREATE TABLE IF NOT EXISTS "Message" (
      "id" TEXT NOT NULL PRIMARY KEY, "content" TEXT NOT NULL, "type" TEXT NOT NULL DEFAULT 'text',
      "channel" TEXT NOT NULL DEFAULT 'general', "authorId" TEXT NOT NULL,
      "isDeleted" BOOLEAN NOT NULL DEFAULT 0, "readByJson" TEXT NOT NULL DEFAULT '[]',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "Transaction" (
      "id" TEXT NOT NULL PRIMARY KEY, "type" TEXT NOT NULL, "amount" REAL NOT NULL,
      "category" TEXT NOT NULL, "description" TEXT NOT NULL, "isPaid" BOOLEAN NOT NULL DEFAULT 0,
      "paidAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "Suggestion" (
      "id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "description" TEXT NOT NULL,
      "estimatedCost" REAL NOT NULL, "category" TEXT NOT NULL, "isPriority" BOOLEAN NOT NULL DEFAULT 0,
      "votesJson" TEXT NOT NULL DEFAULT '[]', "approvalsJson" TEXT NOT NULL DEFAULT '[]',
      "votingOpen" BOOLEAN NOT NULL DEFAULT 0, "status" TEXT NOT NULL DEFAULT 'em-analise',
      "createdById" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Suggestion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "Rating" (
      "id" TEXT NOT NULL PRIMARY KEY, "gameId" TEXT NOT NULL, "ratedPlayerId" TEXT NOT NULL, "raterId" TEXT NOT NULL,
      "scoresJson" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Rating_gameId_raterId_ratedPlayerId_key" UNIQUE ("gameId", "raterId", "ratedPlayerId"),
      CONSTRAINT "Rating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Rating_ratedPlayerId_fkey" FOREIGN KEY ("ratedPlayerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "ColeteSchedule" (
      "id" TEXT NOT NULL PRIMARY KEY, "year" INTEGER NOT NULL, "monthsJson" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "PaymentReceipt" (
      "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "month" INTEGER NOT NULL, "year" INTEGER NOT NULL,
      "amount" REAL NOT NULL, "imageData" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'pending',
      "reviewedById" TEXT, "reviewNote" TEXT, "reviewedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "PaymentReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "PaymentReceipt_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "Notification" (
      "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "type" TEXT NOT NULL,
      "title" TEXT NOT NULL, "message" TEXT NOT NULL, "read" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "PushSubscription" (
      "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "endpoint" TEXT NOT NULL,
      "keysAuth" TEXT NOT NULL, "keysP256dh" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

    CREATE TABLE IF NOT EXISTS "Badge" (
      "id" TEXT NOT NULL PRIMARY KEY, "slug" TEXT NOT NULL, "name" TEXT NOT NULL,
      "description" TEXT NOT NULL, "icon" TEXT NOT NULL DEFAULT '🏆',
      "category" TEXT NOT NULL DEFAULT 'general', "tier" TEXT NOT NULL DEFAULT 'bronze',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "Badge_slug_key" ON "Badge"("slug");

    CREATE TABLE IF NOT EXISTS "UserBadge" (
      "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "badgeId" TEXT NOT NULL,
      "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "gameContext" TEXT,
      CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

    CREATE TABLE IF NOT EXISTS "Complaint" (
      "id" TEXT NOT NULL PRIMARY KEY, "gameId" TEXT, "complainantId" TEXT NOT NULL, "againstId" TEXT NOT NULL,
      "description" TEXT NOT NULL, "category" TEXT NOT NULL DEFAULT 'agressao', "palestrinhaReply" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Complaint_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "Complaint_complainantId_fkey" FOREIGN KEY ("complainantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Complaint_againstId_fkey" FOREIGN KEY ("againstId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "WeeklyReview" (
      "id" TEXT NOT NULL PRIMARY KEY, "weekStart" DATETIME NOT NULL, "weekEnd" DATETIME NOT NULL,
      "content" TEXT NOT NULL, "aiContent" TEXT NOT NULL, "statsJson" TEXT NOT NULL DEFAULT '{}',
      "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "PlayerOfMonth" (
      "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "month" INTEGER NOT NULL, "year" INTEGER NOT NULL,
      "mvpCount" INTEGER NOT NULL DEFAULT 0, "avgRating" REAL NOT NULL DEFAULT 0,
      "gamesPlayed" INTEGER NOT NULL DEFAULT 0, "goals" INTEGER NOT NULL DEFAULT 0, "speech" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PlayerOfMonth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "PlayerOfMonth_month_year_key" ON "PlayerOfMonth"("month", "year");

    CREATE TABLE IF NOT EXISTS "MarketValueEntry" (
      "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "value" REAL NOT NULL, "reason" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "MarketValueEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `;

  for (const stmt of sql.split(';').filter(s => s.trim().length > 0)) {
    try { await db.$executeRawUnsafe(stmt.trim()); } catch (_e) { /* table exists */ }
  }
}

// ===================== DEMO DATA GENERATION =====================
async function seedDemoData(users: any[]) {
  const realUsers = users.filter((u: any) => u.id !== 'user-palestrinha-bot');
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Seed badges
  for (const def of BADGE_DEFINITIONS) {
    try {
      await db.badge.upsert({
        where: { slug: def.slug },
        create: { slug: def.slug, name: def.name, description: def.description, icon: def.icon, category: def.category, tier: def.tier },
        update: {},
      });
    } catch (_e) { /* exists */ }
  }

  // Generate game dates
  const saturdays: Date[] = [];
  const cur = new Date(threeMonthsAgo);
  while (cur <= today) {
    if (cur.getDay() === 6) {
      const d = new Date(cur); d.setHours(rInt(18, 21), 0, 0, 0); saturdays.push(d);
    }
    cur.setDate(cur.getDate() + 1);
  }

  const gameDates: Date[] = [];
  for (const sat of saturdays) {
    gameDates.push(sat);
    if (Math.random() < 0.3) {
      const wed = new Date(sat); wed.setDate(wed.getDate() - 3); wed.setHours(rInt(19, 21), 0, 0, 0);
      gameDates.push(wed);
    }
  }

  const locations = ['Pavilhão Municipal de Setúbal', 'Pavilhão da Baixa da Banheira', 'Pavilhão de Palmela', 'Pavilhão de Monte Belo', 'Pavilhão do Bonfim'];
  const chronTemplates = [
    "Noite memorável! {teamAScore}x{teamBScore} com destaque para {mvpName}.",
    "Futebol de alta qualidade! {mvpName} brilhou. Resultado: {teamAScore}x{teamBScore}.",
    "Jogo renhido: {teamAScore}x{teamBScore}. {mvpName} liderou com determinação.",
    "Noite de grandes emoções! {teamAScore}x{teamBScore}. {mvpName} foi decisivo.",
    "Palestrinha de tirar o fôlego! {teamAScore}x{teamBScore}.",
  ];
  const chronAiTemplates = [
    "📊 {mvpName}: {mvpGoals} golo(s), {mvpAssists} assist. Posse A: {posA}%. {shots} remates.",
    "📈 {totalGoals} golos. {mvpName} com {successRate}% passes certos. {avgSpd}km/h.",
    "🤖 {mvpName} percorreu ~{dist}m. {sot}/{shots} remates enquadrados.",
  ];
  const complaintTpls = [
    "O {againstName} esteve a fazer faltas o jogo todo!",
    "O {againstName} não passava a bola.",
    "Falta de desportivismo do {againstName}.",
    "O {againstName} fez o golo com a mão!",
    "Equipas desequilibradas no jogo.",
    "O {againstName} jogou demasiado agressivo.",
  ];
  const palestrinhaReplies = [
    "Queixa registada! Vamos analisar. O desportivismo é fundamental. 🤝",
    "Obrigado por reportar. Vamos falar com os envolvidos. 🙏",
    "Registado! Mais atenção na próxima. 👀",
    "Compreendemos. Vamos conversar com o jogador. 💪",
  ];
  const weeklyTpls = [
    "🔥 **Semana {w}**\n\n2 jogos com {g} golos.\n- {topS}: {topGS} golos\n- {topA}: {topAs} assist\n- MVP: {mvp}\nContinuem! 🏆",
    "📊 **Relatório #{w}**\n\n2 jogos, {g} golos.\n🥇 {topS} ({topGS}g)\n🥈 {topA} ({topAs}a)\n🥉 {mvp} (MVP)\n⚡",
  ];
  const weeklyAiTpls = [
    "🤖 Semana {w}: Ofensiva {oR}/10, Defensiva {dR}/10, Desportivismo {sR}/10.",
    "📈 #{w}: {spd}km/h, {passR}% passes, {shotR}% eficiência. {mvp} em destaque.",
  ];

  // Performance profiles (deterministic per user based on position)
  const profiles = realUsers.map((u: any) => ({
    user: u,
    baseGoals: u.position === 'ALA' ? 0.8 : u.position === 'PIVO' ? 1.0 : 0.15,
    baseAssists: u.position === 'PIVO' ? 0.6 : 0.3,
    mult: rFloat(0.6, 1.4),
  }));

  // Track totals
  const totals = new Map<string, { goals: number; assists: number; games: number; mvps: number; streak: number; bestStreak: number; rating: number; rCount: number }>();
  for (const u of realUsers) totals.set(u.id, { goals: 0, assists: 0, games: 0, mvps: 0, streak: 0, bestStreak: 0, rating: 0, rCount: 0 });

  let weekNum = 0;

  for (let gi = 0; gi < gameDates.length; gi++) {
    const gd = gameDates[gi];
    const sA = rInt(0, 7), sB = rInt(0, 7);

    const game = await db.game.create({
      data: { date: gd, location: pick(locations), maxPlayers: rInt(10, 14), status: 'played', scoreA: sA, scoreB: sB, playedAt: gd },
    });

    const numAtt = rInt(8, Math.min(12, realUsers.length));
    const attendees = shuffle(realUsers).slice(0, numAtt);
    const teamA = attendees.slice(0, Math.ceil(numAtt / 2));
    const teamB = attendees.slice(Math.ceil(numAtt / 2));

    // Create attendees and update streaks
    for (const a of attendees) {
      await db.gameAttendee.create({
        data: { gameId: game.id, userId: a.id, playerType: a.playerType, priority: a.playerType === 'mensalista' ? 1 : 2, status: 'confirmed', arrivedAt: gd },
      });
      const t = totals.get(a.id)!; t.games++; t.streak++; if (t.streak > t.bestStreak) t.bestStreak = t.streak;
    }
    for (const u of realUsers) { if (!attendees.find(a => a.id === u.id)) { totals.get(u.id)!.streak = 0; } }

    // Stats + MVP
    let gameMvpUser: any = null, gameMvpRating = 0, mvpRound: any = null;
    const roundStats: any[] = [];

    for (const prof of profiles) {
      if (!attendees.find(a => a.id === prof.user.id)) continue;
      const team = teamA.find(u => u.id === prof.user.id) ? 'A' : 'B';

      let goals = 0;
      const gr = Math.random() * prof.baseGoals * prof.mult;
      if (gr > 0.5) goals = 1; if (gr > 1.0) goals = 2; if (gr > 1.5) goals = 3;
      if (goals) totals.get(prof.user.id)!.goals += goals;

      let assists = 0;
      const ar = Math.random() * prof.baseAssists * prof.mult;
      if (ar > 0.6) assists = 1; if (ar > 1.2) assists = 2;
      if (assists) totals.get(prof.user.id)!.assists += assists;

      const ownGoals = Math.random() > 0.95 ? 1 : 0;
      const rating = rFloat(3.5, 9.5);

      const stat = await db.gameStat.create({
        data: { gameId: game.id, userId: prof.user.id, goals, assists, ownGoals, team },
      });
      roundStats.push({ stat, prof, rating });
    }

    let bestScore = -1;
    for (const s of roundStats) {
      const sc = s.rating + s.stat.goals * 0.5 + s.stat.assists * 0.3;
      if (sc > bestScore) { bestScore = sc; mvpRound = s; }
    }
    if (mvpRound) {
      await db.gameStat.update({ where: { id: mvpRound.stat.id }, data: { isMvp: true } });
      await db.game.update({ where: { id: game.id }, data: { mvpId: mvpRound.prof.user.id } });
      gameMvpUser = mvpRound.prof.user; gameMvpRating = mvpRound.rating;
      totals.get(mvpRound.prof.user.id)!.mvps++;
    }

    const mvN = gameMvpUser?.name || 'N/A';
    const mvG = mvpRound?.stat.goals || 0;
    const mvA = mvpRound?.stat.assists || 0;

    await db.game.update({
      where: { id: game.id },
      data: {
        chronicle: pick(chronTemplates).replace('{teamAScore}', String(sA)).replace('{teamBScore}', String(sB)).replace('{mvpName}', mvN),
        chronicleAi: pick(chronAiTemplates)
          .replace('{mvpName}', mvN).replace('{mvpGoals}', String(mvG)).replace('{mvpAssists}', String(mvA))
          .replace('{posA}', String(rInt(40, 60))).replace('{shots}', String(rInt(8, 25)))
          .replace('{totalGoals}', String(sA + sB)).replace('{successRate}', String(rInt(60, 95)))
          .replace('{avgSpd}', String(rFloat(4.5, 8.0, 1))).replace('{dist}', String(rInt(3000, 7000)))
          .replace('{sot}', String(rInt(4, 15))),
      },
    });

    // Ratings (sample - not all pairs to be faster)
    const rAgg = new Map<string, { sum: number; count: number }>();
    for (const a of attendees) rAgg.set(a.id, { sum: 0, count: 0 });
    for (const rater of attendees) {
      for (const rated of attendees) {
        if (rater.id === rated.id || Math.random() < 0.5) continue;
        const scores = { technique: rInt(3, 10), passing: rInt(3, 10), defense: rInt(3, 10), attack: rInt(3, 10), stamina: rInt(3, 10), teamplay: rInt(3, 10) };
        try {
          await db.rating.create({ data: { gameId: game.id, raterId: rater.id, ratedPlayerId: rated.id, scoresJson: JSON.stringify(scores) } });
          const avg = Object.values(scores).reduce((a: number, b: number) => a + b, 0) / 6;
          const r = rAgg.get(rated.id)!; r.sum += avg; r.count++;
        } catch { /* unique */ }
      }
    }
    for (const [uid, r] of rAgg) { if (r.count > 0) { const t = totals.get(uid)!; t.rating += r.sum; t.rCount += r.count; } }

    // Messages
    const msgs = ['Boa jogo! 🔥', 'Vamos lá dar o nosso máximo!', 'Que jogo incrível!', 'Goloasso! ⚽⚽', 'Bom jogo a todos', 'Grande defesa!', 'Que remate! 💥'];
    for (let m = 0; m < rInt(2, 5); m++) {
      const md = new Date(gd); md.setMinutes(md.getMinutes() + rInt(-30, 90));
      await db.message.create({ data: { content: pick(msgs), type: 'text', channel: 'general', authorId: pick(attendees).id, createdAt: md } });
    }

    // Weekly review every 2 games
    if ((gi + 1) % 2 === 0 && roundStats.length > 0) {
      weekNum++;
      const topS = roundStats.reduce((b, s) => s.stat.goals > (b?.stat.goals || 0) ? s : b, roundStats[0]);
      const topAs = roundStats.reduce((b, s) => s.stat.assists > (b?.stat.assists || 0) ? s : b, roundStats[0]);
      const tG = roundStats.reduce((s, x) => s + x.stat.goals, 0);
      const prevGameDate = gameDates[gi - 1];

      await db.weeklyReview.create({
        data: {
          weekStart: prevGameDate, weekEnd: gd,
          content: pick(weeklyTpls).replace('{w}', String(weekNum)).replace('{g}', String(tG))
            .replace('{topS}', topS.prof.user.name).replace('{topGS}', String(topS.stat.goals))
            .replace('{topA}', topAs.prof.user.name).replace('{topAs}', String(topAs.stat.assists))
            .replace('{mvp}', mvN),
          aiContent: pick(weeklyAiTpls).replace('{w}', String(weekNum))
            .replace('{oR}', String(rInt(5, 9))).replace('{dR}', String(rInt(5, 9)))
            .replace('{sR}', String(rInt(6, 10))).replace('{spd}', String(rFloat(5.0, 7.5, 1)))
            .replace('{passR}', String(rInt(65, 90))).replace('{shotR}', String(rInt(25, 55))).replace('{mvp}', mvN),
          statsJson: JSON.stringify({ gamesPlayed: 2, totalGoals: tG }),
        },
      });
    }

    // Complaints (~35%)
    if (Math.random() < 0.35 && attendees.length >= 4) {
      const complainant = pick(attendees);
      const against = pick(attendees.filter(u => u.id !== complainant.id));
      await db.complaint.create({
        data: {
          gameId: game.id, complainantId: complainant.id, againstId: against.id,
          description: pick(complaintTpls).replace('{againstName}', against.name),
          category: pick(['agressao', 'falta-desportivismo', 'trapaca', 'equipas']),
          palestrinhaReply: pick(palestrinhaReplies),
          createdAt: new Date(gd.getTime() + rInt(3600000, 86400000)),
        },
      });
    }

    // Notifications (sparse)
    for (const a of attendees) {
      if (Math.random() < 0.4) {
        const nd = new Date(gd); nd.setDate(nd.getDate() - 1);
        await db.notification.create({ data: { userId: a.id, type: 'game_reminder', title: '⏰ Lembrete', message: `Jogo amanhã às ${gd.getHours()}:00!`, read: Math.random() < 0.6, createdAt: nd } });
      }
      if (Math.random() < 0.4) {
        const nd = new Date(gd); nd.setHours(nd.getHours() + 2);
        await db.notification.create({ data: { userId: a.id, type: 'game_result', title: '📊 Resultado', message: `${sA}x${sB}. MVP: ${mvN}`, read: Math.random() < 0.4, createdAt: nd } });
      }
    }
  }

  // Player of the Month
  for (let i = 2; i >= 1; i--) {
    const md = new Date(today); md.setMonth(md.getMonth() - i);
    const mi = md.getMonth() + 1, yr = md.getFullYear();
    const mGames = await db.game.findMany({ where: { date: { gte: new Date(yr, mi - 1, 1), lt: new Date(yr, mi, 1) } } });
    if (!mGames.length) continue;

    const mStats = await db.gameStat.findMany({ where: { gameId: { in: mGames.map(g => g.id) } } });
    const agg = new Map<string, { goals: number; assists: number; mvps: number; games: number }>();
    for (const s of mStats) {
      if (!agg.has(s.userId)) agg.set(s.userId, { goals: 0, assists: 0, mvps: 0, games: 0 });
      const p = agg.get(s.userId)!; p.goals += s.goals; p.assists += s.assists; if (s.isMvp) p.mvps++; p.games++;
    }

    let bestUid: string | null = null, bestSc = -1, bestSt = { goals: 0, assists: 0, mvps: 0, games: 0 };
    for (const [uid, p] of agg) { const sc = p.goals * 2 + p.assists * 1.5 + p.mvps * 3; if (sc > bestSc) { bestSc = sc; bestUid = uid; bestSt = p; } }

    if (bestUid) {
      try {
        await db.playerOfMonth.create({
          data: { userId: bestUid, month: mi, year: yr, mvpCount: bestSt.mvps, avgRating: rFloat(6, 8.5), gamesPlayed: bestSt.games, goals: bestSt.goals,
            speech: pick(["Obrigado a todos! Vamos continuar! 💪", "Grato! A Palestrinha é o melhor! 🏆", "Prometo dar o meu melhor! ⚽🔥"]) },
        });
      } catch { /* unique month/year */ }
    }
  }

  // Market Value History
  for (const u of realUsers) {
    let val = rFloat(2.0, 5.0);
    for (let i = 0; i < 8; i++) {
      const ed = new Date(today); ed.setDate(ed.getDate() - (8 - i) * 11);
      val = Math.max(1.0, Math.min(15.0, val + (Math.random() - 0.4) * 0.8));
      await db.marketValueEntry.create({
        data: { userId: u.id, value: parseFloat(val.toFixed(2)), reason: pick(['Ajuste semanal', 'Boa performance', 'Golos', 'Presença', 'MVP', 'Evolução']), createdAt: ed },
      });
    }
  }

  // Award Badges
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
      const badge = await db.badge.findUnique({ where: { slug } });
      if (badge) {
        try {
          await db.userBadge.create({ data: { userId: u.id, badgeId: badge.id, earnedAt: new Date(today.getTime() - rInt(86400000, 7776000000)), gameContext: `${t.games} jogos` } });
        } catch { /* unique */ }
      }
    }
  }

  // Update user totals
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

  // Transactions
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  for (let m = 0; m < 3; m++) {
    const md = new Date(today); md.setMonth(md.getMonth() - (2 - m));
    const mn = monthNames[md.getMonth()];
    for (const u of realUsers) {
      await db.transaction.create({ data: { type: 'receita', amount: rFloat(15, 25), category: 'mensalidade', description: `Mensalidade ${u.name} - ${mn}`, isPaid: Math.random() < 0.7, createdAt: new Date(md.getFullYear(), md.getMonth(), 1) } });
    }
    await db.transaction.create({ data: { type: 'despesa', amount: rFloat(30, 60), category: 'pavilhao', description: `Pavilhão - ${mn}`, isPaid: true, createdAt: new Date(md.getFullYear(), md.getMonth(), 1) } });
  }

  // Suggestions
  const sugData = [
    { title: 'Comprar coletes novos', description: 'Os coletes estão gastos.', estimatedCost: 35, category: 'equipamento' },
    { title: 'Organizar torneio mensal', description: 'Torneio no último sábado.', estimatedCost: 20, category: 'evento' },
    { title: 'Atualizar bolas', description: 'Bolas desgastadas.', estimatedCost: 40, category: 'equipamento' },
  ];
  for (let i = 0; i < sugData.length; i++) {
    await db.suggestion.create({
      data: { ...sugData[i], isPriority: Math.random() < 0.3, votesJson: JSON.stringify(shuffle(realUsers).slice(0, rInt(2, 6)).map((u: any) => u.id)), votingOpen: true, status: 'em-analise', createdById: realUsers[i % realUsers.length].id, createdAt: new Date(today.getTime() - rInt(2592000000, 7776000000)) },
    });
  }

  console.log(`✅ Demo data seeded: ${gameDates.length} games`);
}

// ===================== MAIN SEED =====================
async function seedDatabase() {
  try {
    await ensureTables();
    const userCount = await db.user.count();
    if (userCount > 0) return;
  } catch (e) {
    try { await ensureTables(); } catch { return; }
  }

  console.log('🌱 Auto-seeding database...');

  const hash = await hashPassword('123456');

  const players = [
    { id: 'user-carlos',   email: 'carlos@test.com',   name: 'Carlos',   congregation: 'Baixa da Banheira', position: 'ALA' },
    { id: 'user-mirko',    email: 'mirko@test.com',    name: 'Mirko',    congregation: 'Monte Belo',       position: 'ALA' },
    { id: 'user-rodrigo',  email: 'rodrigo@test.com',  name: 'Rodrigo',  congregation: 'Setúbal Bonfim',   position: 'DEF',  role: 'admin' },
    { id: 'user-edson',    email: 'edson@test.com',    name: 'Edson',    congregation: 'Setúbal Bonfim',   position: 'ALA',  role: 'admin' },
    { id: 'user-douglas',  email: 'douglas@test.com',  name: 'Douglas',  congregation: 'Setúbal Bonfim',   position: 'PIVO' },
    { id: 'user-evandro',  email: 'evandro@test.com',  name: 'Evandro',  congregation: 'Baixa da Banheira',position: 'DEF' },
    { id: 'user-bruno',    email: 'bruno@test.com',    name: 'Bruno',    congregation: 'Setúbal Bonfim',   position: 'ALA',  role: 'master' },
    { id: 'user-ruben',    email: 'ruben@test.com',    name: 'Rúben',    congregation: 'Palmela',          position: 'GR' },
    { id: 'user-brenon',   email: 'brenon@test.com',   name: 'Brenon',   congregation: 'Setúbal Bonfim',   position: 'PIVO' },
    { id: 'user-gabriel',  email: 'gabriel@test.com',  name: 'Gabriel',  congregation: 'Setúbal Norte',    position: 'ALA' },
    { id: 'user-david',    email: 'david@test.com',    name: 'David',    congregation: 'Setúbal Bonfim',   position: 'DEF',  role: 'admin' },
    { id: 'user-jesse',    email: 'jesse@test.com',    name: 'Jessé',    congregation: 'Setúbal Bonfim',   position: 'ALA' },
  ];

  const createdUsers = [];
  for (const p of players) {
    const user = await db.user.create({
      data: {
        id: p.id, email: p.email, passwordHash: hash, name: p.name,
        congregation: p.congregation, playerType: 'mensalista', position: p.position,
        role: (p as any).role || 'player',
        skillsJson: JSON.stringify({ defense: 6, attack: 6, passing: 6, technique: 6, stamina: 6 }),
        overallRating: 5.0, gamesPlayed: 0, mvpCount: 0, notificationsEnabled: true,
      },
    });
    createdUsers.push(user);
  }

  // Palestrinha bot
  try {
    await db.user.create({
      data: { id: 'user-palestrinha-bot', email: 'palestrinha-bot@futebolbonfim.pt', passwordHash: await hashPassword('no-login-bot'), name: 'Palestrinha', playerType: 'mensalista', position: 'TREINADOR', role: 'player', skillsJson: '{}', overallRating: 0, gamesPlayed: 0, mvpCount: 0, notificationsEnabled: false },
    });
  } catch { /* exists */ }

  // Next game
  const gameDate = new Date();
  const daysUntilSaturday = gameDate.getDay() === 6 ? 7 : (6 - gameDate.getDay());
  gameDate.setDate(gameDate.getDate() + daysUntilSaturday);
  gameDate.setHours(19, 0, 0, 0);
  const deadline = new Date(gameDate); deadline.setDate(deadline.getDate() - 3); deadline.setHours(12, 0, 0, 0);

  await db.game.create({ data: { date: gameDate, location: 'Pavilhão Municipal de Setúbal', maxPlayers: 12, status: 'open', confirmationDeadline: deadline } });

  // Colete schedule
  const existing2026 = await db.coleteSchedule.findFirst({ where: { year: 2026 } });
  if (!existing2026) {
    const currentMonth = new Date().getMonth();
    const months2026 = [
      { month: 'Janeiro',   monthIndex: 0,  userId: 'user-bruno',   userName: 'Bruno' },
      { month: 'Fevereiro', monthIndex: 1,  userId: 'user-rodrigo', userName: 'Rodrigo' },
      { month: 'Março',     monthIndex: 2,  userId: 'user-brenon',  userName: 'Brenon' },
      { month: 'Abril',     monthIndex: 3,  userId: 'user-douglas', userName: 'Douglas' },
      { month: 'Maio',      monthIndex: 4,  userId: 'user-david',   userName: 'David' },
      { month: 'Junho',     monthIndex: 5,  userId: 'user-ruben',   userName: 'Rúben' },
      { month: 'Julho',     monthIndex: 6,  userId: 'user-gabriel', userName: 'Gabriel' },
      { month: 'Agosto',    monthIndex: 7,  userId: 'user-jesse',   userName: 'Jessé' },
      { month: 'Setembro',  monthIndex: 8,  userId: 'user-mirko',   userName: 'Mirko' },
      { month: 'Outubro',   monthIndex: 9,  userId: 'user-evandro', userName: 'Evandro' },
      { month: 'Novembro',  monthIndex: 10, userId: 'user-edson',   userName: 'Edson' },
      { month: 'Dezembro',  monthIndex: 11, userId: 'user-carlos',  userName: 'Carlos' },
    ];
    await db.coleteSchedule.create({
      data: { year: 2026, monthsJson: JSON.stringify(months2026.map(m => ({ ...m, status: m.monthIndex < currentMonth ? 'done' : m.monthIndex === currentMonth ? 'current' : 'pending' }))) },
    });
  }

  // Seed 3 months of demo data
  await seedDemoData(createdUsers);

  console.log('🎉 Auto-seed complete!');
}
