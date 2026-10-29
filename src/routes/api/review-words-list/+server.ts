import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const GET: RequestHandler = async ({ url, locals }) => {
	const { sessionId, user } = (await locals?.auth?.validate()) || {};

	if (!sessionId || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const source = url.searchParams.get('source') === 'due-for-review' ? 'due-for-review' : 'all';

	let baseQuery = supabase
		.from('saved_word')
		.select('arabic_word, english_word, transliterated_word')
		.eq('user_id', user.id);

	// Same due-for-review filter as the review-words endpoint
	if (source === 'due-for-review') {
		const now = Date.now();
		baseQuery = baseQuery.or(`is_learning.eq.true,next_review_date.is.null,next_review_date.lte.${now}`);
	}

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
