import { supabase } from '$lib/supabaseClient';
import { type Dialect } from '$lib/types/index';

// Types for tutor memory
export interface TutorConversation {
  id: string;
  user_id: string;
  dialect: string;
  created_at: number;
  ended_at: number | null;
  summary: string | null;
  topics_discussed: string[] | null;
  new_vocabulary: string[] | null;
}

export interface TutorMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'tutor';
  arabic: string | null;
  english: string | null;
  transliteration: string | null;
  feedback: string | null;
  created_at: number;
}

export interface TutorLearningInsight {
  id: string;
  user_id: string;
  dialect: string;
  insight_type: 'weakness' | 'strength' | 'topic_interest' | 'vocabulary_gap';
  content: string;
  confidence: number;
  occurrences: number;
  last_observed_at: number;
  created_at: number;
}

export interface LearnerContext {
  profile: {
    name: string | null;
    proficiency_level: string | null;
    learning_reason: string | null;
    current_streak: number;
    total_sentences_viewed: number;
    total_stories_viewed: number;
  };
  recentConversations: Array<{
    summary: string | null;
    topics_discussed: string[] | null;
    created_at: number;
  }>;
  knownVocabulary: Array<{
    arabic: string;
    english: string;
  }>;
  learningVocabulary: Array<{
    arabic: string;
    english: string;
  }>;
  insights: TutorLearningInsight[];
}

// Generate a unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create a new conversation
export async function createConversation(userId: string, dialect: string): Promise<string> {
  const id = generateId();
  const now = Date.now();
  
  const { error } = await supabase
    .from('tutor_conversation')
    .insert({
      id,
      user_id: userId,
      dialect,
      created_at: now,
      ended_at: null,
      summary: null,
      topics_discussed: null,
      new_vocabulary: null
    });
  
  if (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
  
  return id;
}

// Get or create active conversation (within last 30 minutes)
export async function getOrCreateConversation(userId: string, dialect: string): Promise<string> {
  const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
  
  // Try to find an active conversation
  const { data: existing } = await supabase
    .from('tutor_conversation')
    .select('id, created_at')
    .eq('user_id', userId)
    .eq('dialect', dialect)
    .is('ended_at', null)
    .gte('created_at', thirtyMinutesAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (existing) {
    return existing.id;
  }
  
  // Create new conversation
  return createConversation(userId, dialect);
}

// Save a message to the conversation
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'tutor',
  arabic: string | null,
  english: string | null,
  transliteration: string | null,
  feedback: string | null = null
): Promise<void> {
  const id = generateId();
  const now = Date.now();
  
  console.log('[tutor-memory] Saving message:', { conversationId, role, hasArabic: !!arabic, hasEnglish: !!english });
  
  const { error } = await supabase
    .from('tutor_message')
    .insert({
      id,
      conversation_id: conversationId,
      role,
      arabic,
      english,
      transliteration,
      feedback,
      created_at: now
    });
  
  if (error) {
    console.error('[tutor-memory] Error saving message:', error);
    // Don't throw - we don't want to break the chat if saving fails
  } else {
    console.log('[tutor-memory] Message saved successfully:', id);
  }
}

// Get messages from a conversation
export async function getConversationMessages(conversationId: string): Promise<TutorMessage[]> {
  console.log('[tutor-memory] Fetching messages for conversation:', conversationId);
  
  const { data, error } = await supabase
    .from('tutor_message')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('[tutor-memory] Error fetching messages:', error);
    return [];
  }
  
  console.log('[tutor-memory] Found', data?.length || 0, 'messages');
  
  return data || [];
}

// Get recent conversations for a user
export async function getRecentConversations(
  userId: string, 
  dialect: string, 
  limit: number = 5
): Promise<TutorConversation[]> {
  const { data, error } = await supabase
    .from('tutor_conversation')
    .select('*')
    .eq('user_id', userId)
    .eq('dialect', dialect)
    .not('summary', 'is', null) // Only get conversations with summaries
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching recent conversations:', error);
    return [];
  }
  
  return data || [];
}

