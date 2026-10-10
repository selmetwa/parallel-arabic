import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';
import { puzzleNumber } from '$lib/games/daily-root';
import { challengeDate, gameOfTheDay } from '$lib/games/today';
import { dialectMatchItems } from '$lib/server/games/dialect-match-items';

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
	// A new challenge every day: never serve yesterday's from a cache.
	setHeaders({ 'cache-control': 'no-store' });
	const number = puzzleNumber();
	const game = gameOfTheDay(number);
	const userId = (locals as { user?: { id?: string } | null }).user?.id;

	let claimed = false;
	if (userId) {
		const { data } = await supabase
			.from('daily_challenge')
			.select('id')
			.eq('user_id', userId)
			.eq('challenge_date', challengeDate(number))
			.eq('challenge_type', 'game')
			.maybeSingle();
		claimed = !!data;
	}

	return {
		number,
		game,
		claimed,
		items: game === 'dialect-match' ? dialectMatchItems() : []
	};
};
