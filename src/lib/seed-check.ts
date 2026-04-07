import { db } from '@/lib/db';
import { hashPassword } from './auth';

let _seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  // Prevent concurrent seeding
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

async function ensureColumns() {
  // Add missing columns to User table for existing databases
  const userColumns = [
    `"totalGoals" INTEGER NOT NULL DEFAULT 0`,
    `"totalAssists" INTEGER NOT NULL DEFAULT 0`,
    `"consecutiveGames" INTEGER NOT NULL DEFAULT 0`,
    `"bestStreak" INTEGER NOT NULL DEFAULT 0`,
    `"marketValue" REAL NOT NULL DEFAULT 2.5`,
    `"complaintsReceived" INTEGER NOT NULL DEFAULT 0`,
    `"complaintsFiled" INTEGER NOT NULL DEFAULT 0`,
  ];

  for (const col of userColumns) {
    const colName = col.split('"')[1];
    try {
      await db.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN ${col};`);
      console.log(`  ✅ Added column User.${colName}`);
    } catch (e: any) {
      // Column already exists - that's fine
      if (!e.message?.includes('duplicate column')) {
        console.warn(`  ⚠️ Column User.${colName}:`, e.message?.slice(0, 80));
      }
    }
  }

  // Add missing columns to Game table for existing databases
  const gameColumns = [
    `"playedAt" DATETIME`,
    `"chronicle" TEXT`,
    `"chronicleAi" TEXT`,
    `"mvpId" TEXT`,
  ];

  for (const col of gameColumns) {
    const colName = col.split('"')[1];
    try {
      await db.$executeRawUnsafe(`ALTER TABLE "Game" ADD COLUMN ${col};`);
      console.log(`  ✅ Added column Game.${colName}`);
    } catch (e: any) {
      if (!e.message?.includes('duplicate column')) {
        console.warn(`  ⚠️ Column Game.${colName}:`, e.message?.slice(0, 80));
      }
    }
  }
}

async function ensureTables() {
  const sql = `
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "phone" TEXT,
      "congregation" TEXT,
      "playerType" TEXT NOT NULL DEFAULT 'convidado',
      "position" TEXT NOT NULL DEFAULT 'ALA',
      "avatar" TEXT,
      "role" TEXT NOT NULL DEFAULT 'player',
      "skillsJson" TEXT NOT NULL DEFAULT '{}',
      "overallRating" REAL NOT NULL DEFAULT 5.0,
      "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
      "mvpCount" INTEGER NOT NULL DEFAULT 0,
      "notificationsEnabled" BOOLEAN NOT NULL DEFAULT 1,
      "isActive" BOOLEAN NOT NULL DEFAULT 1,
      "totalGoals" INTEGER NOT NULL DEFAULT 0,
      "totalAssists" INTEGER NOT NULL DEFAULT 0,
      "consecutiveGames" INTEGER NOT NULL DEFAULT 0,
      "bestStreak" INTEGER NOT NULL DEFAULT 0,
      "marketValue" REAL NOT NULL DEFAULT 2.5,
      "complaintsReceived" INTEGER NOT NULL DEFAULT 0,
      "complaintsFiled" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

    CREATE TABLE IF NOT EXISTS "Game" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "date" DATETIME NOT NULL,
      "location" TEXT NOT NULL DEFAULT 'Pavilhão Municipal',
      "maxPlayers" INTEGER NOT NULL DEFAULT 12,
      "status" TEXT NOT NULL DEFAULT 'open',
      "confirmationDeadline" DATETIME,
      "teamsJson" TEXT NOT NULL DEFAULT '{}',
      "scoreA" INTEGER NOT NULL DEFAULT 0,
      "scoreB" INTEGER NOT NULL DEFAULT 0,
      "aiCoachComment" TEXT,
      "ratingsOpen" BOOLEAN NOT NULL DEFAULT 0,
      "ratingsCloseAt" DATETIME,
      "playedAt" DATETIME,
      "chronicle" TEXT,
      "chronicleAi" TEXT,
      "mvpId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "GameAttendee" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "gameId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "playerType" TEXT NOT NULL DEFAULT 'convidado',
      "priority" INTEGER NOT NULL DEFAULT 2,
      "status" TEXT NOT NULL DEFAULT 'confirmed',
      "confirmedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "arrivedAt" DATETIME,
      CONSTRAINT "GameAttendee_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "GameAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "GameAttendee_gameId_userId_key" ON "GameAttendee"("gameId", "userId");

    CREATE TABLE IF NOT EXISTS "GameStat" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "gameId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "goals" INTEGER NOT NULL DEFAULT 0,
      "assists" INTEGER NOT NULL DEFAULT 0,
      "ownGoals" INTEGER NOT NULL DEFAULT 0,
      "team" TEXT NOT NULL DEFAULT 'A',
      "isMvp" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "GameStat_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "GameStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "GameStat_gameId_userId_key" ON "GameStat"("gameId", "userId");

    CREATE TABLE IF NOT EXISTS "Message" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "content" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'text',
      "channel" TEXT NOT NULL DEFAULT 'general',
      "authorId" TEXT NOT NULL,
      "isDeleted" BOOLEAN NOT NULL DEFAULT 0,
      "readByJson" TEXT NOT NULL DEFAULT '[]',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "Transaction" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "type" TEXT NOT NULL,
      "amount" REAL NOT NULL,
      "category" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "isPaid" BOOLEAN NOT NULL DEFAULT 0,
      "paidAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "Suggestion" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "estimatedCost" REAL NOT NULL,
      "category" TEXT NOT NULL,
      "isPriority" BOOLEAN NOT NULL DEFAULT 0,
      "votesJson" TEXT NOT NULL DEFAULT '[]',
      "approvalsJson" TEXT NOT NULL DEFAULT '[]',
      "votingOpen" BOOLEAN NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'em-analise',
      "createdById" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Suggestion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "Rating" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "gameId" TEXT NOT NULL,
      "ratedPlayerId" TEXT NOT NULL,
      "raterId" TEXT NOT NULL,
      "scoresJson" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Rating_gameId_raterId_ratedPlayerId_key" UNIQUE ("gameId", "raterId", "ratedPlayerId"),
      CONSTRAINT "Rating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Rating_ratedPlayerId_fkey" FOREIGN KEY ("ratedPlayerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "ColeteSchedule" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "year" INTEGER NOT NULL,
      "monthsJson" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "PaymentReceipt" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "month" INTEGER NOT NULL,
      "year" INTEGER NOT NULL,
      "amount" REAL NOT NULL,
      "imageData" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "reviewedById" TEXT,
      "reviewNote" TEXT,
      "reviewedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "PaymentReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "PaymentReceipt_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "Notification" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "read" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "PushSubscription" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "endpoint" TEXT NOT NULL,
      "keysAuth" TEXT NOT NULL,
      "keysP256dh" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

    CREATE TABLE IF NOT EXISTS "Badge" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "slug" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "icon" TEXT NOT NULL DEFAULT '🏆',
      "category" TEXT NOT NULL DEFAULT 'general',
      "tier" TEXT NOT NULL DEFAULT 'bronze',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "Badge_slug_key" ON "Badge"("slug");

    CREATE TABLE IF NOT EXISTS "UserBadge" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "badgeId" TEXT NOT NULL,
      "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "gameContext" TEXT,
      CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

    CREATE TABLE IF NOT EXISTS "Complaint" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "gameId" TEXT,
      "complainantId" TEXT NOT NULL,
      "againstId" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'agressao',
      "palestrinhaReply" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Complaint_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "Complaint_complainantId_fkey" FOREIGN KEY ("complainantId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Complaint_againstId_fkey" FOREIGN KEY ("againstId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "WeeklyReview" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "weekStart" DATETIME NOT NULL,
      "weekEnd" DATETIME NOT NULL,
      "content" TEXT NOT NULL,
      "aiContent" TEXT NOT NULL,
      "statsJson" TEXT NOT NULL DEFAULT '{}',
      "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "PlayerOfMonth" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "month" INTEGER NOT NULL,
      "year" INTEGER NOT NULL,
      "mvpCount" INTEGER NOT NULL DEFAULT 0,
      "avgRating" REAL NOT NULL DEFAULT 0,
      "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
      "goals" INTEGER NOT NULL DEFAULT 0,
      "speech" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PlayerOfMonth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "PlayerOfMonth_month_year_key" ON "PlayerOfMonth"("month", "year");

    CREATE TABLE IF NOT EXISTS "MarketValueEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "value" REAL NOT NULL,
      "reason" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "MarketValueEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `;

  const statements = sql.split(';').filter(s => s.trim().length > 0);
  for (const stmt of statements) {
    try {
      await db.$executeRawUnsafe(stmt.trim());
    } catch (e: any) {
      if (!e.message?.includes('already exists') && !e.message?.includes('duplicate')) {
        console.warn('Table creation warning:', e.message);
      }
    }
  }

  // Migrate existing tables that might be missing new columns
  await ensureColumns();
}

async function seedDatabase() {
  try {
    await ensureTables();
    const userCount = await db.user.count();
    if (userCount > 0) return;
  } catch (e) {
    try {
      await ensureTables();
    } catch {
      return;
    }
  }

  console.log('🌱 Auto-seeding database...');

  const hash = await hashPassword('123456');

  // Deterministic IDs so JWT tokens survive cold starts (Vercel ephemeral SQLite)
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
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const user = await db.user.create({
      data: {
        id: p.id,
        email: p.email,
        passwordHash: hash,
        name: p.name,
        congregation: p.congregation,
        playerType: 'mensalista',
        position: p.position,
        role: (p as any).role || 'player',
        skillsJson: JSON.stringify({ defense: 6, attack: 6, passing: 6, technique: 6, stamina: 6 }),
        overallRating: 5.0,
        gamesPlayed: 0,
        mvpCount: 0,
        notificationsEnabled: true,
      },
    });
    createdUsers.push(user);
  }

  console.log('✅ 12 mensalistas criados');

  // Create Palestrinha bot user
  try {
    await db.user.create({
      data: {
        id: 'user-palestrinha-bot',
        email: 'palestrinha-bot@futebolbonfim.pt',
        passwordHash: await hashPassword('no-login-bot'),
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
    console.log('✅ Palestrinha bot criado');
  } catch {
    // Bot already exists
  }

  // Create game on upcoming Saturday
  const gameDate = new Date();
  const dayOfWeek = gameDate.getDay();
  const daysUntilSaturday = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
  gameDate.setDate(gameDate.getDate() + daysUntilSaturday);
  gameDate.setHours(19, 0, 0, 0);

  // Confirmation deadline: Wednesday 12h before game
  const confirmationDeadline = new Date(gameDate);
  confirmationDeadline.setDate(confirmationDeadline.getDate() - 3);
  confirmationDeadline.setHours(12, 0, 0, 0);

  const game = await db.game.create({
    data: {
      date: gameDate,
      location: 'Pavilhão Municipal de Setúbal',
      maxPlayers: 12,
      status: 'open',
      confirmationDeadline,
    },
  });

  console.log('✅ Jogo criado');

  // Create some sample transactions
  await db.transaction.createMany({
    data: [
      { type: 'saida', amount: 40.0, category: 'Instalações', description: 'Pagamento do pavilhão', isPaid: true, paidAt: new Date() },
    ],
  });

  // Create colete schedule for 2026 with exact washing order (only if not exists)
  const existing2026 = await db.coleteSchedule.findFirst({ where: { year: 2026 } });
  if (!existing2026) {
    const currentMonth = new Date().getMonth(); // 0-11
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

    const monthsJson = months2026.map((m) => ({
      ...m,
      status: m.monthIndex < currentMonth ? 'done' : m.monthIndex === currentMonth ? 'current' : 'pending',
    }));

    await db.coleteSchedule.create({
      data: { year: 2026, monthsJson: JSON.stringify(monthsJson) },
    });

    console.log('✅ Calendário de coletes 2026 criado');
  } else {
    console.log('ℹ️ Calendário de coletes 2026 já existe');
  }

  console.log('🎉 Auto-seed complete!');
}
