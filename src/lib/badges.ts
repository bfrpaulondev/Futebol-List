import { db } from '@/lib/db';

export type BadgeCategory = 'streak' | 'goals' | 'mvp' | 'special' | 'funny';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';

export interface BadgeDefinition {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  tier: BadgeTier;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // --- Streak badges ---
  {
    slug: 'fogo',
    name: 'Fogo! 🔥',
    description: '5 jogos consecutivos',
    icon: '🔥',
    category: 'streak',
    tier: 'silver',
  },
  {
    slug: 'diamante',
    name: 'Diamante 💎',
    description: '20 jogos consecutivos',
    icon: '💎',
    category: 'streak',
    tier: 'gold',
  },
  {
    slug: 'lenda',
    name: 'Lenda 👑',
    description: '50 jogos consecutivos',
    icon: '👑',
    category: 'streak',
    tier: 'legendary',
  },

  // --- Goal badges ---
  {
    slug: 'primeiro-golo',
    name: 'Primeiro Golo ⚽',
    description: 'Marca o teu primeiro golo',
    icon: '⚽',
    category: 'goals',
    tier: 'bronze',
  },
  {
    slug: 'hat-trick',
    name: 'Hat-Trick 🎩',
    description: 'Marca 3 golos num jogo',
    icon: '🎩',
    category: 'goals',
    tier: 'gold',
  },
  {
    slug: 'goleador-10',
    name: 'Goleador (10) 🥅',
    description: '10 golos no total',
    icon: '🥅',
    category: 'goals',
    tier: 'silver',
  },
  {
    slug: 'goleador-50',
    name: 'Goleador (50) 🏆',
    description: '50 golos no total',
    icon: '🏆',
    category: 'goals',
    tier: 'platinum',
  },

  // --- Assist badges ---
  {
    slug: 'assistente-10',
    name: 'Assistente (10) 👟',
    description: '10 assistências no total',
    icon: '👟',
    category: 'goals',
    tier: 'silver',
  },
  {
    slug: 'assistente-50',
    name: 'Assistente (50) 🎯',
    description: '50 assistências no total',
    icon: '🎯',
    category: 'goals',
    tier: 'platinum',
  },

  // --- MVP badges ---
  {
    slug: 'primeiro-mvp',
    name: 'Primeiro MVP 🌟',
    description: 'O teu primeiro MVP',
    icon: '🌟',
    category: 'mvp',
    tier: 'bronze',
  },
  {
    slug: 'mvp-5x',
    name: 'MVP 5x ⭐',
    description: '5 MVPs no total',
    icon: '⭐',
    category: 'mvp',
    tier: 'gold',
  },
  {
    slug: 'mvp-10x',
    name: 'MVP 10x 💫',
    description: '10 MVPs no total',
    icon: '💫',
    category: 'mvp',
    tier: 'platinum',
  },
  {
    slug: 'imbativel',
    name: 'Imbatível 🛡️',
    description: 'MVP 3 jogos seguidos',
    icon: '🛡️',
    category: 'mvp',
    tier: 'legendary',
  },

  // --- Special badges ---
  {
    slug: 'lavador-de-coletes',
    name: 'Lavador de Coletes 🧺',
    description: 'Lavaste os coletes this month',
    icon: '🧺',
    category: 'special',
    tier: 'bronze',
  },

  // --- Funny badges ---
  {
    slug: 'queixoso',
    name: 'Queixoso 📝',
    description: '10 queixas filed',
    icon: '📝',
    category: 'funny',
    tier: 'silver',
  },
  {
    slug: 'alvo-de-queixas',
    name: 'Alvo de Queixas 😤',
    description: '10 queixas received',
    icon: '😤',
    category: 'funny',
    tier: 'silver',
  },
];

/**
 * Seed badge definitions into the database (idempotent)
 */
export async function seedBadges(): Promise<void> {
  for (const badgeDef of BADGE_DEFINITIONS) {
    await db.badge.upsert({
      where: { slug: badgeDef.slug },
      create: {
        slug: badgeDef.slug,
        name: badgeDef.name,
        description: badgeDef.description,
        icon: badgeDef.icon,
        category: badgeDef.category,
        tier: badgeDef.tier,
      },
      update: {
        name: badgeDef.name,
        description: badgeDef.description,
        icon: badgeDef.icon,
        category: badgeDef.category,
        tier: badgeDef.tier,
      },
    });
  }
}

/**
 * Check if a user qualifies for any badges and award them.
 * Returns newly awarded badges.
 */
