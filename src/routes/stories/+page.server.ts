import { getAllStories } from '$lib/helpers/story-helpers';

export const load = async ({ parent }) => {
  // Get session and subscription status from layout
  const { session, isSubscribed, user } = await parent();
  
  // Fetch all generated stories in one efficient query
  const storiesResult = await getAllStories();
  
  let allUserGeneratedStories: object[] = [];
  
  if (storiesResult.success && storiesResult.stories) {
    // Add dialect display names to each story
    allUserGeneratedStories = storiesResult.stories.map((story: object) => {
      const storyWithDialect = story as { dialect: string };
      return {
        ...story,
        dialect_name: getDialectDisplayName(storyWithDialect.dialect)
      };
    });
  } else if (!storiesResult.success) {
    console.error('Error fetching stories:', storiesResult.error);
  }

  // Stories are already sorted by created_at desc from the query
  return {
    session,
    isSubscribed,
    hasActiveSubscription: isSubscribed, // Keep for backward compatibility
    user_generated_stories: allUserGeneratedStories,
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
