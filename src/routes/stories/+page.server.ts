import { getStoriesPaginated, getStoryById } from '$lib/helpers/story-helpers';
import { BLOCKED_STORY_IDS } from '$lib/constants/stories/blocked';
import { getDefaultDialect } from '$lib/helpers/get-default-dialect';

const PAGE_SIZE = 12;

function proficiencyToDifficulty(level: string | null | undefined): string | null {
  if (!level) return null;

  const _level = level.toLowerCase();
  return _level;  
}

const VALID_DIALECTS = ['egyptian-arabic', 'darija', 'levantine', 'fusha'];

export const load = async ({ parent, locals, url }) => {
  // Get session and subscription status from layout
  const { session, isSubscribed, user } = await parent();

  // Use dialect query param if present and valid, otherwise fall back to user's target dialect
  const dialectParam = url.searchParams.get('dialect');
  const initialDialect = dialectParam && VALID_DIALECTS.includes(dialectParam)
    ? dialectParam
    : getDefaultDialect(user);

  // Fetch initial page of stories with pagination, filtered by dialect
  const storiesResult = await getStoriesPaginated(null, PAGE_SIZE, { dialect: initialDialect });

  let initialStories: object[] = [];
  let nextCursor: string | null = null;
  let hasMore = false;

  if (storiesResult.success && storiesResult.stories) {
    // Filter blocked stories and add dialect display names
    initialStories = storiesResult.stories
      .filter((story: any) => !BLOCKED_STORY_IDS.includes(story.id))
      .map((story: object) => {
        const storyWithDialect = story as { dialect: string };
        return {
          ...story,
          dialect_name: getDialectDisplayName(storyWithDialect.dialect)
        };
      });
    nextCursor = storiesResult.nextCursor || null;
    hasMore = storiesResult.hasMore || false;
  } else if (!storiesResult.success) {
    console.error('Error fetching stories:', storiesResult.error);
  }

  // Fetch completed story IDs for the logged-in user
  let completedStoryIds: string[] = [];
  if (user?.id) {
    const { data: completions } = await locals.supabase
      .from('user_story_completion')
      .select('story_id')
      .eq('user_id', user.id);
    completedStoryIds = completions?.map((c: any) => c.story_id) ?? [];
  }

  const completedSet = new Set(completedStoryIds);

  // Fetch resume story: last story accessed that isn't completed
  let resumeStory: { id: string; title: string } | null = null;
  if (
    user?.last_content_type === 'stories' &&
    user?.last_content_id &&
    !completedSet.has(user.last_content_id)
  ) {
    const result = await getStoryById(user.last_content_id);
    if (result.success && result.story) {
      const s = result.story as any;
      const storyBody = typeof s.story_body === 'string' ? JSON.parse(s.story_body) : s.story_body;
      resumeStory = {
        id: user.last_content_id,
        title: storyBody?.title?.english || s.title || 'Continue Reading'
      };
    }
  }

  // Fetch recommended stories: filtered by dialect + proficiency-mapped difficulty
  let recommendedStories: object[] = [];
  const difficulty = user ? proficiencyToDifficulty(user.proficiency_level) : null;
  const targetDialect = user?.target_dialect || 'egyptian-arabic';
  const recFilters: { dialect?: string; difficulty?: string } = { dialect: targetDialect };
  if (difficulty) recFilters.difficulty = difficulty;

  const recResult = await getStoriesPaginated(null, 12, recFilters);
  console.log({ recResult, recFilters })
  if (recResult.success && recResult.stories) {
    recommendedStories = recResult.stories
      .filter((s: any) => !BLOCKED_STORY_IDS.includes(s.id) && !completedSet.has(s.id))
      .slice(0, 6)
      .map((story: object) => {
        const storyWithDialect = story as { dialect: string; story_body: any; id: string; difficulty: string };
        const storyBody = typeof storyWithDialect.story_body === 'string'
          ? JSON.parse(storyWithDialect.story_body)
          : storyWithDialect.story_body;
        return {
          id: storyWithDialect.id,
          title: `${storyBody?.title?.english || ''} / ${storyBody?.title?.arabic || ''}`,
          dialect: storyWithDialect.dialect,
          dialectName: getDialectDisplayName(storyWithDialect.dialect),
          difficulty: storyWithDialect.difficulty,
        };
      });
  }

  return {
    session,
    isSubscribed,
    hasActiveSubscription: isSubscribed,
    user_generated_stories: initialStories,
    nextCursor,
    hasMore,
    user,
    completedStoryIds,
    initialDialect,
    resumeStory,
    recommendedStories,
  };
};

// Helper function to get display names for dialects
function getDialectDisplayName(dialect: string) {
  const dialectNames = {
    'egyptian-arabic': 'Egyptian Arabic',
    'darija': 'Moroccan Darija',
    'fusha': 'Modern Standard Arabic',
    'levantine': 'Levantine Arabic',
  };
  
  return dialectNames[dialect as keyof typeof dialectNames] || dialect;
}
