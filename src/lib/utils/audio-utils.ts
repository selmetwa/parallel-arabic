import fs from 'fs';
import path from 'path';

// Helper function to get the base data directory
function getDataDirectory(): string {
  return '/data';
  // return 'data' // for local development
}

export function getStoryAudioPath(storyId: string, dialect: string): string | null {
  try {
    const dialectDir = dialect || 'egyptian-arabic';
    const fileName = `${storyId}.mp3`;
    const dataDir = getDataDirectory();
    const filePath = path.join(dataDir, 'audio', dialectDir, fileName);
    
    if (fs.existsSync(filePath)) {
      // Return the API endpoint path instead of direct file path
      return `/api/audio/${dialectDir}/${fileName}`;
    }
    
    return null;
  } catch (error) {
    // In case of errors (e.g., if called from client-side), return null
    console.warn('Error checking audio file:', error);
    return null;
  }
}

export function storyAudioExists(storyId: string, dialect: string): boolean {
  return getStoryAudioPath(storyId, dialect) !== null;
}

export function saveUploadedAudioFile(audioBuffer: Buffer, storyId: string, dialect: string): { success: boolean; audioPath?: string; error?: string } {
  try {
    const dialectDir = dialect || 'egyptian-arabic';
    const dataDir = getDataDirectory();
    const audioDir = path.join(dataDir, 'audio', dialectDir);
    
    // Ensure the directory exists
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    // Use only storyId as filename to match existing pattern
    const fileName = `${storyId}.mp3`;
    const filePath = path.join(audioDir, fileName);
    
    // Write the audio file
    fs.writeFileSync(filePath, new Uint8Array(audioBuffer));

    // Return the API endpoint path for serving
    const audioPath = `/api/audio/${dialectDir}/${fileName}`;

    return {
      success: true,
      audioPath: audioPath
    };

  } catch (error) {
    console.error('Error saving uploaded audio file:', error);
    return {
      success: false,
      error: 'Failed to save audio file'
    };
  }
} 