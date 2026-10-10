import type { GameWord } from './word-pool';

/**
 * Put the words a signed-in player missed into their review, so a bad round
 * still teaches something. Words already saved are skipped by the endpoint.
 * Sent one at a time: there are only a handful, and it keeps the server simple.
 * Resolves to how many requests went through; failures are ignored.
 */
export async function saveMissedWords(words: GameWord[], dialect: string): Promise<number> {
	let saved = 0;
	for (const word of words) {
		try {
			const res = await fetch('/api/save-word', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					activeWordObj: {
						arabic: word.arabic,
						english: word.english,
						transliterated: word.transliteration,
						dialect
					}
				})
			});
			if (res.ok) saved++;
		} catch {
			// Review is a bonus; a failed save shouldn't interrupt the game.
		}
	}
	return saved;
}

/** The results-screen line for missed words. */
export function missedNote(count: number): string | undefined {
	if (count === 0) return undefined;
	return count === 1
		? 'The word you missed is in your review now.'
		: `The ${count} words you missed are in your review now.`;
}
