import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

const COLUMNS = 'arabic_word, english_word, transliterated_word';

export const GET: RequestHandler = async ({ url, locals }) => {
	const { sessionId, user } = (await locals?.auth?.validate()) || {};

	if (!sessionId || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const source = url.searchParams.get('source') === 'due-for-review' ? 'due-for-review' : 'all';

	// "Due for review" is today's review session, chosen as /api/review-words does: learned
	// words that are due, most overdue first, then new words, up to the daily review limit.
	// Counting every never-reviewed word as due made it thousands for a big deck.
	if (source === 'due-for-review') {
		const now = Date.now();
		const { data: row } = await supabase
			.from('user')
			.select('daily_review_limit')
			.eq('id', user.id)
			.single();
		const limit = row?.daily_review_limit || 20;

		const { data: due } = await supabase
			.from('saved_word')
			.select(COLUMNS)
			.eq('user_id', user.id)
			.neq('fsrs_state', 0)
			.lte('next_review_date', now)
			.order('next_review_date', { ascending: true })
			.limit(limit);
		const room = limit - (due?.length ?? 0);
		const { data: fresh } =
			room > 0
				? await supabase
						.from('saved_word')
						.select(COLUMNS)
						.eq('user_id', user.id)
						.eq('fsrs_state', 0)
						.order('created_at', { ascending: true })
						.limit(room)
				: { data: [] };

		return json({ words: [...(due ?? []), ...(fresh ?? [])] });
	}

	const baseQuery = supabase.from('saved_word').select(COLUMNS).eq('user_id', user.id);

	// Paginate past the 1000-row PostgREST default limit
	const allData: any[] = [];
	let from = 0;
	const PAGE_SIZE = 1000;
	while (true) {
		const { data: page, error: pageError } = await baseQuery
			.order('created_at', { ascending: false })
			.range(from, from + PAGE_SIZE - 1);
		if (pageError) {
			console.error('Error fetching review words:', pageError);
			break;
		}
		if (!page || page.length === 0) break;
		allData.push(...page);
		if (page.length < PAGE_SIZE) break;
		from += PAGE_SIZE;
	}

	return json({ words: allData });
};
