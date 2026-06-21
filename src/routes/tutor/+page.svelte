<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { currentDialect, tutorConversation, tutorConversationId, tutorSelectedDialect } from '$lib/store/store';
  import RecordButton from '$lib/components/RecordButton.svelte';
  import AudioLoading from '$lib/components/AudioLoading.svelte';
  import AudioButton from '$lib/components/AudioButton.svelte';
  import Similarity from '$lib/components/Similarity.svelte';
  import MessageBubble from '$lib/components/tutor/ConversationMessage.svelte';
  import PaywallModal from '$lib/components/PaywallModal.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import DialectComparisonModal from '$lib/components/dialect-shared/sentences/DialectComparisonModal.svelte';
  import DefinitionModal from '$lib/components/dialect-shared/sentences/DefinitionModal.svelte';
  import ConversationSummaryModal from '$lib/components/ConversationSummaryModal.svelte';
  import { type Dialect, type ConversationMessage } from '$lib/types/index';
  import type { DialectComparisonSchema } from '$lib/utils/gemini-schemas';
  import { getDefaultDialect } from '$lib/helpers/get-default-dialect';
  import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
  import { trackEvent } from '$lib/analytics';
  import { TUTOR_SCENARIOS, type TutorScenario } from '$lib/constants/tutor-scenarios';
  import levenshtein from 'fast-levenshtein';

  let { data } = $props();

  // Definition modal state
  let isDefinitionModalOpen = $state(false);
  let activeWord = $state<{
    english: string;
    arabic: string;
    transliterated: string;
    description: string;
    isLoading: boolean;
    type: string;
  } | null>(null);

  function setActiveWord(word: any) {
    activeWord = word;
    isDefinitionModalOpen = true;
  }

  function closeDefinitionModal() {
    isDefinitionModalOpen = false;
    activeWord = null;
  }

  async function handleWordClick(word: string, type: 'arabic' | 'english' | 'transliteration', message: ConversationMessage) {
    const cleanWord = word.replace(/[،,]/g, '');
    const isSingleWordDefinition = type === 'arabic' && cleanWord.trim().split(/\s+/).filter(Boolean).length === 1;
    trackEvent('tutor_word_definition_requested', { word: cleanWord, type, dialect: selectedDialect });

    setActiveWord({
      english: '',
      arabic: '',
      transliterated: '',
      description: '',
      isLoading: true,
      type: ''
    });

    try {
      const res = await fetch('/api/definition-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: cleanWord,
          type: type,
          sentence: {
            arabic: message.arabic || '',
            english: message.english || '',
            transliteration: message.transliteration || ''
          },
          dialect: selectedDialect,
          isSingleWordDefinition
        })
      });

      const data = await res.json();

      setActiveWord({
        english: type === 'english' ? cleanWord : '',
        arabic: type === 'arabic' ? cleanWord : '',
        transliterated: type === 'transliteration' ? cleanWord : '',
        description: data.message?.message?.content || data.message?.content || '',
        isLoading: false,
        type: type
      });
    } catch (err) {
      console.error('Error fetching definition:', err);
      setActiveWord({
        english: type === 'english' ? cleanWord : '',
        arabic: type === 'arabic' ? cleanWord : '',
        transliterated: type === 'transliteration' ? cleanWord : '',
        description: 'Failed to get definition. Please try again.',
        isLoading: false,
        type: type
      });
    }
  }

  let isModalOpen = $state(false);
  let hasActiveSubscription = $derived(data.hasActiveSubscription);
  let learningInsights = $derived(data.learningInsights || []);
  let recentConversations = $derived(data.recentConversations || []);

  function openPaywallModal() {
    isModalOpen = true;
  }

  function handleCloseModal() {
    isModalOpen = false;
  }

  onMount(() => {
    currentDialect.set('');

    // Default to the native keyboard on mobile; style the virtual one.
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      keyboard = 'physical';
    }
    updateKeyboardStyle();

    autoPlayAudio = localStorage.getItem('tutor-autoplay') !== 'off';
  });

  const dialectOptions = [
    { value: 'egyptian-arabic', label: 'Egyptian Arabic', short: 'Egyptian', emoji: '🇪🇬' },
    { value: 'fusha', label: 'Modern Standard Arabic', short: 'MSA', emoji: '📚' },
    { value: 'levantine', label: 'Levantine Arabic', short: 'Levantine', emoji: '🇱🇧' },
  ];

  // Mode: 'conversation' or 'practice'
  type TutorMode = 'conversation' | 'practice';
  let mode = $state<TutorMode>('conversation');

  let selectedDialect = $state<Dialect>(
    (data.resumeDialect as Dialect) || (get(tutorSelectedDialect) as Dialect) || (getDefaultDialect(data.user) as Dialect)
  );

  // Scenario picker state (beginner conversation starters)
  interface HintData {
    arabic: string;
    transliteration: string;
    english: string;
  }
  let activeScenarioContext = $state<TutorScenario | null>(null);
  let hintsVisible = $state(true);
  let currentHint = $state<HintData | null>(null);
  let isLoadingHint = $state(false);

  // Global transcript display toggles. These are the defaults each message follows
  // until it is individually toggled (see ConversationMessage's local overrides).
  let displayEnglish = $state(false);
  let displayTransliteration = $state(false);
  let displayHint = $state(false);
  let autoPlayAudio = $state(true);
  let playingMessageId = $state<string | null>(null);
  let chatError = $state<{ message: string; retry: (() => void) | null } | null>(null);

  function toggleAutoPlay() {
    autoPlayAudio = !autoPlayAudio;
    trackEvent('tutor_autoplay_toggled', { enabled: autoPlayAudio });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tutor-autoplay', autoPlayAudio ? 'on' : 'off');
    }
  }

  let scenariosForDialect = $derived(
    TUTOR_SCENARIOS.filter((s) => s.dialogs[selectedDialect])
  );

  let activeScenarioDialog = $derived(
    activeScenarioContext ? activeScenarioContext.dialogs[selectedDialect] ?? null : null
  );

  // ── Scenario Learn phase (vocab intro before the guided conversation) ──────
  // When a scenario starts, the tutor first walks the learner through the key
  // vocab and a few practice sentences (AI-generated) that build on those words,
  // having them repeat each one aloud before the roleplay conversation begins.
  interface ScenarioVocabItem {
    arabic: string;
    transliteration: string;
    english: string;
    teachingLine: string;
    kind: 'word' | 'sentence';
  }
  const PRONUNCIATION_THRESHOLD = 60;
  const MAX_ATTEMPTS_BEFORE_SKIP = 3;
  let scenarioPhase = $state<'learn' | 'practice' | null>(null);
  // Ordered list of learn items: the words first, then the practice sentences.
  let scenarioVocab = $state<ScenarioVocabItem[]>([]);
  let isLoadingVocab = $state(false);
  let vocabError = $state<string | null>(null);
  let currentVocabIndex = $state(0);
  let vocabAttempts = $state(0);
  let vocabResult = $state<{ similarity: number; passed: boolean } | null>(null);

  let currentVocabItem = $derived(scenarioVocab[currentVocabIndex] ?? null);
  let canSkipVocab = $derived(vocabAttempts >= MAX_ATTEMPTS_BEFORE_SKIP);

  // Custom scenario: the learner describes what they want to talk about and we
  // build an ad-hoc scenario that runs through the same Learn → Practice flow.
  let showCustomScenarioModal = $state(false);
  let customScenarioText = $state('');

  function createCustomScenario() {
    const text = customScenarioText.trim();
    if (!text) return;

    const scenario: TutorScenario = {
      id: 'custom-' + Date.now(),
      title: text.length > 60 ? text.slice(0, 60) + '…' : text,
      emoji: '✨',
      description: text,
      level: 'beginner',
      dialogs: {
        [selectedDialect]: { otherRoleEnglish: 'Conversation partner', lines: [] }
      }
    };

    trackEvent('tutor_custom_scenario_created', { dialect: selectedDialect });
    showCustomScenarioModal = false;
    customScenarioText = '';
    startScenario(scenario);
  }

  function startScenario(scenario: TutorScenario) {
    const dialog = scenario.dialogs[selectedDialect];
    if (!dialog) return;

    trackEvent('tutor_scenario_started', { scenario_id: scenario.id, dialect: selectedDialect });
    activeScenarioContext = scenario;
    scenarioPhase = 'learn';
    currentVocabIndex = 0;
    vocabAttempts = 0;
    vocabResult = null;
    scenarioVocab = [];
    currentHint = null;
    fetchScenarioVocab();
  }

  // Fetch the AI-generated vocab list the learner repeats before the roleplay.
  async function fetchScenarioVocab() {
    if (!activeScenarioContext) return;
    const dialog = activeScenarioContext.dialogs[selectedDialect];
    if (!dialog) return;

    isLoadingVocab = true;
    vocabError = null;
    trackEvent('scenario_vocab_started', { scenario_id: activeScenarioContext.id, dialect: selectedDialect });

    try {
      const r = await fetch('/api/scenario-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialect: selectedDialect,
          scenarioTitle: activeScenarioContext.title,
          scenarioDescription: activeScenarioContext.description,
          lines: dialog.lines,
          proficiencyLevel: data.user?.proficiency_level || 'A1'
        })
      });
      if (!r.ok) throw new Error('Failed to load vocab');
      const d = await r.json();
      const words = Array.isArray(d.vocab) ? d.vocab : [];
      const sentences = Array.isArray(d.sentences) ? d.sentences : [];
      // Words first, then practice sentences that build on them.
      scenarioVocab = [
        ...words.map((w: Omit<ScenarioVocabItem, 'kind'>) => ({ ...w, kind: 'word' as const })),
        ...sentences.map((s: Omit<ScenarioVocabItem, 'kind'>) => ({ ...s, kind: 'sentence' as const }))
      ];
      if (scenarioVocab.length === 0) {
        // Nothing to teach — go straight into the conversation.
        beginPracticePhase();
      }
    } catch (e) {
      console.error('Scenario vocab error:', e);
      vocabError = "Couldn't load the vocabulary. Retry, or skip straight to the conversation.";
    } finally {
      isLoadingVocab = false;
    }
  }

  // Character-level similarity for single vocab words. Word-level matching
  // (calculateSimilarity) is too strict here — one differing letter scores 0%.
  // Normalize away tashkeel + common letter variants that speech-to-text drops,
  // then use Levenshtein for partial credit (same approach as /speak).
  function calculateWordSimilarity(transcribed: string, expected: string): number {
    const normalize = (text: string) =>
      text
        .replace(/[ً-ْ]/g, '') // tashkeel/diacritics
        .replace(/[آأإٱ]/g, 'ا') // أ إ آ ٱ → ا
        .replace(/ى/g, 'ي') // ى → ي
        .replace(/ة/g, 'ه') // ة → ه
        .replace(/ـ/g, '') // tatweel
        .replace(/[،.؟!,?]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const t = normalize(transcribed);
    const e = normalize(expected);
    if (!t || !e) return 0;
    if (t === e) return 100;

    const distance = levenshtein.get(t, e);
    const maxLength = Math.max(t.length, e.length);
    return Math.max(0, Math.round((1 - distance / maxLength) * 100));
  }

  // Score the learner's spoken attempt at the current vocab word.
  function scoreLearnAttempt(transcript: string) {
    if (!currentVocabItem) return;
    const similarity = calculateWordSimilarity(transcript, currentVocabItem.arabic);
    const passed = similarity >= PRONUNCIATION_THRESHOLD;
    vocabAttempts += 1;
    vocabResult = { similarity, passed };
    trackEvent('scenario_vocab_attempt', {
      similarity,
      passed,
      word_index: currentVocabIndex,
      dialect: selectedDialect
    });
  }

  // Move to the next vocab word, or start the conversation after the last one.
  function advanceVocab() {
    if (currentVocabIndex < scenarioVocab.length - 1) {
      currentVocabIndex += 1;
      vocabAttempts = 0;
      vocabResult = null;
    } else {
      beginPracticePhase();
    }
  }

  function skipVocabWord() {
    trackEvent('scenario_vocab_skipped', { word_index: currentVocabIndex, dialect: selectedDialect });
    advanceVocab();
  }

  // Transition out of the Learn phase into the existing guided conversation.
  function beginPracticePhase() {
    scenarioPhase = 'practice';
    hintsVisible = true;
    currentHint = null;
    trackEvent('scenario_practice_started', { scenario_id: activeScenarioContext?.id, dialect: selectedDialect });

    const dialog = activeScenarioContext?.dialogs[selectedDialect];
    if (!dialog) return;

    // Seed the very first hint from the hardcoded scenario data: the first
    // student line. After the student records and the AI replies, subsequent
    // hints are generated dynamically based on the AI's response.
    const firstStudentLine = dialog.lines.find((l) => l.speaker === 'student');
    if (firstStudentLine) {
      currentHint = {
        arabic: firstStudentLine.arabic,
        transliteration: firstStudentLine.transliteration,
        english: firstStudentLine.english
      };
    }

    // If the scenario opens with the other party speaking, seed the conversation
    // with that line so the user has something to respond to.
    if (dialog.lines[0]?.speaker === 'other') {
      const opening = dialog.lines[0];
      const seededMsg: ConversationMessage = {
        id: 'scenario-seed-' + Date.now(),
        type: 'tutor',
        arabic: opening.arabic,
        english: opening.english,
        transliteration: opening.transliteration,
        timestamp: new Date()
      };
      conversation = [...conversation, seededMsg];
      if (autoPlayAudio) {
        setTimeout(() => {
          playTutorAudio(opening.arabic, selectedDialect, seededMsg.id);
        }, 400);
      }
    }
  }

  function exitScenario() {
    trackEvent('tutor_scenario_exited', { scenario_id: activeScenarioContext?.id, dialect: selectedDialect });
    activeScenarioContext = null;
    scenarioPhase = null;
    scenarioVocab = [];
    currentVocabIndex = 0;
    vocabAttempts = 0;
    vocabResult = null;
    isLoadingVocab = false;
    vocabError = null;
    currentHint = null;
    isLoadingHint = false;
  }

  function toggleHints() {
    hintsVisible = !hintsVisible;
    trackEvent('tutor_hints_toggled', { visible: hintsVisible });
    // Hints aren't fetched while hidden, so catch up when they're shown again.
    if (hintsVisible && !currentHint && !isLoadingHint && conversation.some((m) => m.type === 'tutor')) {
      fetchNextHint();
    }
  }

  function buildScenarioPrimer(): { role: 'user' | 'assistant'; content: string }[] {
    if (!activeScenarioContext || !activeScenarioDialog) return [];
    const role = activeScenarioDialog.otherRoleEnglish;
    return [
      {
        role: 'user',
        content: `Let's roleplay this scenario: "${activeScenarioContext.title}". You play the role of ${role}. Reply in character, short and natural, in ${selectedDialect}. Keep it beginner-friendly.`
      },
      {
        role: 'assistant',
        content: `Okay, I'll play ${role}. Go ahead.`
      }
    ];
  }

  async function fetchNextHint() {
    isLoadingHint = true;
    try {
      const history = conversation
        .filter((m) => m.type === 'user' || m.type === 'tutor')
        .map((m) => ({
          role: m.type === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.arabic || m.english || ''
        }))
        .slice(-8);

      const body: Record<string, unknown> = {
        dialect: selectedDialect,
        conversation: history,
        proficiencyLevel: data.user?.proficiency_level || 'A1'
      };
      if (activeScenarioContext && activeScenarioDialog) {
        body.scenarioTitle = activeScenarioContext.title;
        body.scenarioDescription = activeScenarioContext.description;
        body.otherRole = activeScenarioDialog.otherRoleEnglish;
      }

      const res = await fetch('/api/tutor-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Failed to fetch hint');
      const json = await res.json();
      currentHint = {
        arabic: json.arabic,
        transliteration: json.transliteration,
        english: json.english
      };
    } catch (e) {
      console.error('Failed to load hint:', e);
      currentHint = null;
    } finally {
      isLoadingHint = false;
    }
  }
  let recording = $state(false);
  let recordingLanguage = $state<'ar' | 'en'>('ar'); // captured from inputLanguage when recording starts
  let recordingSeconds = $state(0);
  let recordingTimer: ReturnType<typeof setInterval> | null = null;
  let discardRecording = false;
  let mediaRecorder: MediaRecorder | null = $state(null);
  let audioChunks: Blob[] = $state([]);
  // Initialized from a deep-linked past conversation (History) when present,
  // otherwise from the in-memory stores so the chat survives navigation.
  let conversation: ConversationMessage[] = $state(
    (data.resumeConversation as ConversationMessage[] | null)?.length
      ? (data.resumeConversation as ConversationMessage[])
      : (get(tutorConversation) as ConversationMessage[])
  );
  let conversationId: string | null = $state(
    data.resumeConversationId ?? get(tutorConversationId)
  ); // Track conversation ID for memory

  // Keep the stores in sync with local state (browser only; reassignments above trigger this)
  $effect(() => {
    tutorConversation.set(conversation);
    tutorConversationId.set(conversationId);
    tutorSelectedDialect.set(selectedDialect);
  });
  let isSavingConversation = $state(false); // Track when saving/summarizing
  let isProcessing = $state(false);
  
  // Summary modal state
  interface VocabularyWord {
    arabic: string;
    english: string;
    transliteration: string;
    selected: boolean;
  }
  interface SummaryInsight {
    type: 'weakness' | 'strength' | 'topic_interest' | 'vocabulary_gap';
    content: string;
  }
  let showSummaryModal = $state(false);
  let summaryData = $state<{
    summary: string;
    topics: string[];
    vocabulary: VocabularyWord[];
    insights: SummaryInsight[];
  }>({
    summary: '',
    topics: [],
    vocabulary: [],
    insights: []
  });
  let isSavingSession = $state(false);
  let isTranscribing = $state(false);
  let isGettingResponse = $state(false);
  let transcriptContainer: HTMLDivElement | null = $state(null);
  let transcriptEnd: HTMLDivElement | null = $state(null);

  // Practice mode state
  interface PracticeSentence {
    id: string;
    storyId: number;
    storyTitle: string;
    arabic: string;
    english: string;
    transliteration: string;
    dialect: string;
  }

  interface PracticeResult {
    transcribedText: string;
    expectedText: string;
    similarity: number;
    feedback: string;
  }

  let practiceIndex = $state(0);
  let practiceResult = $state<PracticeResult | null>(null);
  let isPracticeRecording = $state(false);
  let isPracticeProcessing = $state(false);

  // Filter practice sentences by selected dialect
  let filteredPracticeSentences = $derived(
    (data.practiceSentences || []).filter((s: PracticeSentence) => s.dialect === selectedDialect)
  );

  let currentPracticeSentence = $derived(
    filteredPracticeSentences[practiceIndex] || null
  );

  function nextPracticeSentence() {
    if (practiceIndex < filteredPracticeSentences.length - 1) {
      practiceIndex++;
      practiceResult = null;
      trackEvent('tutor_practice_navigated', { direction: 'next' });
    }
  }

  function prevPracticeSentence() {
    if (practiceIndex > 0) {
      practiceIndex--;
      practiceResult = null;
      trackEvent('tutor_practice_navigated', { direction: 'previous' });
    }
  }

  function shufflePracticeSentences() {
    practiceIndex = Math.floor(Math.random() * filteredPracticeSentences.length);
    practiceResult = null;
    trackEvent('tutor_practice_sentence_shuffled');
  }

  // Calculate text similarity (simple word-level comparison)
  function calculateSimilarity(transcribed: string, expected: string): number {
    const normalizeArabic = (text: string) => {
      return text
        .replace(/[\u064B-\u0652]/g, '') // Remove tashkeel/diacritics
        .replace(/[،.؟!,?]/g, '') // Remove punctuation
        .trim()
        .toLowerCase();
    };

    const t = normalizeArabic(transcribed);
    const e = normalizeArabic(expected);

    if (t === e) return 100;
    if (!t || !e) return 0;

    const tWords = t.split(/\s+/);
    const eWords = e.split(/\s+/);

    let matchCount = 0;
    for (const word of tWords) {
      if (eWords.includes(word)) {
        matchCount++;
      }
    }

    return Math.round((matchCount / Math.max(tWords.length, eWords.length)) * 100);
  }

  async function startPracticeRecording() {
    if (!hasActiveSubscription) {
      openPaywallModal();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await processPracticeRecording();
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      isPracticeRecording = true;
      audioChunks = [];
      practiceResult = null;
      trackEvent('tutor_practice_recording_started', { dialect: selectedDialect });
    } catch (error) {
      console.error('Error starting practice recording:', error);
    }
  }

  function stopPracticeRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      isPracticeRecording = false;
    }
  }

  async function processPracticeRecording() {
    if (audioChunks.length === 0 || !currentPracticeSentence) return;

    isPracticeProcessing = true;

    try {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('language', 'ar'); // Always Arabic for practice
      formData.append('dialect', selectedDialect); // Send dialect for Chirp 3
      formData.append('expectedText', currentPracticeSentence.arabic);

      const transcriptionResponse = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData
      });

      if (!transcriptionResponse.ok) {
        throw new Error('Transcription failed');
      }

      const transcriptionData = await transcriptionResponse.json();
      const transcribedText = transcriptionData.text?.trim() || '';

      if (!transcribedText) {
        throw new Error('No speech detected. Please try speaking more clearly.');
      }

      const similarity = calculateSimilarity(transcribedText, currentPracticeSentence.arabic);

      let feedback = '';
      if (similarity >= 90) {
        feedback = 'Excellent! Your pronunciation was very close to the original.';
      } else if (similarity >= 70) {
        feedback = 'Good job! Most words were recognized correctly.';
      } else if (similarity >= 50) {
        feedback = 'Keep practicing! Try listening to the sentence again and focus on each word.';
      } else {
        feedback = 'Try again. Listen carefully to the pronunciation and speak more slowly.';
      }

      practiceResult = {
        transcribedText,
        expectedText: currentPracticeSentence.arabic,
        similarity,
        feedback
      };
      trackEvent('tutor_practice_submitted', { similarity, correct: similarity >= 70, dialect: selectedDialect });

    } catch (error) {
      console.error('Error processing practice recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process your recording';
      practiceResult = {
        transcribedText: '',
        expectedText: currentPracticeSentence?.arabic || '',
        similarity: 0,
        feedback: errorMessage
      };
    } finally {
      isPracticeProcessing = false;
    }
  }

  function togglePracticeRecording() {
    if (isPracticeRecording) {
      stopPracticeRecording();
    } else {
      startPracticeRecording();
    }
  }

  // Dialect Comparison State
  let isComparisonModalOpen = $state(false);
  let comparisonData = $state<DialectComparisonSchema | null>(null);
  let isComparing = $state(false);
  let comparisonText = $state('');
  let comparisonEnglish = $state('');
  let comparisonError = $state<string | null>(null);

  async function compareDialects(text: string, english?: string, transliteration?: string) {
    trackEvent('tutor_dialect_comparison_opened', { dialect: selectedDialect });
    isComparing = true;
    isComparisonModalOpen = true;
    comparisonData = null;
    comparisonText = text;
    comparisonEnglish = english || '';
    comparisonError = null;

    try {
      const res = await fetch('/api/compare-dialects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          currentDialect: selectedDialect,
          transliteration,
          english: english || ''
        })
      });
      
      if (res.ok) {
        comparisonData = await res.json();
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Failed to compare dialects' }));
        comparisonError = errorData.message || 'Failed to compare dialects. Please try again.';
      }
    } catch (e) {
      comparisonError = e instanceof Error ? e.message : 'An unexpected error occurred. Please try again.';
    } finally {
      isComparing = false;
    }
  }

  function closeComparisonModal() {
    isComparisonModalOpen = false;
  }

  async function setDialect(dialect: string) {
    // Summarize current conversation before switching dialects
    if (conversationId && conversation.length >= 4) {
      try {
        await fetch('/api/tutor-summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            conversationId,
            dialect: selectedDialect 
          })
        });
      } catch (e) {
        console.error('Failed to summarize conversation:', e);
      }
    }
    
    trackEvent('tutor_dialect_changed', { dialect });
    selectedDialect = dialect as Dialect;
    conversation = [];
    conversationId = null; // Reset for new dialect
    exitScenario();
  }

  async function startRecording(language: 'ar' | 'en') {
    if (!hasActiveSubscription) {
      openPaywallModal();
      return;
    }

    chatError = null;

    try {
      recordingLanguage = language;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (discardRecording) {
          discardRecording = false;
          audioChunks = [];
        } else {
          await processRecording();
        }
      };

      mediaRecorder.start();
      recording = true;
      audioChunks = [];
      recordingSeconds = 0;
      recordingTimer = setInterval(() => recordingSeconds++, 1000);
      trackEvent('tutor_message_sent', { method: 'voice', language, dialect: selectedDialect });
    } catch (error) {
      console.error('Error starting recording:', error);
      recording = false;
      chatError = {
        message: "Couldn't access your microphone. Check browser permissions and try again.",
        retry: null
      };
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      recording = false;
    }
    if (recordingTimer) {
      clearInterval(recordingTimer);
      recordingTimer = null;
    }
  }

  function cancelRecording() {
    discardRecording = true;
    stopRecording();
  }

  function formatRecordingTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  async function processRecording() {
    if (audioChunks.length === 0) return;

    isProcessing = true;
    isTranscribing = true;
    chatError = null;

    try {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('language', recordingLanguage);
      formData.append('dialect', selectedDialect); // Send dialect for Chirp 3

      const transcriptionResponse = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData
      });

      if (!transcriptionResponse.ok) {
        throw new Error('Transcription failed');
      }

      const transcriptionData = await transcriptionResponse.json();
      const userMessage = transcriptionData.text?.trim();

      if (!userMessage) {
        throw new Error('No text transcribed');
      }

      isTranscribing = false;
      if (scenarioPhase === 'learn') {
        scoreLearnAttempt(userMessage);
      } else {
        await sendUserMessage(userMessage, recordingLanguage);
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      const noSpeech = error instanceof Error && error.message === 'No text transcribed';
      chatError = noSpeech
        ? { message: 'No speech detected — try recording again, a little closer to the mic.', retry: null }
        : {
            message: "Couldn't process your recording.",
            retry: () => {
              chatError = null;
              processRecording();
            }
          };
    } finally {
      isProcessing = false;
      isTranscribing = false;
    }
  }

  // Shared pipeline for a user turn — used by both voice (after transcription)
  // and typed text. Translates the message, gets the tutor reply, plays audio,
  // and generates the next hint.
  async function requestTutorReply(
    userMessage: string,
    conversationHistory: { role: 'user' | 'assistant'; content: string }[]
  ) {
    isGettingResponse = true;
    try {
      const r = await fetch('/api/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          dialect: selectedDialect,
          conversation: conversationHistory,
          conversationId: conversationId,
          proficiencyLevel: data.user?.proficiency_level || 'A1'
        })
      });
      if (!r.ok) throw new Error('Failed to get tutor response');
      const tutorData = await r.json();

      if (tutorData.conversationId && !conversationId) {
        conversationId = tutorData.conversationId;
      }
      const tutorMsg: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        type: 'tutor',
        arabic: tutorData.arabic,
        english: tutorData.english,
        transliteration: tutorData.transliteration,
        wordAlignments: tutorData.wordAlignments || [],
        timestamp: new Date()
      };
      conversation = [...conversation, tutorMsg];
      isGettingResponse = false;
      scrollToMessage(tutorMsg.id);
      if (hintsVisible) {
        fetchNextHint();
      }

      if (tutorData.arabic && autoPlayAudio) {
        setTimeout(async () => {
          await playTutorAudio(tutorData.arabic, selectedDialect, tutorMsg.id);
        }, 300);
      }
    } catch (e) {
      console.error('Tutor chat error:', e);
      isGettingResponse = false;
      chatError = {
        message: "The tutor couldn't respond.",
        retry: () => {
          chatError = null;
          requestTutorReply(userMessage, conversationHistory);
        }
      };
    }
  }

  async function sendUserMessage(userMessage: string, language: 'ar' | 'en') {
    chatError = null;

    // Build history before adding the new user message
    const recentHistory = conversation
      .filter(msg => msg.type === 'user' || msg.type === 'tutor')
      .map(msg => {
        if (msg.type === 'user') {
          return {
            role: 'user' as const,
            content: msg.originalLanguage === 'ar' ? (msg.arabic || '') : (msg.english || '')
          };
        } else {
          return {
            role: 'assistant' as const,
            content: msg.arabic || ''
          };
        }
      })
      .slice(-6);
    // Prepend a roleplay primer if the user is in a guided scenario so the AI
    // stays in character. The primer is never displayed in the UI.
    const conversationHistory = [...buildScenarioPrimer(), ...recentHistory];

    // Show optimistic user message immediately with the raw input
    const optimisticId = Date.now().toString();
    const optimisticMsg: ConversationMessage = {
      id: optimisticId,
      type: 'user',
      arabic: userMessage,
      english: '',
      transliteration: '',
      wordAlignments: [],
      feedback: '',
      suggestedSentence: null,
      originalLanguage: language,
      timestamp: new Date(),
      showFeedback: true,
      showBreakdown: false
    };
    conversation = [...conversation, optimisticMsg];
    scrollToBottom();

    // Fire both requests immediately — don't wait for both before showing anything.
    // Update optimistic user message when translation arrives (silently, no spinner).
    const translatePromise = fetch('/api/translate-user-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        dialect: selectedDialect,
        inputLanguage: language
      })
    }).then(r => {
      if (!r.ok) throw new Error('Failed to translate message');
      return r.json();
    }).then(translateData => {
      conversation = conversation.map(msg =>
        msg.id === optimisticId
          ? {
              ...msg,
              arabic: translateData.arabic,
              english: translateData.english,
              transliteration: translateData.transliteration,
              wordAlignments: translateData.wordAlignments || [],
              feedback: translateData.feedback || '',
              suggestedSentence: translateData.suggestedSentence || null
            }
          : msg
      );
    }).catch(e => {
      console.error('Translation error:', e);
      // Keep optimistic message as-is
    });

    await Promise.allSettled([translatePromise, requestTutorReply(userMessage, conversationHistory)]);
  }

  // ── Composer input (voice or text, shared language toggle) ────────────────
  let inputMode = $state<'voice' | 'text'>('voice');
  let keyboard = $state<'virtual' | 'physical'>('virtual');
  let typedValue = $state('');
  let inputLanguage = $state<'ar' | 'en'>('ar');
  let keyboardContainer: HTMLDivElement | null = $state(null);

  function setInputMode(m: 'voice' | 'text') {
    inputMode = m;
    if (m === 'text' && keyboard === 'virtual') {
      requestAnimationFrame(() => updateKeyboardStyle());
    }
  }

  function toggleKeyboard() {
    keyboard = keyboard === 'virtual' ? 'physical' : 'virtual';
    if (keyboard === 'virtual') {
      requestAnimationFrame(() => updateKeyboardStyle());
    }
  }

  function onRegularKeyboard(e: any) {
    typedValue = e?.target?.value ?? '';
  }

  // Read the current text from whichever input is active (the custom
  // <arabic-keyboard> element exposes getTextAreaValue()/resetValue()).
  function getTypedValue(): string {
    if (keyboard === 'virtual' && keyboardContainer) {
      const el = keyboardContainer.querySelector('arabic-keyboard') as any;
      if (el && typeof el.getTextAreaValue === 'function') {
        return el.getTextAreaValue() || '';
      }
    }
    return typedValue;
  }

  function resetTypedInput() {
    typedValue = '';
    if (keyboardContainer) {
      const el = keyboardContainer.querySelector('arabic-keyboard') as any;
      if (el && typeof el.resetValue === 'function') {
        el.resetValue();
      }
    }
  }

  async function sendTypedMessage() {
    if (!hasActiveSubscription) {
      openPaywallModal();
      return;
    }
    const text = getTypedValue().trim();
    if (!text || isProcessing) return;

    isProcessing = true;
    resetTypedInput();
    trackEvent('tutor_message_sent', { method: 'text', language: inputLanguage, dialect: selectedDialect });
    try {
      await sendUserMessage(text, inputLanguage);
    } finally {
      isProcessing = false;
    }
  }

  // Pre-fill the composer with the current hint so the user can send or tweak it.
  function useHintInComposer() {
    if (!currentHint) return;
    trackEvent('tutor_hint_used', { dialect: selectedDialect });
    inputMode = 'text';
    keyboard = 'physical';
    inputLanguage = 'ar';
    typedValue = currentHint.arabic;
  }

  // The page is the only scroll context: scroll-margin classes on the targets keep
  // them clear of the sticky conversation header and composer.
  function scrollToBottom() {
    setTimeout(() => {
      transcriptEnd?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  }

  // Scroll the *top* of a message into view so long replies are read from the start.
  function scrollToMessage(id: string) {
    setTimeout(() => {
      const el = transcriptContainer?.querySelector<HTMLElement>(`[data-mid="${id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        transcriptEnd?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
  }

  function toggleRecording() {
    if (!hasActiveSubscription && !recording) {
      openPaywallModal();
      return;
    }

    if (recording) {
      stopRecording();
    } else {
      startRecording(inputLanguage);
    }
  }

  // Learn-phase record control: always Arabic, and clear the previous score so
  // the UI returns to its "now you try" state for a fresh attempt.
  function toggleLearnRecording() {
    if (!hasActiveSubscription && !recording) {
      openPaywallModal();
      return;
    }

    if (recording) {
      stopRecording();
    } else {
      vocabResult = null;
      startRecording('ar');
    }
  }

  async function clearConversation() {
    // Show summary if we have any messages at all
    if (conversation.length >= 2) {
      isSavingConversation = true;
      
      // Extract vocabulary directly from local conversation (more reliable!)
      const localVocabulary: VocabularyWord[] = [];
      for (const msg of conversation) {
        if (msg.type === 'tutor' && msg.arabic && msg.english && msg.transliteration) {
          localVocabulary.push({
            arabic: msg.arabic,
            english: msg.english,
            transliteration: msg.transliteration,
            selected: true
          });
        }
      }
      
      // Build conversation text for AI summary
      const conversationText = conversation.map(msg => {
        const role = msg.type === 'user' ? 'Student' : 'Tutor';
        return `${role}: ${msg.arabic || ''} (${msg.english || ''})`;
      }).join('\n');
      
      try {
        // Call summarize API for topics/insights only if we have a conversationId
        let aiSummary = '';
        let aiTopics: string[] = [];
        let aiInsights: SummaryInsight[] = [];
        
        if (conversationId) {
          const response = await fetch('/api/tutor-summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              conversationId,
              dialect: selectedDialect 
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            aiSummary = data.summary || '';
            aiTopics = data.topics || [];
            aiInsights = data.insights || [];
          }
        }
        
        // Use local vocabulary (guaranteed correct) + AI summary/topics
        summaryData = {
          summary: aiSummary || `Practiced ${selectedDialect === 'egyptian-arabic' ? 'Egyptian Arabic' : selectedDialect === 'fusha' ? 'Modern Standard Arabic' : 'Arabic'} conversation`,
          topics: aiTopics.length > 0 ? aiTopics : ['conversation practice'],
          vocabulary: localVocabulary,
          insights: aiInsights
        };
        showSummaryModal = true;
        
      } catch (e) {
        console.error('Failed to summarize conversation:', e);
        // Still show modal with local data
        summaryData = {
          summary: 'Conversation practice session',
          topics: ['conversation practice'],
          vocabulary: localVocabulary,
          insights: []
        };
        showSummaryModal = true;
      } finally {
        isSavingConversation = false;
      }
    } else {
      // Less than 2 messages, just clear
      actuallyCloseConversation();
    }
  }
  
  function actuallyCloseConversation() {
    conversation = [];
    conversationId = null;
    showSummaryModal = false;
    summaryData = { summary: '', topics: [], vocabulary: [], insights: [] };
    exitScenario();
    currentHint = null;
  }
  
  function closeSummaryModal() {
    showSummaryModal = false;
    actuallyCloseConversation();
  }

  function discardConversation() {
    if (confirm('Discard this conversation without saving?')) {
      trackEvent('tutor_conversation_discarded', { message_count: conversation.length, dialect: selectedDialect });
      actuallyCloseConversation();
    }
  }
  
  async function saveSummaryAndWords(selectedWords: VocabularyWord[]) {
    isSavingSession = true;
    trackEvent('tutor_conversation_ended_saved', { dialect: selectedDialect, saved_words_count: selectedWords.length });
    try {
      const response = await fetch('/api/tutor-save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          dialect: selectedDialect,
          summary: summaryData.summary,
          topics: summaryData.topics,
          arabicWords: summaryData.vocabulary.map(v => v.arabic),
          selectedWords: selectedWords,
          insights: summaryData.insights
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Session saved:', result);
        // Could show a toast notification here
      }
    } catch (e) {
      console.error('Failed to save session:', e);
    } finally {
      isSavingSession = false;
      actuallyCloseConversation();
    }
  }

  async function playTutorAudio(text: string, dialect: Dialect, messageId?: string) {
    trackEvent('tutor_audio_played', { dialect, auto_play: autoPlayAudio });
    try {
      const res = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, dialect })
      });

      if (!res.ok) {
        throw new Error(`TTS request failed: ${res.statusText}`);
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
        if (playingMessageId === messageId) playingMessageId = null;
      });

      playingMessageId = messageId ?? null;
      await audio.play();
    } catch (error) {
      console.error('Failed to play tutor audio:', error);
      playingMessageId = null;
      chatError = {
        message: "Couldn't play the tutor's audio — tap the speaker button on the message to hear it.",
        retry: null
      };
    }
  }

  function toggleMessageVisibility(messageId: string, field: 'showFeedback' | 'showBreakdown') {
    conversation = conversation.map(msg => 
      msg.id === messageId 
        ? { ...msg, [field]: !msg[field] }
        : msg
    );
  }
</script>

<PaywallModal isOpen={isModalOpen} handleCloseModal={handleCloseModal}></PaywallModal>

<DefinitionModal
  activeWordObj={activeWord || { english: '', isLoading: false, description: '' }}
  isModalOpen={isDefinitionModalOpen}
  closeModal={closeDefinitionModal}
  dialect={selectedDialect}
/>

<ConversationSummaryModal
  isOpen={showSummaryModal}
  summary={summaryData.summary}
  topics={summaryData.topics}
  vocabulary={summaryData.vocabulary}
  dialect={selectedDialect}
  onClose={closeSummaryModal}
  onSave={saveSummaryAndWords}
  isSaving={isSavingSession}
/>

<DialectComparisonModal
  isOpen={isComparisonModalOpen}
  closeModal={closeComparisonModal}
  originalText={comparisonText}
  originalEnglish={comparisonEnglish}
  {comparisonData}
  isLoading={isComparing}
  error={comparisonError}
  currentDialect={selectedDialect}
/>

<Modal
  isOpen={showCustomScenarioModal}
  handleCloseModal={() => (showCustomScenarioModal = false)}
  width="min(90%, 480px)"
>
  <div class="p-6">
    <h2 class="text-lg font-bold text-text-300 flex items-center gap-2 mb-1">
      <span>✨</span> Create your own scenario
    </h2>
    <p class="text-sm text-text-200 mb-4 leading-relaxed">
      Describe what you'd like to talk about. Your tutor will teach you the key words and
      sentences first, then practise the conversation with you.
    </p>
    <textarea
      bind:value={customScenarioText}
      rows="3"
      placeholder="e.g., Ordering coffee and asking for the wifi password"
      onkeydown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') createCustomScenario(); }}
      class="block w-full text-base text-text-300 bg-tile-200 border-2 border-tile-500 rounded-xl p-3 focus:border-tile-700 focus:outline-none focus:ring-2 focus:ring-tile-600/50 transition-all placeholder:text-text-100 resize-none"
    ></textarea>
    <div class="flex justify-end gap-2 mt-4">
      <button
        type="button"
        onclick={() => { showCustomScenarioModal = false; customScenarioText = ''; }}
        class="px-4 py-2 bg-tile-500 text-text-300 font-medium rounded-xl hover:bg-tile-600 transition-colors"
      >Cancel</button>
      <button
        type="button"
        onclick={createCustomScenario}
        disabled={!customScenarioText.trim()}
        class="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >Start →</button>
    </div>
  </div>
</Modal>

<section class="min-h-screen bg-tile-200">
  <!-- Compact header: title + dialect picker -->
  <header class="py-3 sm:py-5 border-b border-tile-600">
    <div class="max-w-5xl mx-auto px-3 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <span class="text-3xl">🎓</span>
        <div class="min-w-0">
          <h1 class="text-xl sm:text-2xl font-bold text-text-300 leading-tight">
            AI Arabic Tutor
          </h1>
          <p class="text-xs sm:text-sm text-text-200">
            Real conversations in your dialect, with instant feedback.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 flex-wrap shrink-0">
        <div class="flex rounded-lg border border-tile-600 overflow-hidden text-xs font-semibold" role="group" aria-label="Select dialect">
          {#each dialectOptions as dialectOption (dialectOption.value)}
            <button
              type="button"
              onclick={() => setDialect(dialectOption.value)}
              title={dialectOption.label}
              class="px-3 py-2 transition-colors {selectedDialect === dialectOption.value ? 'bg-tile-600 text-text-300' : 'bg-tile-300 text-text-200 hover:bg-tile-400'}"
            >
              {dialectOption.emoji} {dialectOption.short}
            </button>
          {/each}
        </div>
        {#if !hasActiveSubscription}
          <button
            onclick={openPaywallModal}
            title="Subscribe to unlock unlimited conversations with your AI tutor"
            class="px-3 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors shadow-md"
          >
            ⭐ Unlock
          </button>
        {/if}
      </div>
    </div>
  </header>

  <div class="mx-auto p-4 sm:p-6 min-h-screen">
      <!-- Practice Mode Controls -->
      {#if mode === 'practice'}
        <div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden mb-6">
          <div class="p-4 border-b border-tile-600">
            <h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
              <span>📖</span> Practice Controls
            </h3>
          </div>
          <div class="p-4 space-y-4">
            <!-- Navigation -->
            <div class="flex items-center justify-between gap-2">
              <button
                onclick={prevPracticeSentence}
                disabled={practiceIndex === 0}
                class="px-3 py-2 bg-tile-500 hover:bg-tile-600 text-text-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <span class="text-sm text-text-200">
                {practiceIndex + 1} / {filteredPracticeSentences.length}
              </span>
              <button
                onclick={nextPracticeSentence}
                disabled={practiceIndex >= filteredPracticeSentences.length - 1}
                class="px-3 py-2 bg-tile-500 hover:bg-tile-600 text-text-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>

            <button
              onclick={shufflePracticeSentences}
              class="w-full px-4 py-2 bg-tile-500 hover:bg-tile-600 text-text-300 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>🎲</span> Random Sentence
            </button>

            <!-- Record Practice Button -->
            <button
              onclick={togglePracticeRecording}
              disabled={isPracticeProcessing || !currentPracticeSentence || (!hasActiveSubscription && !isPracticeRecording)}
              class="w-full flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed {isPracticeRecording ? 'border-red-500 bg-red-500/20 shadow-lg' : 'border-sky-500 bg-sky-500/10 hover:bg-sky-500/20'}"
            >
              <div class="w-16 h-16 flex items-center justify-center rounded-full {isPracticeRecording ? 'bg-red-500/30' : 'bg-sky-500/30'}">
                {#if isPracticeRecording}
                  <AudioLoading />
                {:else if isPracticeProcessing}
                  <svg class="animate-spin h-8 w-8 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                {:else}
                  <RecordButton />
                {/if}
              </div>
              <span class="text-lg font-semibold text-text-300">
                {#if isPracticeRecording}
                  Tap to Stop
                {:else if isPracticeProcessing}
                  Processing...
                {:else}
                  Record Your Voice
                {/if}
              </span>
            </button>

            {#if !hasActiveSubscription}
              <p class="text-sm text-text-200 text-center">
                🔒 Subscribe to practice sentences
              </p>
            {/if}
          </div>
        </div>
      {/if}

      {#if mode === 'practice'}
        <!-- Practice Mode Content -->
        <div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
          <div class="p-4 border-b border-tile-600">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
                <span>📖</span> Sentence Practice
              </h3>
              {#if currentPracticeSentence}
                <span class="px-3 py-1 bg-tile-500 rounded-full text-xs font-medium text-text-200">
                  From: {currentPracticeSentence.storyTitle}
                </span>
              {/if}
            </div>
          </div>

          <div class="p-6">
            {#if filteredPracticeSentences.length === 0}
              <div class="text-center py-12">
                <div class="text-6xl mb-4">📚</div>
                <h3 class="text-xl font-bold text-text-300 mb-2">No Practice Sentences Available</h3>
                <p class="text-text-200 max-w-md mx-auto">
                  There are no sentences available for {selectedDialect === 'egyptian-arabic' ? 'Egyptian Arabic' : selectedDialect === 'fusha' ? 'Modern Standard Arabic' : 'Levantine Arabic'} yet.
                </p>
                <p class="text-text-200 mt-2">
                  Try creating some stories first, or switch to a different dialect.
                </p>
              </div>
            {:else if currentPracticeSentence}
              <!-- Current Sentence Card -->
              <div class="space-y-6">
                <!-- Arabic Sentence -->
                <div class="bg-tile-300 border-2 border-tile-500 rounded-xl p-6">
                  <div class="flex items-start justify-between gap-4 mb-4">
                    <span class="text-sm font-medium text-text-200">Listen & Repeat</span>
                    <AudioButton text={currentPracticeSentence.arabic} dialect={selectedDialect} className="!p-3 !rounded-xl bg-sky-500 hover:bg-sky-600 text-white" />
                  </div>
                  <p class="text-2xl sm:text-3xl font-bold text-text-300 leading-relaxed" dir="rtl">
                    {currentPracticeSentence.arabic}
                  </p>
                </div>

                <!-- Transliteration -->
                <div class="bg-tile-300 border border-tile-500 rounded-lg p-4">
                  <span class="text-xs font-medium text-text-200 block mb-2">Transliteration</span>
                  <p class="text-lg text-text-300 italic">
                    {currentPracticeSentence.transliteration}
                  </p>
                </div>

                <!-- English Translation -->
                <div class="bg-tile-300 border border-tile-500 rounded-lg p-4">
                  <span class="text-xs font-medium text-text-200 block mb-2">English</span>
                  <p class="text-lg text-text-300">
                    {currentPracticeSentence.english}
                  </p>
                </div>

                <!-- Practice Result -->
                {#if practiceResult}
                  <div class="bg-tile-300 border-2 rounded-xl p-6 {practiceResult.similarity >= 70 ? 'border-emerald-500' : practiceResult.similarity >= 50 ? 'border-amber-500' : 'border-rose-500'}">
                    <div class="flex items-center justify-between mb-4">
                      <span class="text-lg font-bold text-text-300">Your Result</span>
                      <span class="text-2xl font-bold {practiceResult.similarity >= 70 ? 'text-emerald-500' : practiceResult.similarity >= 50 ? 'text-amber-500' : 'text-rose-500'}">
                        {practiceResult.similarity}%
                      </span>
                    </div>

                    {#if practiceResult.transcribedText}
                      <div class="mb-4">
                        <span class="text-xs font-medium text-text-200 block mb-2">What we heard:</span>
                        <p class="text-lg text-text-300" dir="rtl">{practiceResult.transcribedText}</p>
                      </div>
                    {/if}

                    <div class="p-4 rounded-lg {practiceResult.similarity >= 70 ? 'bg-emerald-500/10' : practiceResult.similarity >= 50 ? 'bg-amber-500/10' : 'bg-rose-500/10'}">
                      <p class="text-text-300">{practiceResult.feedback}</p>
                    </div>

                    <button
                      onclick={() => practiceResult = null}
                      class="mt-4 w-full px-4 py-2 bg-tile-500 hover:bg-tile-600 text-text-300 rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                {/if}

                <!-- Recording Status -->
                {#if isPracticeRecording}
                  <div class="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-6 text-center animate-pulse">
                    <div class="flex items-center justify-center gap-3 mb-2">
                      <div class="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                      <span class="text-xl font-bold text-text-300">Recording...</span>
                    </div>
                    <p class="text-text-200">Speak the sentence clearly, then tap to stop</p>
                  </div>
                {:else if isPracticeProcessing}
                  <div class="bg-sky-500/10 border-2 border-sky-500/30 rounded-xl p-6 text-center">
                    <div class="flex items-center justify-center gap-3">
                      <svg class="animate-spin h-6 w-6 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span class="text-xl font-bold text-text-300">Processing your recording...</span>
                    </div>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      {:else}
        <!-- Conversation Mode Content. No overflow-hidden here: it would break the
             sticky header/composer, which stick to the viewport so the page is the
             only scroll context. -->
        <div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg">
          <div class="border-b border-tile-600 sticky top-0 bg-tile-400 z-10 rounded-t-lg">
            <div class="p-4 flex items-center justify-between gap-3 flex-wrap">
              <h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
                <span>💬</span> Conversation
              </h3>
              <div class="flex items-center gap-2 flex-wrap">
                {#if conversation.length > 0}
                  <div class="flex border border-tile-600 rounded-md overflow-hidden text-[10px] font-semibold" role="group" aria-label="Show or hide translations for all messages">
                    <button type="button" onclick={() => (displayEnglish = !displayEnglish)} aria-pressed={displayEnglish} title="Show English under every word" class="px-2 py-1 transition-colors {displayEnglish ? 'bg-tile-600 text-text-300' : 'bg-tile-300 text-text-200 hover:bg-tile-400'}">EN</button>
                    <button type="button" onclick={() => (displayTransliteration = !displayTransliteration)} aria-pressed={displayTransliteration} title="Show transliteration for every message" class="px-2 py-1 transition-colors {displayTransliteration ? 'bg-tile-600 text-text-300' : 'bg-tile-300 text-text-200 hover:bg-tile-400'}">TR</button>
                    <button type="button" onclick={() => (displayHint = !displayHint)} aria-pressed={displayHint} title="Show full translation for every message" class="px-2 py-1 transition-colors {displayHint ? 'bg-tile-600 text-text-300' : 'bg-tile-300 text-text-200 hover:bg-tile-400'}">Hint</button>
                  </div>
                {/if}
                {#if conversation.length > 0 && !activeScenarioContext}
                  <button
                    type="button"
                    onclick={toggleHints}
                    class="text-xs px-2.5 py-1 rounded-md font-medium bg-tile-500 hover:bg-tile-600 text-text-300 transition-colors"
                    aria-pressed={hintsVisible}
                    title="Toggle reply suggestions"
                  >
                    💡 {hintsVisible ? 'Hide hints' : 'Show hints'}
                  </button>
                {/if}
                <button
                  type="button"
                  onclick={toggleAutoPlay}
                  aria-pressed={autoPlayAudio}
                  title={autoPlayAudio ? 'Auto-play tutor audio: on' : 'Auto-play tutor audio: off'}
                  class="text-xs px-2.5 py-1 rounded-md font-medium bg-tile-500 hover:bg-tile-600 text-text-300 transition-colors"
                >
                  {autoPlayAudio ? '🔊 Auto-play' : '🔇 Muted'}
                </button>
                {#if conversation.length > 0}
                  <button
                    type="button"
                    onclick={clearConversation}
                    disabled={isSavingConversation}
                    title="End this conversation and save it to your learning profile — your tutor will remember what you discussed"
                    class="text-xs px-2.5 py-1 rounded-md font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-wait"
                  >
                    {isSavingConversation ? 'Saving…' : '✓ End & Save'}
                  </button>
                  <button
                    type="button"
                    onclick={discardConversation}
                    title="Discard this conversation without saving"
                    class="text-xs px-2.5 py-1 rounded-md font-medium bg-tile-500 hover:bg-tile-600 text-text-300 transition-colors"
                  >
                    Discard
                  </button>
                {/if}
              </div>
            </div>

            {#if activeScenarioContext && activeScenarioDialog}
              <div class="px-4 pb-3 -mt-1 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-xl shrink-0">{activeScenarioContext.emoji}</span>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-text-300 truncate">
                      {scenarioPhase === 'learn' ? 'Learning' : 'Practicing'}: {activeScenarioContext.title}
                    </p>
                    <p class="text-[11px] text-text-200 truncate">
                      {scenarioPhase === 'learn'
                        ? 'New words first, then the conversation'
                        : `Tutor is playing: ${activeScenarioDialog.otherRoleEnglish}`}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  {#if scenarioPhase !== 'learn'}
                    <button
                      type="button"
                      onclick={toggleHints}
                      class="text-[11px] px-2 py-1 rounded-md font-medium bg-tile-500 hover:bg-tile-600 text-text-300 transition-colors"
                      aria-pressed={hintsVisible}
                    >
                      {hintsVisible ? 'Hide hints' : 'Show hints'}
                    </button>
                  {/if}
                  <button
                    type="button"
                    onclick={exitScenario}
                    class="text-[11px] px-2 py-1 rounded-md font-medium bg-tile-500 hover:bg-tile-600 text-text-300 transition-colors"
                  >
                    Exit
                  </button>
                </div>
              </div>
            {/if}
          </div>
        
        <div bind:this={transcriptContainer} class="p-4">
          {#if scenarioPhase === 'learn'}
            <div class="max-w-xl mx-auto py-4">
              {#if isLoadingVocab}
                <div class="flex flex-col items-center justify-center min-h-[300px] text-center gap-3">
                  <span class="text-4xl animate-bounce">📚</span>
                  <p class="text-text-300 font-semibold">Preparing your words & sentences…</p>
                  <p class="text-text-200 text-sm">Your tutor is choosing the words and practice sentences you'll need for this conversation.</p>
                </div>
              {:else if vocabError}
                <div class="bg-rose-500/10 border-2 border-rose-500/40 rounded-xl p-4 text-center">
                  <p class="text-sm font-medium text-text-300 mb-3">{vocabError}</p>
                  <div class="flex justify-center gap-2">
                    <button
                      type="button"
                      onclick={fetchScenarioVocab}
                      class="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                    >Retry</button>
                    <button
                      type="button"
                      onclick={beginPracticePhase}
                      class="text-xs px-3 py-1.5 bg-tile-500 text-text-300 rounded-lg font-medium hover:bg-tile-600 transition-colors"
                    >Skip to conversation</button>
                  </div>
                </div>
              {:else if currentVocabItem}
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full {currentVocabItem.kind === 'sentence' ? 'bg-sky-500/15 text-sky-700' : 'bg-emerald-500/15 text-emerald-700'}">
                      {currentVocabItem.kind === 'sentence' ? '💬 Practice sentence' : '🔤 New word'}
                    </span>
                    <span class="text-xs font-semibold text-text-200">{currentVocabIndex + 1} of {scenarioVocab.length}</span>
                  </div>
                  <button
                    type="button"
                    onclick={beginPracticePhase}
                    class="text-xs text-text-200 hover:text-text-300 underline underline-offset-2"
                  >Skip intro →</button>
                </div>
                <div class="h-1.5 w-full bg-tile-500 rounded-full overflow-hidden mb-6">
                  <div class="h-full bg-emerald-500 transition-all duration-300" style="width: {(currentVocabIndex / scenarioVocab.length) * 100}%"></div>
                </div>

                <div class="bg-tile-300 border-2 border-tile-500 rounded-2xl p-6 text-center">
                  <p class="text-text-200 text-sm mb-4 leading-relaxed">{currentVocabItem.teachingLine}</p>
                  <p class="font-bold text-text-300 mb-2 {currentVocabItem.kind === 'sentence' ? 'text-2xl leading-relaxed' : 'text-4xl'}" dir="rtl">{currentVocabItem.arabic}</p>
                  <p class="text-lg text-text-200 mb-1">{currentVocabItem.transliteration}</p>
                  <p class="text-sm text-text-200 mb-5">{currentVocabItem.english}</p>
                  <div class="flex justify-center">
                    <AudioButton text={currentVocabItem.arabic} dialect={selectedDialect}>Hear it</AudioButton>
                  </div>
                </div>

                <div class="mt-6 flex flex-col items-center gap-4">
                  {#if vocabResult}
                    <div class="flex flex-col items-center gap-2">
                      <Similarity score={vocabResult.similarity} />
                      <p class="text-sm font-semibold {vocabResult.passed ? 'text-emerald-600' : 'text-orange-500'}">
                        {vocabResult.passed ? 'Nice — that sounded great!' : 'Not quite — listen again and repeat.'}
                      </p>
                    </div>
                    <div class="flex items-center gap-2">
                      {#if vocabResult.passed}
                        <button
                          type="button"
                          onclick={advanceVocab}
                          class="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                        >{currentVocabIndex < scenarioVocab.length - 1 ? 'Next →' : 'Start conversation →'}</button>
                      {:else}
                        <button
                          type="button"
                          onclick={toggleLearnRecording}
                          disabled={isProcessing}
                          class="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >Try again</button>
                        {#if canSkipVocab}
                          <button
                            type="button"
                            onclick={skipVocabWord}
                            class="px-4 py-2.5 bg-tile-500 text-text-300 font-medium rounded-xl hover:bg-tile-600 transition-colors"
                          >Skip</button>
                        {/if}
                      {/if}
                    </div>
                  {:else}
                    <button
                      type="button"
                      onclick={toggleLearnRecording}
                      disabled={isProcessing}
                      class="flex items-center justify-center gap-3 px-6 py-3 rounded-xl border-2 font-semibold text-text-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed {recording ? 'border-red-500 bg-red-500/15 shadow-lg' : 'border-tile-600 bg-tile-300 hover:bg-tile-500'}"
                      aria-label={recording ? 'Stop recording' : 'Record your pronunciation'}
                    >
                      {#if recording}
                        <span class="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                        <span class="tabular-nums text-sm">{formatRecordingTime(recordingSeconds)}</span>
                        <span class="text-sm font-medium">Listening — tap when done</span>
                      {:else if isProcessing}
                        <AudioLoading />
                        <span class="text-sm font-medium">Checking…</span>
                      {:else}
                        <RecordButton />
                        <span>Now you try</span>
                      {/if}
                    </button>
                    {#if !hasActiveSubscription}
                      <p class="text-xs text-text-200 text-center">
                        🔒 <button type="button" class="underline underline-offset-2 hover:text-text-300" onclick={openPaywallModal}>Subscribe</button> to practice speaking
                      </p>
                    {/if}
                  {/if}
                </div>
              {/if}
            </div>
          {:else if conversation.length === 0 && !activeScenarioContext && !isTranscribing && !isGettingResponse && !chatError}
            <div class="flex flex-col items-center justify-start h-full min-h-[400px] text-center py-6">
              <div class="text-6xl mb-4">👋</div>
              <h3 class="text-xl font-bold text-text-300 mb-2">Start a Conversation</h3>
              <p class="text-text-200 max-w-md leading-relaxed">
                Pick a beginner scenario below for guided practice, or tap the mic
                below to start a free conversation with your AI tutor.
              </p>

              {#if scenariosForDialect.length > 0 && !activeScenarioContext}
                <div class="w-full max-w-4xl mt-8">
                  <div class="flex items-center justify-between mb-3 px-1">
                    <h4 class="text-sm font-bold text-text-300 flex items-center gap-2">
                      <span>🎯</span> Beginner Scenarios
                    </h4>
                    <span class="text-xs text-text-200">Tap a card to start guided practice</span>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
                    {#each scenariosForDialect as scenario (scenario.id)}
                      <button
                        type="button"
                        onclick={() => startScenario(scenario)}
                        class="group flex items-start gap-3 p-4 bg-tile-300 rounded-xl border-2 border-tile-500 hover:bg-tile-400 hover:border-tile-600 hover:shadow-lg transition-all duration-200 text-left active:scale-95"
                      >
                        <span class="text-3xl shrink-0 transition-transform duration-200 group-hover:scale-110">{scenario.emoji}</span>
                        <div class="min-w-0">
                          <p class="text-sm font-semibold text-text-300 mb-1">{scenario.title}</p>
                          <p class="text-xs text-text-200 leading-snug">{scenario.description}</p>
                        </div>
                      </button>
                    {/each}

                    <!-- Custom scenario CTA -->
                    <button
                      type="button"
                      onclick={() => (showCustomScenarioModal = true)}
                      class="group flex items-start gap-3 p-4 bg-sky-500/5 rounded-xl border-2 border-dashed border-sky-500/40 hover:bg-sky-500/10 hover:border-sky-500/60 hover:shadow-lg transition-all duration-200 text-left active:scale-95"
                    >
                      <span class="text-3xl shrink-0 transition-transform duration-200 group-hover:scale-110">✨</span>
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-text-300 mb-1">Create your own</p>
                        <p class="text-xs text-text-200 leading-snug">Describe what you want to talk about and practice it.</p>
                      </div>
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          {:else}
            <div class="space-y-4 max-w-3xl mx-auto">
              {#each conversation as message (message.id)}
                <MessageBubble
                  {message}
                  showEnglish={displayEnglish}
                  showTransliteration={displayTransliteration}
                  showHint={displayHint}
                  {playingMessageId}
                  onWordClick={handleWordClick}
                  onToggleFeedback={(id) => toggleMessageVisibility(id, 'showFeedback')}
                />
              {/each}

              <!-- Reply hint: appears below the latest tutor message -->
              {#if hintsVisible && (currentHint || isLoadingHint)}
                <div class="flex">
                  <div class="max-w-[90%] sm:max-w-[80%] bg-sky-500/10 border border-dashed border-sky-500/40 rounded-xl p-3 sm:p-4 ml-1">
                    <div class="flex items-center justify-between gap-3 mb-1">
                      <span class="text-[10px] font-bold uppercase tracking-wide text-sky-700">
                        💡 Hint — try saying
                      </span>
                      {#if currentHint && !isLoadingHint}
                        <div class="flex items-center gap-1.5">
                          <AudioButton text={currentHint.arabic} dialect={selectedDialect} className="!p-1.5 !rounded-md bg-tile-500 hover:bg-tile-600" />
                          <button
                            type="button"
                            onclick={useHintInComposer}
                            title="Put this hint in the message box"
                            class="text-[11px] px-2 py-1 rounded-md font-medium bg-tile-500 hover:bg-tile-600 text-text-300 transition-colors"
                          >
                            ✏️ Use
                          </button>
                        </div>
                      {/if}
                    </div>
                    {#if isLoadingHint}
                      <p class="text-xs text-text-200 italic">Thinking of a hint…</p>
                    {:else if currentHint}
                      <p class="text-base sm:text-lg font-semibold text-text-300 leading-snug" dir="rtl">{currentHint.arabic}</p>
                      <p class="text-xs sm:text-sm text-text-200 italic mt-0.5">{currentHint.transliteration}</p>
                      <p class="text-xs sm:text-sm text-text-300 mt-0.5">{currentHint.english}</p>
                    {/if}
                  </div>
                </div>
              {/if}

              <!-- Loading States -->
              {#if isTranscribing}
                <div class="bg-sky-500/10 border-2 border-sky-500/30 rounded-xl p-6 animate-pulse">
                  <div class="flex items-center gap-3">
                    <div class="flex gap-1">
                      <div class="w-3 h-3 bg-sky-500 rounded-full animate-bounce"></div>
                      <div class="w-3 h-3 bg-sky-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                      <div class="w-3 h-3 bg-sky-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                    </div>
                    <div>
                      <p class="text-lg font-semibold text-text-300">
                        Processing your {recordingLanguage === 'ar' ? 'Arabic' : 'English'}...
                      </p>
                      <p class="text-text-200 text-sm">Transcribing and translating</p>
                    </div>
                  </div>
                </div>
              {/if}
              
              {#if isGettingResponse}
                <div class="bg-tile-300 border-2 border-tile-500 rounded-xl p-6 animate-pulse">
                  <div class="flex items-center gap-3">
                    <div class="flex gap-1">
                      <div class="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div class="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                      <div class="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                    </div>
                    <div>
                      <p class="text-lg font-semibold text-text-300">
                        Tutor is thinking...
                      </p>
                      <p class="text-text-200 text-sm">Preparing your personalized response</p>
                    </div>
                  </div>
                </div>
              {/if}

              <!-- Error state: something in the voice/chat pipeline failed -->
              {#if chatError}
                <div class="bg-rose-500/10 border-2 border-rose-500/40 rounded-xl p-4" role="alert">
                  <div class="flex items-start justify-between gap-3 flex-wrap">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="text-xl shrink-0">⚠️</span>
                      <p class="text-sm font-medium text-text-300">{chatError.message}</p>
                    </div>
                    <div class="flex gap-2 shrink-0">
                      {#if chatError.retry}
                        <button
                          type="button"
                          onclick={chatError.retry}
                          class="text-xs px-3 py-1.5 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors"
                        >
                          Retry
                        </button>
                      {/if}
                      <button
                        type="button"
                        onclick={() => (chatError = null)}
                        class="text-xs px-3 py-1.5 bg-tile-500 text-text-300 rounded-lg font-medium hover:bg-tile-600 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {/if}
          <!-- Scroll anchor: scroll-margin keeps content clear of the sticky composer -->
          <div bind:this={transcriptEnd} class="scroll-mb-48" aria-hidden="true"></div>
        </div>

        <!-- Composer: mic + language toggle, or typed input. Sticks to the viewport
             bottom (above the mobile nav) so it's always reachable while the page scrolls.
             Hidden during the Learn phase, which has its own record control. -->
        {#if scenarioPhase !== 'learn'}
        <div class="border-t-2 border-tile-600 bg-tile-400 p-3 sm:p-4 sticky bottom-16 lg:bottom-0 z-30 rounded-b-lg">
          <div class="max-w-3xl mx-auto">
            {#if inputMode === 'text'}
              <div bind:this={keyboardContainer}>
                <div class="mb-2 flex items-center justify-between gap-2 flex-wrap">
                  <div class="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onclick={toggleKeyboard}
                      class="flex items-center gap-2 px-3 py-1.5 text-sm text-text-300 bg-tile-300 hover:bg-tile-500 border border-tile-600 rounded-lg transition-colors"
                    >
                      {keyboard === 'virtual' ? '📱 Use native keyboard' : '⌨️ Use virtual keyboard'}
                    </button>
                    <div class="flex rounded-lg border border-tile-600 overflow-hidden text-xs font-semibold">
                      <button
                        type="button"
                        onclick={() => (inputLanguage = 'ar')}
                        class="px-3 py-1.5 transition-colors {inputLanguage === 'ar' ? 'bg-tile-600 text-text-300' : 'bg-tile-300 text-text-200 hover:bg-tile-400'}"
                      >عربي</button>
                      <button
                        type="button"
                        onclick={() => (inputLanguage = 'en')}
                        class="px-3 py-1.5 transition-colors {inputLanguage === 'en' ? 'bg-tile-600 text-text-300' : 'bg-tile-300 text-text-200 hover:bg-tile-400'}"
                      >EN</button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onclick={() => setInputMode('voice')}
                    class="flex items-center gap-1 text-sm text-text-200 hover:text-text-300 transition-colors"
                  >🎙️ Voice</button>
                </div>

                <div class="block {keyboard !== 'virtual' ? 'hidden' : ''}">
                  <arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
                </div>

                <textarea
                  oninput={onRegularKeyboard}
                  bind:value={typedValue}
                  placeholder={inputLanguage === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
                  dir={inputLanguage === 'ar' ? 'rtl' : 'ltr'}
                  rows="2"
                  onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTypedMessage(); } }}
                  class="block w-full text-lg text-text-300 bg-tile-200 border-2 border-tile-500 rounded-xl p-3 focus:border-tile-700 focus:outline-none focus:ring-2 focus:ring-tile-600/50 transition-all placeholder:text-text-100 {keyboard === 'virtual' ? 'hidden' : ''}"
                ></textarea>

                <div class="flex justify-end mt-2">
                  <button
                    type="button"
                    onclick={sendTypedMessage}
                    disabled={isProcessing}
                    class="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >Send →</button>
                </div>
              </div>
            {:else}
              <!-- Voice mode: language toggle + one mic button -->
              <div class="flex items-center gap-2 sm:gap-3">
                <div class="flex rounded-lg border border-tile-600 overflow-hidden text-xs font-semibold shrink-0" role="group" aria-label="Speaking language">
                  <button
                    type="button"
                    onclick={() => (inputLanguage = 'ar')}
                    disabled={recording}
                    class="px-3 py-2.5 transition-colors disabled:opacity-50 {inputLanguage === 'ar' ? 'bg-tile-600 text-text-300' : 'bg-tile-300 text-text-200 hover:bg-tile-400'}"
                  >عربي</button>
                  <button
                    type="button"
                    onclick={() => (inputLanguage = 'en')}
                    disabled={recording}
                    class="px-3 py-2.5 transition-colors disabled:opacity-50 {inputLanguage === 'en' ? 'bg-tile-600 text-text-300' : 'bg-tile-300 text-text-200 hover:bg-tile-400'}"
                  >EN</button>
                </div>

                <button
                  type="button"
                  onclick={toggleRecording}
                  disabled={isProcessing}
                  class="flex-1 flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border-2 font-semibold text-text-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed {recording ? 'border-red-500 bg-red-500/15 shadow-lg' : 'border-tile-600 bg-tile-300 hover:bg-tile-500'}"
                  aria-label={recording ? 'Stop recording and send' : (inputLanguage === 'ar' ? 'Record Arabic' : 'Record English')}
                >
                  {#if recording}
                    <span class="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                    <span class="tabular-nums text-sm">{formatRecordingTime(recordingSeconds)}</span>
                    <span class="text-sm font-medium">Recording {recordingLanguage === 'ar' ? 'Arabic' : 'English'} — tap to send</span>
                  {:else if isProcessing}
                    <span class="text-sm font-medium">Processing…</span>
                  {:else}
                    <RecordButton />
                    <span>{inputLanguage === 'ar' ? 'Speak Arabic' : 'Ask in English'}</span>
                  {/if}
                </button>

                {#if recording}
                  <button
                    type="button"
                    onclick={cancelRecording}
                    aria-label="Cancel recording"
                    title="Discard this recording"
                    class="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl border-2 border-tile-600 bg-tile-300 hover:bg-tile-500 text-text-300 text-lg transition-colors"
                  >✕</button>
                {:else}
                  <button
                    type="button"
                    onclick={() => setInputMode('text')}
                    aria-label="Type a message instead"
                    title="Type a message instead"
                    class="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl border-2 border-tile-600 bg-tile-300 hover:bg-tile-500 text-lg transition-colors"
                  >⌨️</button>
                {/if}
              </div>

              {#if !hasActiveSubscription}
                <p class="text-xs text-text-200 mt-2 text-center">
                  🔒 <button type="button" class="underline underline-offset-2 hover:text-text-300" onclick={openPaywallModal}>Subscribe</button> to talk with the tutor
                </p>
              {/if}
            {/if}
          </div>
        </div>
        {/if}
      </div>
      {/if}


  </div>
</section>
