/**
 * Clear all user-specific data from localStorage on logout
 * This ensures no user data persists after signing out
 */
export function clearUserLocalStorage(): void {
  if (typeof window === 'undefined') return;

  // List of localStorage keys to clear
  const keysToRemove: string[] = [];

  // Find all sentence keys (sentences_${dialect})
  const dialects = ['egyptian-arabic', 'levantine', 'darija', 'fusha', 'khaleeji'];
  dialects.forEach(dialect => {
    keysToRemove.push(`sentences_${dialect}`);
  });

  // Find all keys that match user-specific patterns
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      // Clear sentence data
      if (key.startsWith('sentences_')) {
        keysToRemove.push(key);
      }
      // Clear any review-related data
      if (key.startsWith('review_')) {
        keysToRemove.push(key);
      }
      // Clear any user preferences that should reset
      if (key === 'userPreferences') {
        keysToRemove.push(key);
      }
      // Clear home banner dismissal
      if (key === 'homeBannerDismissed') {
        keysToRemove.push(key);
      }
    }
  }

  // Also clear sessionStorage
  sessionStorage.removeItem('homeBannerDismissed');

  // Remove all identified keys
  const uniqueKeys = [...new Set(keysToRemove)];
  uniqueKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove localStorage key: ${key}`, e);
    }
  });

  console.log(`✅ Cleared ${uniqueKeys.length} localStorage items on logout`);
}

