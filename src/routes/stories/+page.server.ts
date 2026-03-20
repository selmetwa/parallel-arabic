import { getStoriesPaginated } from '$lib/helpers/story-helpers';
import { BLOCKED_STORY_IDS } from '$lib/constants/stories/blocked';
import { getDefaultDialect } from '$lib/helpers/get-default-dialect';

const PAGE_SIZE = 12;

export const load = async ({ parent, locals }) => {
  // Get session and subscription status from layout
  const { session, isSubscribed, user } = await parent();

  // Default filter to the user's target dialect (or egyptian-arabic)
  const initialDialect = getDefaultDialect(user);

  // Fetch initial page of stories with pagination, filtered by user's dialect
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

  return {
    session,
    isSubscribed,
    hasActiveSubscription: isSubscribed,
    user_generated_stories: initialStories,
    nextCursor,
    hasMore,
    user,
    completedStoryIds,
    initialDialect
  };
};

// Helper function to get display names for dialects
function getDialectDisplayName(dialect: string) {
  const dialectNames = {
    'egyptian-arabic': 'Egyptian Arabic',
    'darija': 'Moroccan Darija',
    'fusha': 'Modern Standard Arabic',
  };
  
  return dialectNames[dialect as keyof typeof dialectNames] || dialect;
}
