import { supabase } from '$lib/supabaseClient';
import { downloadStoryFromStorage, getAudioUrl } from './storage-helpers';
import { getCached, setCached, CACHE_KEYS, CACHE_TTL } from '$lib/server/redis';

/**
 * Get a story by ID with full JSON content from storage
 * Uses Redis caching for improved performance
 */
export async function getStoryById(storyId: string): Promise<{ success: boolean; story?: object; error?: string }> {
  try {
    // Check Redis cache first
    const cacheKey = CACHE_KEYS.STORY_SINGLE(storyId);
    const cached = await getCached<object>(cacheKey);
    if (cached) {
      return { success: true, story: cached };
    }

    // First, get the story metadata from database
    const { data: storyMetadata, error: dbError } = await supabase
      .from('generated_story')
      .select('*')
      .eq('id', storyId)
      .single();

    if (dbError || !storyMetadata) {
      console.error('Story not found in database:', dbError);
      return { success: false, error: 'Story not found' };
    }

    // Download the story content from storage
    const storageResult = await downloadStoryFromStorage(storyMetadata.story_body);
    
    if (!storageResult.success) {
      console.error('Failed to download story from storage:', storageResult.error);
      return { success: false, error: `Failed to load story content: ${storageResult.error}` };
    }

    // Get audio URL if available
    let audioUrl = null;
    if (storyMetadata.audio_file_key) {
      const audioResult = await getAudioUrl(storyMetadata.audio_file_key);
      if (audioResult.success) {
        audioUrl = audioResult.url;
      }
    }

    // Combine metadata with story content and audio URL
    const fullStory = {
      ...storyMetadata,
      story_body: storageResult.data, // Replace file key with actual JSON content
      audio_url: audioUrl // Add audio URL if available
    };

    // Cache the result
    await setCached(cacheKey, fullStory, CACHE_TTL.STORY_SINGLE);

    return { success: true, story: fullStory };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get stories by user ID with full JSON content from storage
 */
export async function getStoriesByUser(userId: string): Promise<{ success: boolean; stories?: object[]; error?: string }> {
  try {
    // Get all story metadata for the user
    const { data: storiesMetadata, error: dbError } = await supabase
      .from('generated_story')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Error fetching user stories:', dbError);
      return { success: false, error: 'Failed to fetch stories' };
    }

    if (!storiesMetadata || storiesMetadata.length === 0) {
      return { success: true, stories: [] };
    }

    // Download story content and get audio URLs for each story in parallel
    const storiesWithContent = await Promise.all(
      storiesMetadata.map(async (storyMeta) => {
        // Download story content
        const storageResult = await downloadStoryFromStorage(storyMeta.story_body);
        
        // Get audio URL if available
        let audioUrl = null;
        if (storyMeta.audio_file_key) {
          const audioResult = await getAudioUrl(storyMeta.audio_file_key);
          if (audioResult.success) {
            audioUrl = audioResult.url;
          }
        }
        
        if (!storageResult.success) {
          console.warn(`Failed to load content for story ${storyMeta.id}:`, storageResult.error);
          // Return story without content rather than failing entirely
          return {
            ...storyMeta,
            story_body: null, // Indicate content failed to load
            content_error: storageResult.error,
            audio_url: audioUrl
          };
        }

        return {
          ...storyMeta,
          story_body: storageResult.data,
          audio_url: audioUrl
        };
      })
    );

    return { success: true, stories: storiesWithContent };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get all stories from all dialects with full JSON content from storage
 * Uses Redis caching for improved performance
 */
export async function getAllStories(limit?: number): Promise<{ success: boolean; stories?: object[]; error?: string }> {
  try {
    // Only cache if no limit (full list)
    const cacheKey = limit ? null : CACHE_KEYS.STORIES_ALL;
    
    if (cacheKey) {
      const cached = await getCached<object[]>(cacheKey);
      if (cached) {
        return { success: true, stories: cached };
      }
    }

    let query = supabase
      .from('generated_story')
      .select('*')
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data: storiesMetadata, error: dbError } = await query;

    if (dbError) {
      console.error('Error fetching all stories:', dbError);
      return { success: false, error: 'Failed to fetch stories' };
    }

    if (!storiesMetadata || storiesMetadata.length === 0) {
      return { success: true, stories: [] };
    }

    // Download story content and get audio URLs for each story in parallel
    const storiesWithContent = await Promise.all(
      storiesMetadata.map(async (storyMeta) => {
        // Download story content
        const storageResult = await downloadStoryFromStorage(storyMeta.story_body);
        
        // Get audio URL if available
        let audioUrl = null;
        if (storyMeta.audio_file_key) {
          const audioResult = await getAudioUrl(storyMeta.audio_file_key);
          if (audioResult.success) {
            audioUrl = audioResult.url;
          }
        }
        
        if (!storageResult.success) {
          console.warn(`Failed to load content for story ${storyMeta.id}:`, storageResult.error);
          return {
            ...storyMeta,
            story_body: null,
            content_error: storageResult.error,
            audio_url: audioUrl
          };
        }

        return {
          ...storyMeta,
          story_body: storageResult.data,
          audio_url: audioUrl
        };
      })
    );

    // Cache the result (only if no limit)
    if (cacheKey) {
      await setCached(cacheKey, storiesWithContent, CACHE_TTL.STORIES_ALL);
    }

    return { success: true, stories: storiesWithContent };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Paginated story result type
 */
export type PaginatedStoriesResult = {
  success: boolean;
  stories?: object[];
  nextCursor?: string | null;
  hasMore?: boolean;
  error?: string;
};

/**
 * Get stories with cursor-based pagination using createdAt timestamp
 * Returns stories created before the cursor timestamp
 */
export async function getStoriesPaginated(
  cursor?: string | null,
  pageSize: number = 12,
  filters?: {
    dialect?: string;
    difficulty?: string;
    search?: string;
  }
): Promise<PaginatedStoriesResult> {
  try {
    let query = supabase
      .from('generated_story')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(pageSize + 1); // Fetch one extra to check if there are more

    // Apply cursor filter (fetch stories created before the cursor)
    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    // Apply optional filters
    if (filters?.dialect && filters.dialect !== 'all') {
      query = query.eq('dialect', filters.dialect);
    }

    if (filters?.difficulty && filters.difficulty !== 'all') {
      query = query.ilike('difficulty', filters.difficulty);
    }

    const { data: storiesMetadata, error: dbError } = await query;

    if (dbError) {
      console.error('Error fetching paginated stories:', dbError);
      return { success: false, error: 'Failed to fetch stories' };
    }

    if (!storiesMetadata || storiesMetadata.length === 0) {
      return { success: true, stories: [], nextCursor: null, hasMore: false };
    }

    // Check if there are more stories
    const hasMore = storiesMetadata.length > pageSize;
    const storiesToProcess = hasMore ? storiesMetadata.slice(0, pageSize) : storiesMetadata;

    // Download story content and get audio URLs for each story in parallel
    const storiesWithContent = await Promise.all(
      storiesToProcess.map(async (storyMeta) => {
        const storageResult = await downloadStoryFromStorage(storyMeta.story_body);

        let audioUrl = null;
        if (storyMeta.audio_file_key) {
          const audioResult = await getAudioUrl(storyMeta.audio_file_key);
          if (audioResult.success) {
            audioUrl = audioResult.url;
          }
        }

        if (!storageResult.success) {
          console.warn(`Failed to load content for story ${storyMeta.id}:`, storageResult.error);
          return {
            ...storyMeta,
            story_body: null,
            content_error: storageResult.error,
            audio_url: audioUrl
          };
        }

        return {
          ...storyMeta,
          story_body: storageResult.data,
          audio_url: audioUrl
        };
      })
    );

    // The next cursor is the created_at of the last story in the current page
    const nextCursor = hasMore ? storiesToProcess[storiesToProcess.length - 1].created_at : null;

    return {
      success: true,
      stories: storiesWithContent,
      nextCursor,
      hasMore
    };
  } catch (error) {
    console.error('Error in getStoriesPaginated:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get stories by dialect with full JSON content from storage
 * Uses Redis caching for improved performance
 */
export async function getStoriesByDialect(dialect: string, limit?: number): Promise<{ success: boolean; stories?: object[]; error?: string }> {
  try {
    // Only cache if no limit (full list for dialect)
    const cacheKey = limit ? null : CACHE_KEYS.STORIES_DIALECT(dialect);
    
    if (cacheKey) {
      const cached = await getCached<object[]>(cacheKey);
      if (cached) {
        return { success: true, stories: cached };
      }
    }

    let query = supabase
      .from('generated_story')
      .select('*')
      .eq('dialect', dialect)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data: storiesMetadata, error: dbError } = await query;

    if (dbError) {
      console.error(`Error fetching ${dialect} stories:`, dbError);
      return { success: false, error: 'Failed to fetch stories' };
    }

    if (!storiesMetadata || storiesMetadata.length === 0) {
      return { success: true, stories: [] };
    }

    // Download story content and get audio URLs for each story in parallel
    const storiesWithContent = await Promise.all(
      storiesMetadata.map(async (storyMeta) => {
        // Download story content
        const storageResult = await downloadStoryFromStorage(storyMeta.story_body);
        
        // Get audio URL if available
        let audioUrl = null;
        if (storyMeta.audio_file_key) {
          const audioResult = await getAudioUrl(storyMeta.audio_file_key);
          if (audioResult.success) {
            audioUrl = audioResult.url;
          }
        }
        
        if (!storageResult.success) {
          console.warn(`Failed to load content for story ${storyMeta.id}:`, storageResult.error);
          return {
            ...storyMeta,
            story_body: null,
            content_error: storageResult.error,
            audio_url: audioUrl
          };
        }

        return {
          ...storyMeta,
          story_body: storageResult.data,
          audio_url: audioUrl
        };
      })
    );

    // Cache the result (only if no limit)
    if (cacheKey) {
      await setCached(cacheKey, storiesWithContent, CACHE_TTL.STORIES_DIALECT);
    }

    console.log(`✅ Retrieved ${storiesWithContent.length} ${dialect} stories`);
    return { success: true, stories: storiesWithContent };
  } catch (error) {
    console.error('Error retrieving stories by dialect:', error);
    return { success: false, error: (error as Error).message };
  }
}
