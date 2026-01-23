import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';
import { redirect } from '@sveltejs/kit';

interface Word {
  id: string;
  arabic_word: string;
  english_word: string;
  transliterated_word: string;
  dialect: string;
  category: string;
  audio_url: string | null;
}

export const load: PageServerLoad = async ({ url, parent }) => {
  const { isSubscribed, user } = await parent();

  // Get game parameters
  const dialect = url.searchParams.get('dialect') || 'egyptian-arabic';
  const mode = url.searchParams.get('mode') || 'multiple-choice';
  const category = url.searchParams.get('category');
  const count = parseInt(url.searchParams.get('count') || '10');
  const difficulty = url.searchParams.get('difficulty') || 'a1';
  const useCustom = url.searchParams.get('custom') === 'true';
  const customTopic = url.searchParams.get('topic') || '';
  const contentType = url.searchParams.get('contentType') || 'words'; // 'words' or 'sentences'
  const learningTopics = url.searchParams.get('learningTopics')?.split(',').filter(Boolean) || [];
  const useReviewWords = url.searchParams.get('useReviewWords') === 'true';
  const resumeId = url.searchParams.get('resumeId');

  // If resuming a game, fetch the saved progress
  let resumeData: {
    id: string;
    currentIndex: number;
    score: number;
    wordsToReview: any[];
    questionOrder: string[];
    totalQuestions: number;
  } | null = null;

  if (resumeId && user?.id) {
    const { data: savedGame } = await supabase
      .from('game_progress')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single();

    if (savedGame) {
      resumeData = {
        id: savedGame.id,
        currentIndex: savedGame.current_index,
        score: savedGame.score,
        wordsToReview: savedGame.words_to_review || [],
        questionOrder: savedGame.question_order || [],
        totalQuestions: savedGame.total_questions
      };
    }
  }

  // If using custom words, we'll generate them client-side
  // Just return the parameters for now
  if (useCustom) {
    return {
      words: [],
      gameParams: {
        dialect,
        mode,
        count,
        difficulty,
        useCustom: true,
        customTopic,
        contentType,
        learningTopics,
        useReviewWords
      },
      isSubscribed,
      user,
      resumeData
    };
  }

  // Validate required parameters
  if (!category) {
    throw redirect(302, '/learn/game');
  }

  // Fetch ALL words from the database for this category (no limit for category mode)
  const { data: allWords, error } = await supabase
    .from('word')
    .select('id, arabic_word, english_word, transliterated_word, dialect, category, audio_url')
    .eq('dialect', dialect)
    .eq('category', category)
    .order('frequency', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error fetching words:', error);
    return {
      words: [],
      gameParams: {
        dialect,
        mode,
        category,
        count,
        difficulty,
        useCustom: false,
        contentType
      },
      isSubscribed,
      user,
      resumeData
    };
  }

  // Shuffle all words - use entire category
  const shuffled = (allWords || []).sort(() => Math.random() - 0.5);

  // For category mode, we want all words from the category, shuffled
  // The extra words are used for generating wrong answers in multiple choice
  // Use all words, but keep some aside for wrong answer options
  const selectedWords = shuffled;
  const otherWords: Word[] = [];

  return {
    words: selectedWords as Word[],
    otherWords: otherWords as Word[],
    gameParams: {
      dialect,
      mode,
      category,
      count: shuffled.length, // Use actual count of words in category
      difficulty,
      useCustom: false,
      contentType
    },
    isSubscribed,
    user,
    resumeData
  };
};
