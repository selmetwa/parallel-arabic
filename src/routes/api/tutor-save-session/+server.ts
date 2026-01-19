import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { 
  updateConversationSummary,
  upsertLearningInsight
} from '$lib/utils/tutor-memory';

interface VocabularyWord {
  arabic: string;
  english: string;
  transliteration: string;
}

interface Insight {
  type: 'weakness' | 'strength' | 'topic_interest' | 'vocabulary_gap';
  content: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // @ts-expect-error - safeGetSession exists on locals at runtime
    const { user } = await locals.safeGetSession();
    
    if (!user) {
      return error(401, { message: 'Not authenticated' });
    }

    const { 
      conversationId, 
      dialect,
      summary, 
      topics, 
      arabicWords,
      selectedWords,
      insights 
    } = await request.json();

    if (!conversationId) {
      return error(400, { message: 'conversationId is required' });
    }

    // 1. Save conversation summary to database
    await updateConversationSummary(
      conversationId,
      summary,
      topics,
      arabicWords || []
    );

    // 2. Save learning insights
    if (insights && Array.isArray(insights)) {
      for (const insight of insights as Insight[]) {
        await upsertLearningInsight(
          user.id,
          dialect,
          insight.type,
          insight.content,
          0.5
        );
      }
    }

    // 3. Save selected words to user's saved_word table for review
    let savedWordsCount = 0;
    if (selectedWords && Array.isArray(selectedWords) && selectedWords.length > 0) {
      const wordsToInsert = (selectedWords as VocabularyWord[]).map(word => ({
        id: generateId(),
        user_id: user.id,
        arabic_word: word.arabic,
        english_word: word.english,
        transliterated_word: word.transliteration,
        dialect: dialect,
        created_at: Date.now(),
        ease_factor: 2.5,
        interval_days: 0,
        repetitions: 0,
        is_learning: true,
        mastery_level: 0,
        forgotten_in_session: false
      }));

      // Check for duplicates first - don't insert words that already exist
      const { data: existingWords } = await supabase
        .from('saved_word')
        .select('arabic_word')
        .eq('user_id', user.id)
        .eq('dialect', dialect)
        .in('arabic_word', wordsToInsert.map(w => w.arabic_word));

      const existingArabicWords = new Set(existingWords?.map(w => w.arabic_word) || []);
      const newWords = wordsToInsert.filter(w => !existingArabicWords.has(w.arabic_word));

      if (newWords.length > 0) {
        const { error: insertError } = await supabase
          .from('saved_word')
          .insert(newWords);

        if (insertError) {
          console.error('Error saving words:', insertError);
        } else {
          savedWordsCount = newWords.length;
          
          // Update user's total saved words count
          await supabase
            .from('user')
            .update({ 
              total_saved_words: (user.total_saved_words || 0) + newWords.length,
              saved_words_this_week: (user.saved_words_this_week || 0) + newWords.length
            })
            .eq('id', user.id);
        }
      }
    }

    return json({
      success: true,
      savedWordsCount,
      message: savedWordsCount > 0 
        ? `Session saved! ${savedWordsCount} new word${savedWordsCount !== 1 ? 's' : ''} added to your review deck.`
        : 'Session saved!'
    });

  } catch (e) {
    console.error('Error saving tutor session:', e);
    return error(500, { message: 'Failed to save session' });
  }
};