// Get learning insights for a user
export async function getLearningInsights(
  userId: string, 
  dialect: string
): Promise<TutorLearningInsight[]> {
  const { data, error } = await supabase
    .from('tutor_learning_insight')
    .select('*')
    .eq('user_id', userId)
    .eq('dialect', dialect)
    .order('occurrences', { ascending: false })
    .limit(20);
  
  if (error) {
    console.error('Error fetching insights:', error);
    return [];
  }
  
  return data || [];
}

// Upsert a learning insight
export async function upsertLearningInsight(
  userId: string,
  dialect: string,
  insightType: 'weakness' | 'strength' | 'topic_interest' | 'vocabulary_gap',
  content: string,
  confidence: number = 0.5
): Promise<void> {
  const now = Date.now();
  
  // Check if this insight already exists
  const { data: existing } = await supabase
    .from('tutor_learning_insight')
    .select('id, occurrences')
    .eq('user_id', userId)
    .eq('dialect', dialect)
    .eq('insight_type', insightType)
    .eq('content', content)
    .single();
  
  if (existing) {
    // Update existing insight
    await supabase
      .from('tutor_learning_insight')
      .update({
        occurrences: existing.occurrences + 1,
        confidence: Math.min(1, confidence + 0.1), // Increase confidence
        last_observed_at: now
      })
      .eq('id', existing.id);
  } else {
    // Create new insight
    await supabase
      .from('tutor_learning_insight')
      .insert({
        id: generateId(),
        user_id: userId,
        dialect,
        insight_type: insightType,
        content,
        confidence,
        occurrences: 1,
        last_observed_at: now,
        created_at: now
      });
  }
}

// Get user's known vocabulary (high mastery)
export async function getKnownVocabulary(
  userId: string, 
  dialect: string,
  limit: number = 50
): Promise<Array<{ arabic: string; english: string }>> {
  const { data, error } = await supabase
    .from('saved_word')
    .select('arabic_word, english_word, mastery_level')
    .eq('user_id', userId)
    .eq('dialect', dialect)
    .gte('mastery_level', 3) // High mastery
    .order('mastery_level', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching known vocabulary:', error);
    return [];
  }
  
  return (data || []).map(w => ({
    arabic: w.arabic_word,
    english: w.english_word
  }));
}

// Get vocabulary user is currently learning (low mastery)
export async function getLearningVocabulary(
  userId: string, 
  dialect: string,
  limit: number = 30
): Promise<Array<{ arabic: string; english: string }>> {
  const { data, error } = await supabase
    .from('saved_word')
    .select('arabic_word, english_word, mastery_level')
    .eq('user_id', userId)
    .eq('dialect', dialect)
    .eq('is_learning', true)
    .lt('mastery_level', 3) // Low mastery
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching learning vocabulary:', error);
    return [];
  }
  
  return (data || []).map(w => ({
    arabic: w.arabic_word,
    english: w.english_word
  }));
}

// Get user profile data
export async function getUserProfile(userId: string): Promise<LearnerContext['profile'] | null> {
  const { data, error } = await supabase
    .from('user')
    .select('name, proficiency_level, learning_reason, current_streak, total_sentences_viewed, total_stories_viewed')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
}

// Build complete learner context for AI
export async function buildLearnerContext(
  userId: string, 
  dialect: string
): Promise<LearnerContext> {
  // Fetch all data in parallel for speed
  const [profile, recentConversations, knownVocabulary, learningVocabulary, insights] = await Promise.all([
    getUserProfile(userId),
    getRecentConversations(userId, dialect, 5),
    getKnownVocabulary(userId, dialect, 50),
    getLearningVocabulary(userId, dialect, 30),
    getLearningInsights(userId, dialect)
  ]);
  
  return {
    profile: profile || {
      name: null,
      proficiency_level: null,
      learning_reason: null,
      current_streak: 0,
      total_sentences_viewed: 0,
      total_stories_viewed: 0
    },
    recentConversations: recentConversations.map(c => ({
      summary: c.summary,
      topics_discussed: c.topics_discussed,
      created_at: c.created_at
    })),
    knownVocabulary,
    learningVocabulary,
    insights
  };
}

