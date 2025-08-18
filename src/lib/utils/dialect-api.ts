// Utility functions for handling different dialect APIs

import type { Dialect } from '$lib/types';

const API_URL = 'https://egyptian-arabic-vocab-selmetwa.koyeb.app';

// Type for the API response format (consistent across dialects)
export interface DialectApiWordResponse {
  english: string;
  arabic: string;
  transliteration: string;
  audioUrl?: string;
}

// Standard word format used throughout the app
export interface StandardWordResponse {
  english: string;
  arabic: string;
  transliteration: string;
  audioUrl?: string;
}

/**
 * Get the correct API endpoint for a given dialect
 */
export function getApiEndpoint(dialect: Dialect, section: string): string {
  const dialectPaths = {
    'egyptian-arabic': 'egyptian',
    'fusha': 'modern-standard-arabic',
    'levantine': 'levantine', // Future support
    'darija': 'moroccan', // Future support
    'iraqi': 'iraqi', // Future support
    'khaleeji': 'khaleeji' // Future support
  };

  const dialectPath = dialectPaths[dialect];
  
  if (!dialectPath) {
    throw new Error(`Unsupported dialect: ${dialect}`);
  }

  return `${API_URL}/vocab/${dialectPath}/${section}`;
}

/**
 * Fetch vocabulary data for a specific dialect and section
 */
export async function fetchVocabularyData(
  dialect: Dialect, 
  section: string
): Promise<StandardWordResponse[]> {
  const apiUrl = getApiEndpoint(dialect, section);
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch vocabulary data: ${response.statusText}`);
  }
  
  const json: DialectApiWordResponse[] = await response.json();

  // Transform to standard format, ensuring audioUrl is properly handled
  return json.map((word) => ({
    english: word.english,
    arabic: word.arabic,
    transliteration: word.transliteration,
    audioUrl: word.audioUrl || undefined
  }));
}

/**
 * Get display name for a dialect
 */
export function getDialectDisplayName(dialect: Dialect): string {
  const displayNames = {
    'egyptian-arabic': 'Egyptian Arabic',
    'fusha': 'Modern Standard Arabic (Fusha)',
    'levantine': 'Levantine Arabic',
    'darija': 'Moroccan Darija',
    'iraqi': 'Iraqi Arabic',
    'khaleeji': 'Khaleeji Arabic'
  };

  return displayNames[dialect] || dialect;
}
