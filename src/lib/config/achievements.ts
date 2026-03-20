export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'diamond';
export type AchievementCategory = 'sentences' | 'stories' | 'lessons' | 'reviews' | 'games' | 'streak';

export interface Achievement {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  tier: AchievementTier;
  earned: boolean;
  threshold: number;
}

export interface AchievementStats {
  sentences: number;
  stories: number;
  lessons: number;
  reviews: number;
  games: number;
  longestStreak: number;
}

export const TIER_META: Record<AchievementTier, { label: string; circleFill: [string, string]; iconColor: string; ringColor: string }> = {
  bronze:  { label: 'Bronze',  circleFill: ['#C07838', '#8B5213'], iconColor: '#FFE0B2', ringColor: '#7B4A18' },
  silver:  { label: 'Silver',  circleFill: ['#8E9BB0', '#5A6478'], iconColor: '#E8EDF5', ringColor: '#445066' },
  gold:    { label: 'Gold',    circleFill: ['#E6B800', '#9A7D00'], iconColor: '#FFF9C4', ringColor: '#7A6000' },
  diamond: { label: 'Diamond', circleFill: ['#22D3EE', '#0891B2'], iconColor: '#E0F7FF', ringColor: '#0369A1' },
};

interface AchievementDefinition {
  category: AchievementCategory;
  tier: AchievementTier;
  name: string;
  threshold: number;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Sentences
  { category: 'sentences', tier: 'bronze',  name: 'Word Taster',     threshold: 100  },
  { category: 'sentences', tier: 'silver',  name: 'Phrase Hunter',   threshold: 500  },
  { category: 'sentences', tier: 'gold',    name: 'Sentence Master', threshold: 2000 },
  { category: 'sentences', tier: 'diamond', name: 'Fluent Reader',   threshold: 8000 },

  // Stories
  { category: 'stories', tier: 'bronze',  name: 'First Chapter',  threshold: 5   },
  { category: 'stories', tier: 'silver',  name: 'Story Lover',    threshold: 25  },
  { category: 'stories', tier: 'gold',    name: 'Storyteller',    threshold: 100 },
  { category: 'stories', tier: 'diamond', name: 'Story Addict',   threshold: 500 },

  // Lessons
  { category: 'lessons', tier: 'bronze',  name: 'First Lesson',      threshold: 3   },
  { category: 'lessons', tier: 'silver',  name: 'Dedicated Student', threshold: 15  },
  { category: 'lessons', tier: 'gold',    name: 'Scholar',           threshold: 50  },
  { category: 'lessons', tier: 'diamond', name: 'Master Scholar',    threshold: 150 },

  // Reviews
  { category: 'reviews', tier: 'bronze',  name: 'First Review',       threshold: 25   },
  { category: 'reviews', tier: 'silver',  name: 'Vocabulary Builder', threshold: 100  },
  { category: 'reviews', tier: 'gold',    name: 'Word Keeper',        threshold: 500  },
  { category: 'reviews', tier: 'diamond', name: 'Memory Champion',    threshold: 2000 },

  // Games
  { category: 'games', tier: 'bronze',  name: 'Game On',   threshold: 5   },
  { category: 'games', tier: 'silver',  name: 'Player',    threshold: 25  },
  { category: 'games', tier: 'gold',    name: 'Champion',  threshold: 100 },
  { category: 'games', tier: 'diamond', name: 'Legend',    threshold: 500 },

  // Streak
  { category: 'streak', tier: 'bronze',  name: 'On a Roll',     threshold: 7   },
  { category: 'streak', tier: 'silver',  name: 'Week Warrior',  threshold: 30  },
  { category: 'streak', tier: 'gold',    name: 'Month Master',  threshold: 100 },
  { category: 'streak', tier: 'diamond', name: 'Streak Legend', threshold: 365 },
];

const CATEGORY_DESCRIPTIONS: Record<AchievementCategory, (name: string, threshold: number) => string> = {
  sentences: (name, threshold) => `${name}: Practice ${threshold} sentence${threshold === 1 ? '' : 's'}`,
  stories:   (name, threshold) => `${name}: Generate ${threshold} stor${threshold === 1 ? 'y' : 'ies'}`,
  lessons:   (name, threshold) => `${name}: Complete ${threshold} lesson${threshold === 1 ? '' : 's'}`,
  reviews:   (name, threshold) => `${name}: Complete ${threshold} review${threshold === 1 ? '' : 's'}`,
  games:     (name, threshold) => `${name}: Play ${threshold} game${threshold === 1 ? '' : 's'}`,
  streak:    (name, threshold) => `${name}: Reach a ${threshold}-day streak`,
};

export function computeAchievements(stats: AchievementStats): Achievement[] {
  const statMap: Record<AchievementCategory, number> = {
    sentences: stats.sentences,
    stories:   stats.stories,
    lessons:   stats.lessons,
    reviews:   stats.reviews,
    games:     stats.games,
    streak:    stats.longestStreak,
  };

  return ACHIEVEMENT_DEFINITIONS.map((def) => ({
    id: `${def.category}-${def.tier}`,
    category: def.category,
    name: def.name,
    description: CATEGORY_DESCRIPTIONS[def.category](def.name, def.threshold),
    tier: def.tier,
    earned: statMap[def.category] >= def.threshold,
    threshold: def.threshold,
  }));
}