// Format learner context for AI prompt
// Helper to check if a name looks like an actual name vs a numeric ID
function isValidDisplayName(name: string | null): boolean {
  if (!name) return false;
  // Filter out names that are just numbers or very long numeric strings
  if (/^\d+$/.test(name)) return false;
  // Filter out very short names (less than 2 chars)
  if (name.length < 2) return false;
  // Filter out names that look like IDs (very long with no spaces)
  if (name.length > 30 && !name.includes(' ')) return false;
  return true;
}

export function formatLearnerContextForPrompt(context: LearnerContext): string {
  const parts: string[] = [];
  
  // Profile section
  parts.push('## LEARNER PROFILE');
  // Only include name if it's a valid display name (not a numeric ID)
  const displayName = isValidDisplayName(context.profile.name) ? context.profile.name : null;
  if (displayName) {
    parts.push(`- Name: ${displayName}`);
  }
  parts.push(`- Proficiency Level: ${context.profile.proficiency_level || 'Beginner (A1)'}`);
  parts.push(`- Learning Reason: ${context.profile.learning_reason || 'General interest in Arabic'}`);
  if (context.profile.current_streak > 0) {
    parts.push(`- Current Streak: ${context.profile.current_streak} days`);
  }
  if (context.profile.total_sentences_viewed > 0) {
    parts.push(`- Sentences Studied: ${context.profile.total_sentences_viewed}`);
  }
  if (context.profile.total_stories_viewed > 0) {
    parts.push(`- Stories Read: ${context.profile.total_stories_viewed}`);
  }
  parts.push('');
  
  // Recent conversations
  if (context.recentConversations.length > 0) {
    parts.push('## RECENT LEARNING SESSIONS');
    for (const conv of context.recentConversations) {
      const date = new Date(conv.created_at).toLocaleDateString();
      parts.push(`### ${date}`);
      if (conv.summary) {
        parts.push(`Summary: ${conv.summary}`);
      }
      if (conv.topics_discussed && conv.topics_discussed.length > 0) {
        parts.push(`Topics: ${conv.topics_discussed.join(', ')}`);
      }
    }
    parts.push('');
  }
  
  // Vocabulary sections
  if (context.knownVocabulary.length > 0) {
    parts.push(`## VOCABULARY THE STUDENT KNOWS (${context.knownVocabulary.length} words)`);
    parts.push('Use these words naturally in conversation:');
    parts.push(context.knownVocabulary.slice(0, 25).map(w => `${w.arabic} (${w.english})`).join(', '));
    parts.push('');
  }
  
  if (context.learningVocabulary.length > 0) {
    parts.push(`## VOCABULARY TO REINFORCE (${context.learningVocabulary.length} words)`);
    parts.push('Try to incorporate these words the student is learning:');
    parts.push(context.learningVocabulary.slice(0, 15).map(w => `${w.arabic} (${w.english})`).join(', '));
    parts.push('');
  }
  
  // Learning insights
  const weaknesses = context.insights.filter(i => i.insight_type === 'weakness');
  const interests = context.insights.filter(i => i.insight_type === 'topic_interest');
  
  if (weaknesses.length > 0) {
    parts.push('## AREAS TO HELP IMPROVE');
    weaknesses.slice(0, 5).forEach(i => {
      parts.push(`- ${i.content}`);
    });
    parts.push('');
  }
  
  if (interests.length > 0) {
    parts.push('## TOPICS OF INTEREST');
    interests.slice(0, 5).forEach(i => {
      parts.push(`- ${i.content}`);
    });
    parts.push('');
  }
  
  return parts.join('\n');
}

// Update conversation summary
export async function updateConversationSummary(
  conversationId: string,
  summary: string,
  topicsDiscussed: string[],
  newVocabulary: string[]
): Promise<void> {
  const { error } = await supabase
    .from('tutor_conversation')
    .update({
      summary,
      topics_discussed: topicsDiscussed,
      new_vocabulary: newVocabulary,
      ended_at: Date.now()
    })
    .eq('id', conversationId);
  
  if (error) {
    console.error('Error updating conversation summary:', error);
  }
}

// End a conversation
export async function endConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('tutor_conversation')
    .update({ ended_at: Date.now() })
    .eq('id', conversationId);
  
  if (error) {
    console.error('Error ending conversation:', error);
  }
}

