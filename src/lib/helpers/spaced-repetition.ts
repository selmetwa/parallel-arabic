/**
 * Spaced Repetition Algorithm (Difficulty 1-3)
 * 
 * Difficulty levels:
 * 1 = Easy (remembered easily) - increase interval significantly
 * 2 = Medium (remembered with effort) - increase interval moderately
 * 3 = Hard (forgot or very difficult) - reset or small increase
 */

export interface ReviewResult {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: number;
}

/**
 * Calculate next review based on difficulty rating (1-3)
 */
export function calculateNextReview(
  difficulty: 1 | 2 | 3,
  currentEaseFactor: number = 2.5,
  currentInterval: number = 0,
  currentRepetitions: number = 0
): ReviewResult {
  let easeFactor = currentEaseFactor;
  let intervalDays = currentInterval;
  let repetitions = currentRepetitions;

  if (difficulty === 1) {
    // Easy - increase ease factor and interval significantly
    easeFactor = Math.min(easeFactor + 0.15, 2.5); // Cap at 2.5
    repetitions += 1;
    
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 3;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
  } else if (difficulty === 2) {
    // Medium - moderate increase
    easeFactor = Math.max(easeFactor - 0.05, 1.3); // Don't go below 1.3
    repetitions += 1;
    
    if (repetitions === 1) {
      intervalDays = 1;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor * 0.8); // Slightly slower growth
    }
  } else {
    // Hard (difficulty 3) - reset or minimal increase
    easeFactor = Math.max(easeFactor - 0.2, 1.3);
    repetitions = Math.max(0, repetitions - 1); // Decrease repetitions
    intervalDays = Math.max(0, Math.round(intervalDays * 0.5)); // Reduce interval
  }

  const nextReviewDate = Date.now() + (intervalDays * 24 * 60 * 60 * 1000);

  return {
    easeFactor: Math.round(easeFactor * 100) / 100,
    intervalDays,
    repetitions,
    nextReviewDate
  };
}

/**
 * Get words that are due for review
 */
export function getWordsDueForReview(
  words: Array<{
    id: string;
    next_review_date: number | null;
    is_learning: boolean;
  }>
): Array<string> {
  const now = Date.now();
  return words
    .filter(word => {
      // Include words that are learning or due for review
      if (word.is_learning) return true;
      if (!word.next_review_date) return true;
      return word.next_review_date <= now;
    })
    .map(word => word.id);
}

/**
 * Get words that are new (never reviewed)
 */
export function getNewWords(
  words: Array<{
    id: string;
    next_review_date: number | null;
    repetitions: number;
  }>
): Array<string> {
  return words
    .filter(word => !word.next_review_date && word.repetitions === 0)
    .map(word => word.id);
}

