import { v4 as uuidv4 } from 'uuid';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ request, locals }) => {
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const { sentences, dialect } = await request.json();

  if (!sentences || !Array.isArray(sentences) || sentences.length === 0) {
    return json({ error: 'Invalid sentences data' }, { status: 400 });
  }

  if (!dialect) {
    return json({ error: 'Dialect is required' }, { status: 400 });
  }

  try {
    const now = Date.now();
    const savedWordsToInsert = [];

    for (const sentence of sentences) {
      // Validate sentence structure
      if (!sentence.arabic || !sentence.english || !sentence.transliteration) {
        continue; // Skip invalid sentences
      }

      const arabicWord = sentence.arabic.trim();
      const englishWord = sentence.english.trim();
      const transliteratedWord = sentence.transliteration.trim();

      if (!arabicWord || !englishWord || !transliteratedWord) {
        continue; // Skip empty sentences
      }

      // Check if word already exists in saved_word for this user
      const { data: wordExists } = await supabase
        .from('saved_word')
        .select('id')
        .eq('arabic_word', arabicWord)
        .eq('user_id', userId)
        .maybeSingle();

      // Skip if already exists
      if (wordExists?.id) {
        continue;
      }

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
        
        const { data: wordData } = await wordQuery.maybeSingle();
        if (wordData) {
          wordId = wordData.id;
        }
      }

      // Prepare word for insertion
      savedWordsToInsert.push({
        id: uuidv4(),
        user_id: userId,
        word_id: wordId,
        arabic_word: arabicWord,
        english_word: englishWord,
        transliterated_word: transliteratedWord,
        dialect: dialect, // Store dialect directly
        ease_factor: 2.5, // Default ease factor
        interval_days: 0, // Start at 0 days
        repetitions: 0, // No repetitions yet
        next_review_date: null, // Will be set on first review
        last_review_date: null,
        is_learning: true, // New words start as learning
        mastery_level: 0, // 0 = new
        created_at: now
      });
    }

    if (savedWordsToInsert.length === 0) {
      return json({ 
        success: true, 
        saved: 0, 
        skipped: sentences.length,
        message: 'All sentences are already in your review deck'
      });
    }

    // Insert words into saved_word table
    const { data: insertedWords, error: insertError } = await supabase
      .from('saved_word')
      .insert(savedWordsToInsert)
      .select();

    if (insertError) {
      console.error('Error saving sentences:', insertError);
      return json({ error: 'Failed to save sentences' }, { status: 500 });
    }

    return json({
      success: true,
      saved: insertedWords?.length || 0,
      skipped: sentences.length - (insertedWords?.length || 0)
    });
  } catch (error) {
    console.error('Error in save-sentences endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

