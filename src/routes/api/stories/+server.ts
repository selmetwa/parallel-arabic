import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStoriesPaginated } from '$lib/helpers/story-helpers';
import { BLOCKED_STORY_IDS } from '$lib/constants/stories/blocked';

// Helper function to get display names for dialects
function getDialectDisplayName(dialect: string) {
  const dialectNames: Record<string, string> = {
    'egyptian-arabic': 'Egyptian Arabic',
    'darija': 'Moroccan Darija',
    'fusha': 'Modern Standard Arabic',
    'levantine': 'Levantine Arabic',
  };

  return dialectNames[dialect] || dialect;
}

// Function to filter out incomplete sentences
function filterValidSentences(sentences: unknown[]) {
  if (!Array.isArray(sentences)) return [];
  return sentences.filter((sentence: unknown) => {
    const s = sentence as { arabic?: { text?: string }; english?: { text?: string }; transliteration?: { text?: string } };
    return (
      s &&
      s.arabic?.text &&
      s.english?.text &&
      s.transliteration?.text &&
      typeof s.arabic.text === 'string' &&
      typeof s.english.text === 'string' &&
      typeof s.transliteration.text === 'string' &&
      s.arabic.text.trim() !== '' &&
      s.english.text.trim() !== '' &&
      s.transliteration.text.trim() !== ''
    );
  });
}

export const GET: RequestHandler = async ({ url }) => {
  const cursor = url.searchParams.get('cursor');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '12', 10);
  const dialect = url.searchParams.get('dialect') || undefined;
  const difficulty = url.searchParams.get('difficulty') || undefined;
  const search = url.searchParams.get('search') || undefined;

  try {
    const result = await getStoriesPaginated(cursor, pageSize, {
      dialect,
      difficulty,
      search
    });

    if (!result.success) {
      return json({ error: result.error }, { status: 500 });
    }

    // Transform stories to the expected format
    const transformedStories = (result.stories || [])
      .filter((story: any) => !BLOCKED_STORY_IDS.includes(story.id))
      .map((story: any) => {
        const storyBody = story.story_body;
        const validSentences = filterValidSentences(storyBody?.sentences || []);

        return {
          id: story.id,
          title: `${storyBody?.title?.english || ''} / ${storyBody?.title?.arabic || ''}`,
          description: story.description,
          createdAt: story.created_at,
          difficulty: story.difficulty,
          dialect: story.dialect,
          dialectName: getDialectDisplayName(story.dialect),
          length: validSentences.length
        };
      });

    return json({
      stories: transformedStories,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore
    });
  } catch (error) {
    console.error('Error in stories API:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
