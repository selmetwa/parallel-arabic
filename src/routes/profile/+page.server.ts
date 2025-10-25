import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { supabase } from '$lib/supabaseClient';
import { getUserHasActiveSubscription } from '$lib/helpers/get-user-has-active-subscription.js';
import { getStoriesByUser } from '$lib/helpers/story-helpers';

export const load = async ({ locals, parent }) => {
	const { session, user } = await parent();

  if (!session || !user) {
    throw redirect(302, '/login');
  }

  const userId = user.id;

  // Fetch user's generated stories with full content from storage
  const storiesResult = await getStoriesByUser(userId || '');
  
  let userGeneratedStories = [];
  if (!storiesResult.success) {
    console.error('Error fetching user stories:', storiesResult.error);
  } else {
    userGeneratedStories = storiesResult.stories || [];
  }

	return {
    hasActiveSubscription: await getUserHasActiveSubscription(userId ?? ""),
    userGeneratedStories
	};
};

export const actions: Actions = {
	logout: async () => {
		// Redirect to the main logout endpoint for consistency
		throw redirect(302, '/auth/logout');
	}
};