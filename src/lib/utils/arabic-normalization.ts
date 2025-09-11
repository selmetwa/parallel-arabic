/**
 * Light normalization for real-time comparison (removes diacritics, normalizes variants)
 * @param text - The Arabic text to normalize
 * @returns Lightly normalized Arabic text
 */
export function normalizeArabicTextLight(text: string): string {
  return text
    // Remove diacritics only
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08E1\u08E3-\u08FF]/g, '')
    // Normalize essential Arabic letter variants
    .replace(/(آ|إ|أ)/g, 'ا')  // Normalize Alif variants
    .replace(/(ة)/g, 'ه')       // Normalize Ta Marbuta to Ha
    .replace(/(ئ|ؤ)/g, 'ء')     // Normalize Hamza variants
    .replace(/(ى)/g, 'ي');      // Normalize Ya Maqsoura to Ya
}

/**
 * Strict normalization for final comparison (removes diacritics, filters characters, normalizes variants)
 * @param text - The Arabic text to normalize
 * @returns Strictly normalized Arabic text
 */
export function normalizeArabicText(text: string): string {
  // Remove all non-Arabic letters, non-Arabic numbers, non-English letters, non-digits, and non-spaces
  text = text.replace(/([^\u0621-\u063A\u0641-\u064A\u0660-\u0669a-zA-Z 0-9])/g, '');

  // Normalize Arabic letter variants
  text = text.replace(/(آ|إ|أ)/g, 'ا');  // Normalize Alif variants
  text = text.replace(/(ة)/g, 'ه');       // Normalize Ta Marbuta to Ha
  text = text.replace(/(ئ|ؤ)/g, 'ء');     // Normalize Hamza variants
  text = text.replace(/(ى)/g, 'ي');       // Normalize Ya Maqsoura to Ya

  return text;
}

/**
 * Filter text to keep only Arabic characters
 * @param text - The text to filter
 * @returns Text containing only Arabic characters and spaces
 */
export function filterArabicCharacters(text: string): string {
  // Arabic Unicode range: \u0600-\u06FF, \u0750-\u077F, \u08A0-\u08FF, \uFB50-\uFDFF, \uFE70-\uFEFF
  return text.replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]/g, '').trim();
}

/**
 * Remove Arabic comma (،) from text
 * @param text - The text to clean
 * @returns Text without Arabic commas
 */
export function removeArabicComma(text: string): string {
  const commataPattern = /[\u060C]/g;
  return text.replace(commataPattern, '');
}
