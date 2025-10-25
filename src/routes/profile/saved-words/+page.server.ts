import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { session, user } = await parent();

  if (!session || !user) {
    throw redirect(302, '/login');
  }

  const userId = user && user.id || null;
  console.log({ userId })
  const { data: savedWords, error } = await supabase
  .from('saved_word')
  .select('*')
  .eq('user_id', userId);

  console.log({ savedWords, error })

	return {
		userId: userId,
		email:(session && session.user.email) || null,
    savedWords
	};
};
