import type { PageServerLoad } from "./$types";
import { supabase } from '$lib/supabaseClient';
import { downloadStoryFromStorage } from '$lib/helpers/storage-helpers';

interface PracticeSentence {
  id: string;
  storyId: number;
  storyTitle: string;
  arabic: string;
  english: string;
  transliteration: string;
  dialect: string;
}

export const load: PageServerLoad = async ({ parent }) => {
  // Get session and subscription info from parent layout
  const { session, isSubscribed, user } = await parent();

  // Fetch some sentences for practice mode from recent stories
  let practiceSentences: PracticeSentence[] = [];

  try {
    // Get a few recent stories to extract sentences from
    const { data: stories, error } = await supabase
      .from('generated_story')
      .select('id, story_body, dialect')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && stories) {
      for (const story of stories) {
        try {
          // Download the story content
          const storageResult = await downloadStoryFromStorage(story.story_body);

          if (storageResult.success && storageResult.data) {
            const storyData = storageResult.data as {
              title?: { english?: string; arabic?: string };
              sentences?: Array<{
                arabic?: { text?: string };
                english?: { text?: string };
                transliteration?: { text?: string };
              }>;
            };

            const storyTitle = storyData.title?.english || 'Untitled';
            const sentences = storyData.sentences || [];

            // Get up to 3 valid sentences per story
            let count = 0;
            for (let i = 0; i < sentences.length && count < 3; i++) {
              const s = sentences[i];
              if (s?.arabic?.text && s?.english?.text && s?.transliteration?.text) {
                practiceSentences.push({
                  id: `${story.id}-${i}`,
                  storyId: story.id,
                  storyTitle,
                  arabic: s.arabic.text,
                  english: s.english.text,
                  transliteration: s.transliteration.text,
                  dialect: story.dialect
                });
                count++;
              }
            }
          }
        } catch (e) {
          console.error('Error loading story for practice:', e);
        }

        // Limit total sentences
        if (practiceSentences.length >= 20) break;
      }
    }
  } catch (e) {
    console.error('Error fetching practice sentences:', e);
  }

  return {
    session,
    isSubscribed,
    hasActiveSubscription: isSubscribed,
    user,
    practiceSentences
  };
};

