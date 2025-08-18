// Utility functions for handling API response transformations
// Provides backward compatibility between old and new API formats

export interface NewApiResponse {
  english: string;
  arabic: string;
  transliteration: string;
  audioUrl?: string;
}

export interface OldApiResponse {
  english: string;
  egyptianArabic: string;
  standardArabic: string;
  egyptianArabicTransliteration: string;
  standardArabicTransliteration: string;
}

export interface StandardizedWordResponse {
  english: string;
  arabic: string;
  transliteration: string;
  audioUrl?: string;
}

/**
 * Detects if the API response uses the old or new format
 * @param word - A single word object from the API response
 * @returns 'old' | 'new'
 */
export function detectApiFormat(word: unknown): 'old' | 'new' {
  if (typeof word !== 'object' || word === null) {
    return 'new';
  }
  
  const wordObj = word as Record<string, unknown>;
  
  // Check for new format properties
  if (wordObj.hasOwnProperty('arabic') && wordObj.hasOwnProperty('transliteration')) {
    return 'new';
  }
  
  // Check for old format properties
  if (wordObj.hasOwnProperty('egyptianArabic') && wordObj.hasOwnProperty('egyptianArabicTransliteration')) {
    return 'old';
  }
  
  // Default to new format if unclear
  return 'new';
}

/**
 * Transforms old API format to standardized format
 * @param word - Word object in old API format
 * @returns Standardized word object
 */
export function transformOldFormat(word: OldApiResponse): StandardizedWordResponse {
  return {
    english: word.english,
    arabic: word.egyptianArabic,
    transliteration: word.egyptianArabicTransliteration,
    audioUrl: undefined
  };
}

/**
 * Transforms new API format to standardized format (essentially a pass-through with validation)
 * @param word - Word object in new API format
 * @returns Standardized word object
 */
export function transformNewFormat(word: NewApiResponse): StandardizedWordResponse {
  return {
    english: word.english,
    arabic: word.arabic,
    transliteration: word.transliteration,
    audioUrl: word.audioUrl || undefined
  };
}

/**
 * Transforms any API response to standardized format with backward compatibility
 * @param response - Array of word objects from API (either old or new format)
 * @returns Array of standardized word objects
 */
export function transformApiResponse(response: unknown[]): StandardizedWordResponse[] {
  if (!response || response.length === 0) {
    return [];
  }

  // Detect format using the first item
  const format = detectApiFormat(response[0]);
  
  if (format === 'old') {
    return response.map((word: unknown) => transformOldFormat(word as OldApiResponse));
  } else {
    return response.map((word: unknown) => transformNewFormat(word as NewApiResponse));
  }
}
