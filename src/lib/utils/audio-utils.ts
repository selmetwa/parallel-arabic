import fs from 'fs';
import path from 'path';

export function getStoryAudioPath(storyId: string, dialect: string): string | null {
  try {
    const dialectDir = dialect || 'egyptian-arabic';
    const fileName = `${storyId}.mp3`;
    const filePath = path.join(process.cwd(), 'static', 'audio', 'generated', dialectDir, fileName);
    
    if (fs.existsSync(filePath)) {
      return `/audio/generated/${dialectDir}/${fileName}`;
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