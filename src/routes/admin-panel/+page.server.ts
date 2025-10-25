import { redirect } from '@sveltejs/kit';
import type { PageServerLoad} from './$types';
import { supabase } from '$lib/supabaseClient';
import { ADMIN_ID } from '$env/static/private';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();

  if (!session?.sessionId) {
    throw redirect(302, '/login');
  }

  const userId = session && session?.user?.id || null;
  
  const { data: user, error: userError } = await supabase
    .from('user')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError && userError.code !== 'PGRST116') {
    console.error('Error fetching admin user:', userError);
  }

  const { data: savedWords, error: savedWordsError } = await supabase
    .from('saved_word')
    .select('*')
    .eq('user_id', userId);

  if (savedWordsError) {
    console.error('Error fetching saved words:', savedWordsError);
  }

  // Get all users with their saved words count via separate queries
  const { data: allUsers, error: usersError } = await supabase
    .from('user')
    .select(`
      id,
      email,
      is_subscriber,
      subscriber_id,
      subscription_end_date,
      sentences_viewed,
      verb_conjugation_tenses_viewed,
      auth_provider,
      google_id
    `);

  if (usersError) {
    console.error('Error fetching users:', usersError);
  }

  // Get saved words count for each user
  const { data: allSavedWords, error: allSavedWordsError } = await supabase
    .from('saved_word')
    .select('user_id, id');

  if (allSavedWordsError) {
    console.error('Error fetching all saved words:', allSavedWordsError);
  }

  // Combine user data with saved words count
  const usersWithSavedWords = (allUsers || []).map(user => {
    const userSavedWords = (allSavedWords || []).filter(word => word.user_id === user.id);
    return {
      ...user,
      savedWords: userSavedWords.map(word => word.id)
    };
  });

   const users = usersWithSavedWords;

  if (ADMIN_ID !== userId) {
    throw redirect(302, '/')
  }

	return {
		user,
    users,
    savedWordsCount: (savedWords || []).length,
    userCount: users.length,
    subscriberCount: users.filter(u => !!u.is_subscriber).length
	};
};


