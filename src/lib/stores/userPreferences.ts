import { writable, get } from 'svelte/store';

export interface UserPreferences {
  showArabic: boolean;
  showTransliteration: boolean;
  showEnglish: boolean;
  preferredFontSize: 'small' | 'medium' | 'large';
}

export interface LastContent {
  contentType: 'sentences' | 'lessons' | 'stories' | 'vocabulary' | 'alphabet' | 'review' | null;
  contentId: string | null;
  contentPosition: number;
  contentDialect: string | null;
  accessedAt: number | null;
}

const defaultPreferences: UserPreferences = {
  showArabic: true,
  showTransliteration: true,
  showEnglish: true,
  preferredFontSize: 'medium'
};

const defaultLastContent: LastContent = {
  contentType: null,
  contentId: null,
  contentPosition: 0,
  contentDialect: null,
  accessedAt: null
};

// Create the stores
export const userPreferences = writable<UserPreferences>(defaultPreferences);
export const lastContent = writable<LastContent>(defaultLastContent);
export const isLoggedIn = writable<boolean>(false);

// Track if preferences have been initialized from server
let initialized = false;

/**
 * Initialize preferences from user data (call from layout)
 */
export function initializePreferences(user: {
  show_arabic?: boolean;
  show_transliteration?: boolean;
  show_english?: boolean;
  preferred_font_size?: string;
  last_content_type?: string | null;
  last_content_id?: string | null;
  last_content_position?: number;
  last_content_dialect?: string | null;
  last_content_accessed_at?: number | null;
} | null) {
  if (user) {
    isLoggedIn.set(true);
    
    userPreferences.set({
      showArabic: user.show_arabic ?? true,
      showTransliteration: user.show_transliteration ?? true,
      showEnglish: user.show_english ?? true,
      preferredFontSize: (user.preferred_font_size as 'small' | 'medium' | 'large') ?? 'medium'
    });
    
    lastContent.set({
      contentType: user.last_content_type as LastContent['contentType'] ?? null,
      contentId: user.last_content_id ?? null,
      contentPosition: user.last_content_position ?? 0,
      contentDialect: user.last_content_dialect ?? null,
      accessedAt: user.last_content_accessed_at ?? null
    });
    
    initialized = true;
  } else {
    isLoggedIn.set(false);
    // For non-logged in users, try localStorage
    loadFromLocalStorage();
  }
}

/**
 * Load preferences from localStorage (for non-logged-in users)
 */
function loadFromLocalStorage() {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem('userPreferences');
    if (stored) {
      const parsed = JSON.parse(stored);
      userPreferences.set({
        ...defaultPreferences,
        ...parsed
      });
    }
  } catch (e) {
    console.error('Failed to load preferences from localStorage:', e);
  }
}

/**
 * Save preferences to localStorage (for non-logged-in users)
 */
function saveToLocalStorage(prefs: UserPreferences) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('userPreferences', JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save preferences to localStorage:', e);
  }
}

/**
 * Update a single preference and persist it
 */
export async function updatePreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): Promise<boolean> {
  const currentPrefs = get(userPreferences);
  const newPrefs = { ...currentPrefs, [key]: value };
  
  // Update store immediately for responsive UI
  userPreferences.set(newPrefs);
  
  // Persist based on login status
  if (get(isLoggedIn)) {
    return await persistToServer(newPrefs);
  } else {
    saveToLocalStorage(newPrefs);
    return true;
  }
}

/**
 * Update multiple preferences at once
 */
export async function updatePreferences(updates: Partial<UserPreferences>): Promise<boolean> {
  const currentPrefs = get(userPreferences);
  const newPrefs = { ...currentPrefs, ...updates };
  
  // Update store immediately
  userPreferences.set(newPrefs);
  
  // Persist based on login status
  if (get(isLoggedIn)) {
    return await persistToServer(newPrefs);
  } else {
    saveToLocalStorage(newPrefs);
    return true;
  }
}

/**
 * Persist preferences to the server
 */
async function persistToServer(prefs: UserPreferences): Promise<boolean> {
  try {
    const response = await fetch('/api/user-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        show_arabic: prefs.showArabic,
        show_transliteration: prefs.showTransliteration,
        show_english: prefs.showEnglish,
        preferred_font_size: prefs.preferredFontSize
      })
    });
    
    return response.ok;
  } catch (e) {
    console.error('Failed to persist preferences to server:', e);
    return false;
  }
}

/**
 * Update last viewed content (for "continue where you left off")
 */
export async function updateLastContent(content: Partial<LastContent>): Promise<boolean> {
  const currentContent = get(lastContent);
  const newContent: LastContent = {
    ...currentContent,
    ...content,
    accessedAt: Date.now()
  };
  
  // Update store immediately
  lastContent.set(newContent);
  
  // Only persist for logged-in users
  if (!get(isLoggedIn)) return true;
  
  try {
    const response = await fetch('/api/user-preferences/last-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        last_content_type: newContent.contentType,
        last_content_id: newContent.contentId,
        last_content_position: newContent.contentPosition,
        last_content_dialect: newContent.contentDialect,
        last_content_accessed_at: newContent.accessedAt
      })
    });
    
    return response.ok;
  } catch (e) {
    console.error('Failed to persist last content to server:', e);
    return false;
  }
}

/**
 * Toggle a boolean preference
 */
export async function togglePreference(key: 'showArabic' | 'showTransliteration' | 'showEnglish'): Promise<boolean> {
  const currentPrefs = get(userPreferences);
  return updatePreference(key, !currentPrefs[key]);
}

