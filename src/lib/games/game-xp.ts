/**
 * XP for the word and puzzle games: one `game_correct` award per correct answer.
 *
 * Awards are sent one at a time. `/api/award-xp` reads and then writes the
 * user's total, so two requests in the same moment (two quick matches on a
 * board) can overwrite each other and lose XP.
 *
 * Unlike the quiz, this shows no toast: `showXpToast` speaks a praise phrase
 * through text-to-speech, which would spend a free user's audio allowance on
 * every correct answer. The games show the XP earned on their results screen.
 */
import { userLevel, userXp } from '$lib/store/xp-store';

let queue: Promise<void> = Promise.resolve();

export function awardGameXp(): void {
	queue = queue.then(async () => {
		try {
			const res = await fetch('/api/award-xp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ eventType: 'game_correct' })
			});
			const result = await res.json();
			if (result.success) {
				userXp.set(result.newTotalXp);
				if (result.leveledUp) userLevel.set(result.newLevel);
			}
		} catch {
			// XP is non-critical.
		}
	});
}
