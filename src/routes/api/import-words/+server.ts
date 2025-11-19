import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export const POST: RequestHandler = async ({ request, locals }) => {
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const { dialect, category, limit = 50 } = await request.json();

  if (!dialect || !category) {
    return json({ error: 'dialect and category are required' }, { status: 400 });
  }

  try {
    // Get words from word table
    const { data: words, error: wordsError } = await supabase
      .from('word')
      .select('id, arabic_word, english_word, transliterated_word, audio_url')
      .eq('dialect', dialect)
      .eq('category', category)
      .order('frequency', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (wordsError) {
      console.error('Error fetching words:', wordsError);
      return json({ error: 'Failed to fetch words' }, { status: 500 });
    }

    if (!words || words.length === 0) {
      return json({ error: 'No words found for this category' }, { status: 404 });
    }

    // Check which words user already has saved
    // First check by word_id if available
    const wordIds = words.map(w => w.id).filter(Boolean);
    const arabicWords = words.map(w => w.arabic_word);

    let existingWords: Array<{ word_id: string | null; arabic_word: string }> = [];

    // Check by word_id if we have word IDs
    if (wordIds.length > 0) {
      const { data: byWordId } = await supabase
        .from('saved_word')
        .select('word_id, arabic_word')
        .eq('user_id', userId)
        .in('word_id', wordIds);
      
      if (byWordId) {
        existingWords.push(...byWordId);
      }
    }

    // Also check by arabic_word to catch any words saved before word_id was added
    const { data: byArabic } = await supabase
      .from('saved_word')
      .select('word_id, arabic_word')
      .eq('user_id', userId)
      .in('arabic_word', arabicWords);

    if (byArabic) {
      // Merge results, avoiding duplicates
      const existingSet = new Set(existingWords.map(w => w.arabic_word));
      byArabic.forEach(w => {
        if (!existingSet.has(w.arabic_word)) {
          existingWords.push(w);
        }
      });
    }

    const existingArabicWords = new Set(existingWords.map(w => w.arabic_word));
    const existingWordIds = new Set(existingWords.map(w => w.word_id).filter(Boolean));

    // Filter out words user already has (check both word_id and arabic_word)
    const wordsToImport = words.filter(w => 
      !existingArabicWords.has(w.arabic_word) && !existingWordIds.has(w.id)
    );

    if (wordsToImport.length === 0) {
      return json({ 
        message: 'All words from this category are already in your review deck',
        imported: 0,
        skipped: words.length
      });
    }

    // Insert words into saved_word table
    const savedWordsToInsert = wordsToImport.map(word => ({
      id: uuidv4(),
      user_id: userId,
      word_id: word.id,
      arabic_word: word.arabic_word,
      english_word: word.english_word,
      transliterated_word: word.transliterated_word,
      dialect: dialect, // Store dialect directly
      ease_factor: 2.5,
      interval_days: 0,
      repetitions: 0,
      is_learning: true,
      mastery_level: 0,
      created_at: Date.now()
    }));

    const { data: insertedWords, error: insertError } = await supabase
      .from('saved_word')
      .insert(savedWordsToInsert)
      .select();

    if (insertError) {
      console.error('Error importing words:', insertError);
      return json({ error: 'Failed to import words' }, { status: 500 });
    }

    return json({
      success: true,
      imported: insertedWords?.length || 0,
      skipped: words.length - (insertedWords?.length || 0)
    });
  } catch (error) {
    console.error('Error in import-words endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

