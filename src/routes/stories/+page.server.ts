import { getStoriesPaginated } from '$lib/helpers/story-helpers';
import { BLOCKED_STORY_IDS } from '$lib/constants/stories/blocked';

const PAGE_SIZE = 12;

export const load = async ({ parent }) => {
  // Get session and subscription status from layout
  const { session, isSubscribed, user } = await parent();

  // Fetch initial page of stories with pagination
  const storiesResult = await getStoriesPaginated(null, PAGE_SIZE);

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

  return {
    session,
    isSubscribed,
    hasActiveSubscription: isSubscribed,
    user_generated_stories: initialStories,
    nextCursor,
    hasMore,
    user
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
