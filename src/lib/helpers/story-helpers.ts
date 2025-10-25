import { supabase } from '$lib/supabaseClient';
import { downloadStoryFromStorage, getAudioUrl } from './storage-helpers';

/**
 * Get a story by ID with full JSON content from storage
 */
export async function getStoryById(storyId: string): Promise<{ success: boolean; story?: object; error?: string }> {
  try {
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

    console.log('✅ Story retrieved successfully:', storyId);
    return { success: true, story: fullStory };
  } catch (error) {
    console.error('Error retrieving story:', error);
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

    console.log(`✅ Retrieved ${storiesWithContent.length} stories for user ${userId}`);
    return { success: true, stories: storiesWithContent };
  } catch (error) {
    console.error('Error retrieving user stories:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get all stories from all dialects with full JSON content from storage
 */
export async function getAllStories(limit?: number): Promise<{ success: boolean; stories?: object[]; error?: string }> {
  try {
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

    console.log(`✅ Retrieved ${storiesWithContent.length} stories from all dialects`);
    return { success: true, stories: storiesWithContent };
  } catch (error) {
    console.error('Error retrieving all stories:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get stories by dialect with full JSON content from storage
 */
export async function getStoriesByDialect(dialect: string, limit?: number): Promise<{ success: boolean; stories?: object[]; error?: string }> {
  try {
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

    console.log(`✅ Retrieved ${storiesWithContent.length} ${dialect} stories`);
    return { success: true, stories: storiesWithContent };
  } catch (error) {
    console.error('Error retrieving stories by dialect:', error);
    return { success: false, error: (error as Error).message };
  }
}
