import type { PageServerLoad } from "./$types";
import { supabase } from '$lib/supabaseClient';
import { downloadStoryFromStorage } from '$lib/helpers/storage-helpers';
import { getConversationMessages } from '$lib/utils/tutor-memory';
import type { ConversationMessage } from '$lib/types/index';

interface PracticeSentence {
  id: string;
  storyId: number;
  storyTitle: string;
  arabic: string;
  english: string;
  transliteration: string;
  dialect: string;
}

interface LearningInsight {
  insight_type: string;
  content: string;
  occurrences: number;
}

interface RecentConversation {
  id: string;
  dialect: string;
  created_at: number;
  summary: string | null;
  topics_discussed: string[] | null;
}

export const load: PageServerLoad = async ({ parent, url }) => {
  // Get session and subscription info from parent layout
  const { session, isSubscribed, user } = await parent();

  // Resume a past conversation when deep-linked via ?conversationId=...
  let resumeConversation: ConversationMessage[] | null = null;
  let resumeConversationId: string | null = null;
  let resumeDialect: string | null = null;
  const conversationIdParam = url.searchParams.get('conversationId');

  if (user?.id && conversationIdParam) {
    try {
      // Verify the conversation belongs to this user before loading it.
      const { data: convo } = await supabase
        .from('tutor_conversation')
        .select('id, dialect')
        .eq('id', conversationIdParam)
        .eq('user_id', user.id)
        .maybeSingle();

      if (convo) {
        const messages = await getConversationMessages(convo.id);
        resumeConversation = messages.map((m) => ({
          id: m.id,
          type: m.role,
          arabic: m.arabic ?? undefined,
          english: m.english ?? undefined,
          transliteration: m.transliteration ?? undefined,
          feedback: m.feedback ?? undefined,
          timestamp: new Date(m.created_at)
        }));
        resumeConversationId = convo.id;
        resumeDialect = convo.dialect;
      }
    } catch (e) {
      console.error('Error loading conversation to resume:', e);
    }
  }

  // Fetch learning insights and recent conversations if user is logged in
  let learningInsights: LearningInsight[] = [];
  let recentConversations: RecentConversation[] = [];

  if (user?.id) {
    try {
      // Fetch in parallel for speed
      const [insightsResult, conversationsResult] = await Promise.all([
        supabase
          .from('tutor_learning_insight')
          .select('insight_type, content, occurrences')
          .eq('user_id', user.id)
          .order('occurrences', { ascending: false })
          .limit(10),
        supabase
          .from('tutor_conversation')
          .select('id, dialect, created_at, summary, topics_discussed')
          .eq('user_id', user.id)
          .not('summary', 'is', null)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);
      
      if (!insightsResult.error && insightsResult.data) {
        learningInsights = insightsResult.data;
      }
      
      if (!conversationsResult.error && conversationsResult.data) {
        recentConversations = conversationsResult.data;
      }
    } catch (e) {
      console.error('Error fetching tutor memory:', e);
    }
  }

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
      // Download all stories in parallel instead of sequentially
      const downloadResults = await Promise.all(
        stories.map(story =>
          downloadStoryFromStorage(story.story_body)
            .then(result => ({ story, result }))
            .catch(() => ({ story, result: { success: false, data: null } }))
        )
      );

      for (const { story, result } of downloadResults) {
        if (!result.success || !result.data) continue;

        const storyData = result.data as {
          title?: { english?: string; arabic?: string };
          sentences?: Array<{
            arabic?: { text?: string };
            english?: { text?: string };
            transliteration?: { text?: string };
          }>;
        };

        const storyTitle = storyData.title?.english || 'Untitled';
        const sentences = storyData.sentences || [];

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
    practiceSentences,
    learningInsights,
    recentConversations,
    resumeConversation,
    resumeConversationId,
    resumeDialect
  };
};

