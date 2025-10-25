import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';

const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY);

/**
 * Upload story JSON to the generated_story bucket
 */
export async function uploadStoryToStorage(storyId: string, storyData: object): Promise<{ success: boolean; fileKey?: string; error?: string }> {
  try {
    const fileName = `${storyId}.json`;
    const fileContent = JSON.stringify(storyData, null, 2);

    const { error } = await supabase.storage
      .from('generated_story')
      .upload(fileName, fileContent, {
        contentType: 'application/json',
        upsert: true // Allow overwriting if file exists
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Story uploaded to storage:', fileName);
    return { success: true, fileKey: fileName };
  } catch (error) {
    console.error('Story upload failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Download story JSON from the generated_story bucket
 */
export async function downloadStoryFromStorage(fileKey: string): Promise<{ success: boolean; data?: object; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from('generated_story')
      .download(fileKey);

    if (error) {
      console.error('Storage download error:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'No data returned from storage' };
    }

    // Convert blob to text and parse JSON
    const jsonText = await data.text();
    const storyData = JSON.parse(jsonText);

    console.log('✅ Story downloaded from storage:', fileKey);
    return { success: true, data: storyData };
  } catch (error) {
    console.error('Story download failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Upload video JSON to the video bucket
 */
export async function uploadVideoToStorage(videoId: string, videoData: object): Promise<{ success: boolean; fileKey?: string; error?: string }> {
  try {
    const fileName = `${videoId}.json`;
    const fileContent = JSON.stringify(videoData, null, 2);

    const { error } = await supabase.storage
      .from('video')
      .upload(fileName, fileContent, {
        contentType: 'application/json',
        upsert: true
      });

    if (error) {
      console.error('Video storage upload error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Video uploaded to storage:', fileName);
    return { success: true, fileKey: fileName };
  } catch (error) {
    console.error('Video upload failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Download video JSON from the video bucket
 */
export async function downloadVideoFromStorage(fileKey: string): Promise<{ success: boolean; data?: object; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from('video')
      .download(fileKey);

    if (error) {
      console.error('Video storage download error:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'No data returned from video storage' };
    }

    const jsonText = await data.text();
    const videoData = JSON.parse(jsonText);

    console.log('✅ Video downloaded from storage:', fileKey);
    return { success: true, data: videoData };
  } catch (error) {
    console.error('Video download failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete story from storage
 */
export async function deleteStoryFromStorage(fileKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from('generated_story')
      .remove([fileKey]);

    if (error) {
      console.error('Storage delete error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Story deleted from storage:', fileKey);
    return { success: true };
  } catch (error) {
    console.error('Story delete failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete video from storage
 */
export async function deleteVideoFromStorage(fileKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from('video')
      .remove([fileKey]);

    if (error) {
      console.error('Video storage delete error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Video deleted from storage:', fileKey);
    return { success: true };
  } catch (error) {
    console.error('Video delete failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Upload audio file to the generated_story_audio bucket
 */
export async function uploadAudioToStorage(storyId: string, dialect: string, audioBuffer: Buffer): Promise<{ success: boolean; fileKey?: string; publicUrl?: string; error?: string }> {
  try {
    const fileName = `${dialect}/${storyId}.mp3`;
    
    const { error } = await supabase.storage
      .from('generated_story_audio')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true // Allow overwriting if file exists
      });

    if (error) {
      console.error('Audio storage upload error:', error);
      return { success: false, error: error.message };
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('generated_story_audio')
      .getPublicUrl(fileName);

    console.log('✅ Audio uploaded to storage:', fileName);
    return { 
      success: true, 
      fileKey: fileName,
      publicUrl: urlData.publicUrl
    };
  } catch (error) {
    console.error('Audio upload failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get signed URL for audio file in storage (works for private buckets)
 */
export async function getAudioUrl(fileKey: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Try to get a signed URL first (works for private buckets)
    const { data, error } = await supabase.storage
      .from('generated_story_audio')
      .createSignedUrl(fileKey, 3600); // 1 hour expiry

    if (error) {
      console.error('Failed to create signed URL:', error);
      
      // Fallback: try public URL (in case bucket is public)
      console.log('🔄 Falling back to public URL...');
      const { data: publicData } = supabase.storage
        .from('generated_story_audio')
        .getPublicUrl(fileKey);
      
      return { success: true, url: publicData.publicUrl };
    }

    console.log('🔗 Signed Audio URL:', data.signedUrl);
    return { success: true, url: data.signedUrl };
  } catch (error) {
    console.error('Failed to get audio URL:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete audio from storage
 */
export async function deleteAudioFromStorage(fileKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from('generated_story_audio')
      .remove([fileKey]);

    if (error) {
      console.error('Audio storage delete error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Audio deleted from storage:', fileKey);
    return { success: true };
  } catch (error) {
    console.error('Audio delete failed:', error);
    return { success: false, error: (error as Error).message };
  }
}
