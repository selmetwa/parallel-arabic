import { v4 as uuidv4 } from 'uuid';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
	const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId) {
    return json({ message: 'You must have an account do that' });
  }

  const userId = user.id;
  const savedWordId = uuidv4();
  const arabicWord = data.activeWordObj.arabic ?? '';
  const englishWord = data.activeWordObj.english ?? '';
  const transliteratedWord = data.activeWordObj.transliterated ?? '';
  const dialect = data.activeWordObj.dialect; // Optional dialect

  // Check if word already exists in saved_word
  const { data: wordExists, error: checkError } = await supabase
    .from('saved_word')
    .select('*')
    .eq('arabic_word', arabicWord)
    .eq('user_id', userId || '');

  if (wordExists?.[0]?.id) {
    return json({ message: 'You have already saved this' });
  }

  try {
    // Try to find the word in the word table to link via word_id
    let wordId: string | null = null;
    if (arabicWord) {
      let wordQuery = supabase
        .from('word')
        .select('id')
        .eq('arabic_word', arabicWord)
        .limit(1);
      
      // If dialect is provided, filter by it
      if (dialect) {
        wordQuery = wordQuery.eq('dialect', dialect);
      }
      
      const { data: wordData, error: wordError } = await wordQuery.maybeSingle();
      if (wordData && !wordError) {
        wordId = wordData.id;
      }
    }

    // Insert into saved_word with spaced repetition fields initialized
    const now = Date.now();
    const { data: insertData, error: insertError } = await supabase
      .from('saved_word')
      .insert([{
        id: savedWordId,
        user_id: userId ?? '',
        word_id: wordId, // Link to word table if found
        arabic_word: arabicWord,
        english_word: englishWord,
        transliterated_word: transliteratedWord,
        dialect: dialect || 'egyptian-arabic', // Store dialect directly
        ease_factor: 2.5, // Default ease factor
        interval_days: 0, // Start at 0 days
        repetitions: 0, // No repetitions yet
        next_review_date: null, // Will be set on first review
        last_review_date: null,
        is_learning: true, // New words start as learning
        mastery_level: 0, // 0 = new
        created_at: now
      }])
      .select();

    if (insertError) {
      console.error('Error saving word:', insertError);
      return json({ message: 'Something went wrong' });
    }

    return json({ message: 'Saved' });
  } catch (e) {
    console.error('Exception saving word:', e);
    return json({ message: 'Something went wrong' }, { status: 500 });
  }
}
