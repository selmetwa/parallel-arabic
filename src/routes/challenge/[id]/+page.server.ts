import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase, safeGetSession } = locals;
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		throw redirect(302, '/login');
	}

	const { data: challenge, error: fetchError } = await supabase
		.from('daily_challenge')
		.select('id, challenge_type, dialect, story_id, sentences, completed, bonus_xp')
		.eq('id', params.id)
		.eq('user_id', user.id)
		.maybeSingle();

	if (fetchError || !challenge) {
		throw error(404, 'Challenge not found');
	}

	// Story challenges should redirect to the story page
	if (challenge.challenge_type === 'story' && challenge.story_id) {
		throw redirect(302, `/generated_story/${challenge.story_id}?challenge=${challenge.id}`);
	}

	return {
		challenge,
		userId: user.id
	};
};