export async function checkAndAwardBadges(userId: string): Promise<any[]> {
  // Ensure badges are seeded
  await seedBadges();

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      badges: {
        include: { badge: true },
      },
      gameStats: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!user) return [];

  // Get existing badge slugs
  const earnedSlugs = new Set(user.badges.map((ub: any) => ub.badge.slug));

  // Get all badge definitions from DB
  const allBadges = await db.badge.findMany();
  const badgeBySlug = new Map(allBadges.map((b) => [b.slug, b]));

  const newBadges: any[] = [];

  // Check each badge condition
  const check = async (slug: string, condition: boolean) => {
    if (condition && !earnedSlugs.has(slug)) {
      const badge = badgeBySlug.get(slug);
      if (badge) {
        const userBadge = await db.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
          },
          include: { badge: true },
        });
        newBadges.push(userBadge);
      }
    }
  };

  // Streak badges
  await check('fogo', user.consecutiveGames >= 5);
  await check('diamante', user.consecutiveGames >= 20);
  await check('lenda', user.consecutiveGames >= 50);

  // Goal badges
  await check('primeiro-golo', user.totalGoals >= 1);
  await check('goleador-10', user.totalGoals >= 10);
  await check('goleador-50', user.totalGoals >= 50);

  // Check hat-trick from recent game stats
  const lastGameStat = user.gameStats[0];
  if (lastGameStat && lastGameStat.goals >= 3) {
    await check('hat-trick', true);
  }

  // Assist badges
  await check('assistente-10', user.totalAssists >= 10);
  await check('assistente-50', user.totalAssists >= 50);

  // MVP badges
  await check('primeiro-mvp', user.mvpCount >= 1);
  await check('mvp-5x', user.mvpCount >= 5);
  await check('mvp-10x', user.mvpCount >= 10);

  // Check imbativel (MVP 3 games in a row)
  // Check last 3 games where this user was MVP
  if (user.gameStats.length >= 3) {
    const recentMvpGames = user.gameStats.filter((s: any) => s.isMvp);
    if (recentMvpGames.length >= 3) {
      // Check if they are consecutive (by game order)
      // The gameStats are ordered by createdAt desc, so we need to check
      // if the first 3 are all MVPs
      const firstThree = user.gameStats.slice(0, 3);
      if (firstThree.every((s: any) => s.isMvp)) {
        await check('imbativel', true);
      }
    }
  }

  // Funny badges
  await check('queixoso', user.complaintsFiled >= 10);
  await check('alvo-de-queixas', user.complaintsReceived >= 10);

  return newBadges;
}

/**
 * Calculate market value change based on user performance.
 * Returns the new value and the reason for the change.
 */
export function getMarketValueChange(user: {
  totalGoals: number;
  totalAssists: number;
  mvpCount: number;
  overallRating: number;
  consecutiveGames: number;
  gamesPlayed: number;
}): { newValue: number; reason: string } {
  const currentValue = user.marketValue || 2.5;

  // Base formula: rating heavily weighted, with bonuses for goals/assists/mvp
  let newValue = 2.0; // Base minimum

  // Rating contribution (0-10 mapped to 0-3.0)
  newValue += (user.overallRating / 10) * 3.0;

  // Goals contribution (capped)
  newValue += Math.min(user.totalGoals * 0.03, 1.5);

  // Assists contribution (capped)
  newValue += Math.min(user.totalAssists * 0.02, 1.0);

  // MVP contribution (capped)
  newValue += Math.min(user.mvpCount * 0.15, 2.0);

  // Streak bonus
  if (user.consecutiveGames >= 20) newValue += 0.5;
  else if (user.consecutiveGames >= 10) newValue += 0.3;
  else if (user.consecutiveGames >= 5) newValue += 0.15;

  // Games played bonus (capped)
  newValue += Math.min(user.gamesPlayed * 0.01, 0.5);

  // Clamp between 1.0 and 15.0
  newValue = Math.max(1.0, Math.min(15.0, Math.round(newValue * 100) / 100));

  // Determine reason
  const reasons: string[] = [];
  if (user.mvpCount > 0) reasons.push(`${user.mvpCount} MVP${user.mvpCount > 1 ? 's' : ''}`);
  if (user.totalGoals > 0) reasons.push(`${user.totalGoals} golo${user.totalGoals > 1 ? 's' : ''}`);
  if (user.totalAssists > 0) reasons.push(`${user.totalAssists} assistência${user.totalAssists > 1 ? 's' : ''}`);
  if (user.consecutiveGames >= 5) reasons.push(`${user.consecutiveGames} jogos seguidos`);

  const diff = newValue - currentValue;
  let reason = '';
  if (Math.abs(diff) < 0.05) {
    reason = 'Valor estável';
  } else if (diff > 0) {
    reason = reasons.length > 0
      ? `Valor a subir! ${reasons.join(', ')}`
      : 'Valor a subir!';
  } else {
    reason = 'Ajuste de mercado';
  }

  return { newValue, reason };
}
