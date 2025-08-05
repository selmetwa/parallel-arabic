import fs from 'fs';
import path from 'path';

// Helper function to get the base data directory
function getDataDirectory(): string {
	// Check if we're in production (Fly.io) or development
	// return process.env.NODE_ENV === 'production' ? '/data' : 'data';
  // return '/data';
  return 'data' // for local development
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