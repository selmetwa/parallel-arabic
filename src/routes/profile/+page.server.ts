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

  // Fetch user's onboarding data (target_dialect, learning_reason, proficiency_level)
  const { data: userData, error: userError } = await supabase
    .from('user')
    .select('target_dialect, learning_reason, proficiency_level, onboarding_completed')
    .eq('id', userId)
    .single();

  if (userError && userError.code !== 'PGRST116') {
    console.error('Error fetching user onboarding data:', userError);
  }

  // Fetch word statistics by dialect
  const now = Date.now();
  let wordStats = {
    total: 0,
    byDialect: {} as Record<string, { total: number; dueForReview: number; learning: number }>,
    dueForReview: 0,
    learning: 0
  };

  try {
    const { data: savedWords, error: wordsError } = await supabase
      .from('saved_word')
      .select('dialect, is_learning, next_review_date')
      .eq('user_id', userId);

    if (!wordsError && savedWords) {
      wordStats.total = savedWords.length;
      
      savedWords.forEach((word) => {
        const dialect = word.dialect || 'egyptian-arabic';
        
        if (!wordStats.byDialect[dialect]) {
          wordStats.byDialect[dialect] = { total: 0, dueForReview: 0, learning: 0 };
        }
        
        wordStats.byDialect[dialect].total++;
        
        const isLearning = word.is_learning || false;
        const isDueForReview = isLearning || !word.next_review_date || word.next_review_date <= now;
        
        if (isLearning) {
          wordStats.byDialect[dialect].learning++;
          wordStats.learning++;
        }
        
        if (isDueForReview) {
          wordStats.byDialect[dialect].dueForReview++;
          wordStats.dueForReview++;
        }
      });
    }
  } catch (error) {
    console.error('Error fetching word statistics:', error);
  }

	return {
    hasActiveSubscription: await getUserHasActiveSubscription(userId ?? ""),
    userGeneratedStories,
    targetDialect: userData?.target_dialect || null,
    learningReason: userData?.learning_reason || null,
    proficiencyLevel: userData?.proficiency_level || null,
    onboardingCompleted: userData?.onboarding_completed || false,
    wordStats,
    user // Include user for stats component
	};
};

export const actions: Actions = {
	updateTargetDialect: async ({ request, locals: { safeGetSession } }) => {
		const { session, user } = await safeGetSession();
		
		if (!session || !user) {
			return {
				success: false,
				error: 'You must be logged in to update your dialect'
			};
		}

		const formData = await request.formData();
		const targetDialect = formData.get('target_dialect') as string;

		// Validate dialect
		const validDialects = ['egyptian-arabic', 'fusha', 'levantine', 'darija'];
		if (!targetDialect || !validDialects.includes(targetDialect)) {
			return {
				success: false,
				error: 'Invalid dialect selected'
			};
		}

		try {
			const { error: updateError } = await supabase
				.from('user')
				.update({ target_dialect: targetDialect })
				.eq('id', user.id);

			if (updateError) {
				console.error('Error updating target_dialect:', updateError);
				return {
					success: false,
					error: 'Failed to update dialect'
				};
			}

			return {
				success: true,
				targetDialect
			};
		} catch (e) {
			console.error('Exception updating target_dialect:', e);
			return {
				success: false,
				error: 'Something went wrong'
			};
		}
	}
};