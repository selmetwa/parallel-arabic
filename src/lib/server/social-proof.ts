import { supabase } from '$lib/supabaseClient';

export interface SocialProof {
	/** Rounded down to the hundred, e.g. 1700 for "1,700+ learners". */
	learners: number;
	/** Words saved to review decks in the last 30 days, rounded down to the hundred. */
	wordsSavedThisMonth: number;
}

const CACHE_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

let cached: { at: number; value: SocialProof } | null = null;

const floorHundred = (n: number) => Math.floor(n / 100) * 100;

/** Real, slowly-changing numbers for the paywall and pricing page. Cached per instance for an hour. */
export async function getSocialProof(now = Date.now()): Promise<SocialProof> {
	if (cached && now - cached.at < CACHE_MS) return cached.value;

	const head = { count: 'exact', head: true } as const;
	const [users, words] = await Promise.all([
		supabase.from('user').select('id', head),
		supabase
			.from('saved_word')
			.select('id', head)
			.gte('created_at', now - 30 * DAY_MS)
	]);

	const value = {
		learners: floorHundred(users.count ?? 0),
		wordsSavedThisMonth: floorHundred(words.count ?? 0)
	};
	// A failed count would show "0+": don't cache it, so the next request retries.
	if (!users.error && !words.error) cached = { at: now, value };
	return value;
}
