<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDialect } from '$lib/store/store';
  import RecordButton from '$lib/components/RecordButton.svelte';
  import AudioLoading from '$lib/components/AudioLoading.svelte';
  import AudioButton from '$lib/components/AudioButton.svelte';
  import PaywallModal from '$lib/components/PaywallModal.svelte';
  import DialectComparisonModal from '$lib/components/dialect-shared/sentences/DialectComparisonModal.svelte';
  import DefinitionModal from '$lib/components/dialect-shared/sentences/DefinitionModal.svelte';
  import ConversationSummaryModal from '$lib/components/ConversationSummaryModal.svelte';
  import { type Dialect } from '$lib/types/index';
  import type { DialectComparisonSchema } from '$lib/utils/gemini-schemas';
  import { getDefaultDialect } from '$lib/helpers/get-default-dialect';

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
          dialect: selectedDialect
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
    
    const root = document.documentElement;
    const originalWidth = getComputedStyle(root).getPropertyValue('--layout-width');
    root.style.setProperty('--layout-width', '2400px');
    
    return () => {
      root.style.setProperty('--layout-width', originalWidth);
    };
  });

  type ConversationMessage = {
    id: string;
    type: 'user' | 'tutor';
    arabic?: string;
    english?: string;
    transliteration?: string;
    feedback?: string;
    originalLanguage?: 'ar' | 'en';
    timestamp: Date;
    showArabic?: boolean;
    showEnglish?: boolean;
    showTransliteration?: boolean;
    showFeedback?: boolean;
  };

  const dialectOptions = [
    { value: 'egyptian-arabic', label: 'Egyptian Arabic', emoji: '🇪🇬' },
    { value: 'fusha', label: 'Modern Standard Arabic', emoji: '📚' },
    { value: 'levantine', label: 'Levantine Arabic', emoji: '🇱🇧' },
  ];

  // Mode: 'conversation' or 'practice'
  type TutorMode = 'conversation' | 'practice';
  let mode = $state<TutorMode>('conversation');

  let selectedDialect = $state<Dialect>(getDefaultDialect(data.user) as Dialect);
  let recording = $state(false);
  let recordingLanguage = $state<'ar' | 'en'>('ar');
  let mediaRecorder: MediaRecorder | null = $state(null);
  let audioChunks: Blob[] = $state([]);
  let conversation: ConversationMessage[] = $state([]);
  let conversationId: string | null = $state(null); // Track conversation ID for memory
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
    }
  }

  function prevPracticeSentence() {
    if (practiceIndex > 0) {
      practiceIndex--;
      practiceResult = null;
    }
  }

  function shufflePracticeSentences() {
    practiceIndex = Math.floor(Math.random() * filteredPracticeSentences.length);
    practiceResult = null;
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
    } catch (error) {
      console.error('Error starting practice recording:', error);
      alert('Failed to access microphone. Please check your permissions.');
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
    
    selectedDialect = dialect as Dialect;
    conversation = [];
    conversationId = null; // Reset for new dialect
  }

  async function startRecording(language: 'ar' | 'en') {
    if (!hasActiveSubscription) {
      openPaywallModal();
      return;
    }

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
        await processRecording();
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      recording = true;
      audioChunks = [];
    } catch (error) {
      console.error('Error starting recording:', error);
      recording = false;
      alert('Failed to access microphone. Please check your permissions.');
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      recording = false;
    }
  }

  async function processRecording() {
    if (audioChunks.length === 0) return;

    isProcessing = true;
    isTranscribing = true;

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

      const translateResponse = await fetch('/api/translate-user-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          dialect: selectedDialect,
          inputLanguage: recordingLanguage
        })
      });

      if (!translateResponse.ok) {
        throw new Error('Failed to translate message');
      }

      const translateData = await translateResponse.json();

      isTranscribing = false;
      isGettingResponse = true;
      scrollToBottom();

      const userMsg: ConversationMessage = {
        id: Date.now().toString(),
        type: 'user',
        arabic: translateData.arabic,
        english: translateData.english,
        transliteration: translateData.transliteration,
        feedback: translateData.feedback || '',
        originalLanguage: recordingLanguage,
        timestamp: new Date(),
        showArabic: true,
        showEnglish: true,
        showTransliteration: true,
        showFeedback: true
      };
      conversation = [...conversation, userMsg];
      scrollToBottom();
      
      setTimeout(() => scrollToBottom(), 100);

      const conversationHistory = conversation
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
        .slice(-10);

      const tutorResponse = await fetch('/api/tutor-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          dialect: selectedDialect,
          conversation: conversationHistory,
          conversationId: conversationId // Pass conversation ID for memory
        })
      });

      if (!tutorResponse.ok) {
        throw new Error('Failed to get tutor response');
      }

      const tutorData = await tutorResponse.json();
      
      // Store conversation ID for memory persistence
      if (tutorData.conversationId && !conversationId) {
        conversationId = tutorData.conversationId;
      }

      const tutorMsg: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        type: 'tutor',
        arabic: tutorData.arabic,
        english: tutorData.english,
        transliteration: tutorData.transliteration,
        timestamp: new Date(),
        showArabic: true,
        showEnglish: true,
        showTransliteration: true
      };
      conversation = [...conversation, tutorMsg];
      scrollToBottom();
      
      setTimeout(() => scrollToBottom(), 100);

      if (tutorData.arabic) {
        setTimeout(async () => {
          await playTutorAudio(tutorData.arabic, selectedDialect);
        }, 500);
      }

    } catch (error) {
      console.error('Error processing recording:', error);
      alert('Failed to process your message. Please try again.');
    } finally {
      isProcessing = false;
      isTranscribing = false;
      isGettingResponse = false;
    }
  }

  function scrollToBottom() {
    if (transcriptContainer) {
      setTimeout(() => {
        transcriptContainer?.scrollTo({
          top: transcriptContainer.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }

  function toggleRecording(language: 'ar' | 'en') {
    if (!hasActiveSubscription && !recording) {
      openPaywallModal();
      return;
    }

    if (recording) {
      stopRecording();
    } else {
      startRecording(language);
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
  }
  
  function closeSummaryModal() {
    showSummaryModal = false;
    actuallyCloseConversation();
  }
  
  async function saveSummaryAndWords(selectedWords: VocabularyWord[]) {
    isSavingSession = true;
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

  async function playTutorAudio(text: string, dialect: Dialect) {
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
      audio.play();
      
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });
    } catch (error) {
      console.error('Failed to play tutor audio:', error);
    }
  }

  function toggleMessageVisibility(messageId: string, field: 'showArabic' | 'showEnglish' | 'showTransliteration' | 'showFeedback') {
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

<section class="min-h-screen bg-tile-200">
  <!-- Hero Section -->
  <header class="py-8 sm:py-12 border-b border-tile-600">
    <div class="max-w-7xl mx-auto px-3 sm:px-8">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div class="max-w-2xl">
          <div class="flex items-center gap-3 mb-4">
            <span class="text-5xl">🎓</span>
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-300 leading-tight">
              AI Arabic Tutor
            </h1>
          </div>
          <p class="text-lg sm:text-xl text-text-200 leading-relaxed">
            {#if mode === 'conversation'}
              Practice speaking Arabic with an AI tutor. Have real conversations in your chosen dialect with instant feedback.
            {:else}
              Practice sentences from stories. Listen, repeat, and compare your pronunciation.
            {/if}
          </p>

          <!-- Mode Toggle -->
          <div class="mt-6 flex gap-2">
            <button
              onclick={() => mode = 'conversation'}
              class="px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 {mode === 'conversation' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-tile-400 text-text-200 hover:bg-tile-500 border-2 border-tile-600'}"
            >
              <span class="flex items-center gap-2">
                <span>💬</span> Conversation
              </span>
            </button>
            <button
              onclick={() => { mode = 'practice'; practiceResult = null; }}
              class="px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 {mode === 'practice' ? 'bg-sky-600 text-white shadow-lg' : 'bg-tile-400 text-text-200 hover:bg-tile-500 border-2 border-tile-600'}"
            >
              <span class="flex items-center gap-2">
                <span>📖</span> Sentence Practice
                {#if filteredPracticeSentences.length > 0}
                  <span class="text-xs opacity-75">({filteredPracticeSentences.length})</span>
                {/if}
              </span>
            </button>
          </div>
        </div>
        
        {#if !hasActiveSubscription}
          <div class="bg-tile-400 border-2 border-amber-500/50 rounded-lg p-6 shadow-lg lg:max-w-sm">
            <div class="flex items-center gap-3 mb-3">
              <span class="text-2xl">⭐</span>
              <h3 class="text-lg font-bold text-text-300">Premium Feature</h3>
            </div>
            <p class="text-text-200 mb-4">
              Subscribe to unlock unlimited conversations with your AI tutor.
            </p>
            <button 
              onclick={openPaywallModal} 
              class="w-full px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors shadow-md"
            >
              Unlock Now →
            </button>
          </div>
        {/if}
      </div>
    </div>
  </header>

  <div class="flex flex-col lg:flex-row">
    <!-- Left Sidebar: Controls -->
    <div class="lg:w-80 xl:w-96 p-4 sm:p-6 bg-tile-300 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto border-r border-tile-600">
      
      <!-- Dialect Selection Card -->
      <div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden mb-6">
        <div class="p-4 border-b border-tile-600">
          <h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
            <span>🌍</span> Select Dialect
          </h3>
        </div>
        <div class="p-4 space-y-2">
          {#each dialectOptions as dialectOption}
            <button
              type="button"
              onclick={() => setDialect(dialectOption.value)}
              class="w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 text-left {selectedDialect === dialectOption.value ? 'bg-tile-500 border-tile-400 shadow-md' : 'bg-tile-300 border-tile-600 hover:bg-tile-300/70 hover:border-tile-500'}"
            >
              <span class="text-xl">{dialectOption.emoji}</span>
              <span class="font-semibold text-text-300 text-sm">{dialectOption.label}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Recording Controls Card - Conversation Mode -->
      {#if mode === 'conversation'}
        <div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden mb-6">
          <div class="p-4 border-b border-tile-600">
            <h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
              <span>🎙️</span> Start Speaking
            </h3>
          </div>
          <div class="p-4">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <!-- Arabic Recording Button -->
              <button
                onclick={() => toggleRecording('ar')}
                disabled={isProcessing || (!hasActiveSubscription && !recording)}
                class="flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed {recording && recordingLanguage === 'ar' ? 'border-sky-500 bg-sky-500/20 shadow-lg' : 'border-tile-600 bg-tile-300 hover:bg-tile-500 hover:border-tile-500'}"
                aria-label={recording && recordingLanguage === 'ar' ? 'Stop recording Arabic' : 'Start recording Arabic'}
              >
                <div class="w-14 h-14 flex items-center justify-center rounded-full {recording && recordingLanguage === 'ar' ? 'bg-sky-500/30' : 'bg-tile-500'}">
                  {#if recording && recordingLanguage === 'ar'}
                    <AudioLoading />
                  {:else}
                    <RecordButton />
                  {/if}
                </div>
                <span class="text-sm font-semibold text-text-300">Speak Arabic</span>
                <span class="text-xs text-text-200">For conversation</span>
              </button>

              <!-- English Recording Button -->
              <button
                onclick={() => toggleRecording('en')}
                disabled={isProcessing || (!hasActiveSubscription && !recording)}
                class="flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed {recording && recordingLanguage === 'en' ? 'border-emerald-500 bg-emerald-500/20 shadow-lg' : 'border-tile-600 bg-tile-300 hover:bg-tile-500 hover:border-tile-500'}"
                aria-label={recording && recordingLanguage === 'en' ? 'Stop recording English' : 'Start recording English'}
              >
                <div class="w-14 h-14 flex items-center justify-center rounded-full {recording && recordingLanguage === 'en' ? 'bg-emerald-500/30' : 'bg-tile-500'}">
                  {#if recording && recordingLanguage === 'en'}
                    <AudioLoading />
                  {:else}
                    <RecordButton />
                  {/if}
                </div>
                <span class="text-sm font-semibold text-text-300">Ask in English</span>
                <span class="text-xs text-text-200">For questions</span>
              </button>
            </div>

            <!-- Status Message -->
            <div class="p-3 bg-tile-300 rounded-lg border border-tile-500">
              {#if recording}
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <p class="text-sm font-medium text-text-300">
                    Recording {recordingLanguage === 'ar' ? 'Arabic' : 'English'}...
                  </p>
                </div>
                <p class="text-xs text-text-200 mt-1">Click the button again to stop</p>
              {:else if !hasActiveSubscription}
                <p class="text-sm text-text-200">
                  🔒 Subscribe to start conversations
                </p>
              {:else}
                <p class="text-sm text-text-200">
                  💡 Click a button above to start speaking
                </p>
              {/if}
            </div>
          </div>
        </div>
      {:else}
        <!-- Practice Mode Controls -->
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

      <!-- Actions Card - Conversation Mode -->
      {#if mode === 'conversation' && conversation.length > 0}
        <div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
          <div class="p-4 border-b border-tile-600">
            <h3 class="text-sm font-bold text-text-300 flex items-center gap-2">
              <span>💾</span> Save Session
            </h3>
          </div>
          <div class="p-4 space-y-3">
            <p class="text-xs text-text-200 leading-relaxed">
              End this conversation to save it to your learning profile. Your tutor will remember what you discussed and use it to personalize future sessions.
            </p>
            <button
              onclick={clearConversation}
              disabled={isSavingConversation}
              class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-wait"
            >
              {#if isSavingConversation}
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving & Analyzing...
              {:else}
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                End & Save Conversation
              {/if}
            </button>
            <p class="text-[10px] text-text-200/70 text-center">
              {conversation.length} messages will be analyzed for learning insights
            </p>
          </div>
        </div>
      {/if}

      <!-- Tips Card -->
      <div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden mt-6">
        <div class="p-4 border-b border-tile-600">
          <h3 class="text-sm font-bold text-text-300 flex items-center gap-2">
            <span>💡</span> Tips
          </h3>
        </div>
        <div class="p-4 space-y-2 text-sm text-text-200">
          {#if mode === 'conversation'}
            <p>• Use <strong class="text-text-300">"Speak Arabic"</strong> for conversation practice</p>
            <p>• Use <strong class="text-text-300">"Ask in English"</strong> to ask "How do I say...?"</p>
            <p>• Click any word in responses for definitions</p>
            <p>• Toggle visibility buttons to hide/show translations</p>
          {:else}
            <p>• First, <strong class="text-text-300">listen</strong> to the sentence using the speaker button</p>
            <p>• Then <strong class="text-text-300">record yourself</strong> saying the sentence</p>
            <p>• Compare your pronunciation with the original</p>
            <p>• Use the navigation to try different sentences</p>
          {/if}
        </div>
      </div>
      
      <!-- Learning Memory Card - Only show if there's data -->
      {#if (learningInsights.length > 0 || recentConversations.length > 0) && mode === 'conversation'}
        <div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden mt-6">
          <div class="p-4 border-b border-tile-600">
            <h3 class="text-sm font-bold text-text-300 flex items-center gap-2">
              <span>🧠</span> Your Learning Profile
            </h3>
          </div>
          <div class="p-4 space-y-4">
            <!-- User Profile Summary -->
            {#if data.user}
              <div class="text-xs text-text-200 space-y-1">
                {#if data.user.proficiency_level}
                  <p><span class="font-semibold text-text-300">Level:</span> {data.user.proficiency_level}</p>
                {/if}
                {#if data.user.current_streak > 0}
                  <p><span class="font-semibold text-text-300">🔥 Streak:</span> {data.user.current_streak} days</p>
                {/if}
              </div>
            {/if}
            
            <!-- Areas to Improve -->
            {#if learningInsights.filter(i => i.insight_type === 'weakness').length > 0}
              <div>
                <p class="text-xs font-semibold text-amber-400 mb-1.5">Areas to Focus On:</p>
                <ul class="text-xs text-text-200 space-y-1">
                  {#each learningInsights.filter(i => i.insight_type === 'weakness').slice(0, 3) as insight}
                    <li class="flex items-start gap-1.5">
                      <span class="text-amber-400">•</span>
                      <span>{insight.content}</span>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
            
            <!-- Strengths -->
            {#if learningInsights.filter(i => i.insight_type === 'strength').length > 0}
              <div>
                <p class="text-xs font-semibold text-emerald-400 mb-1.5">Your Strengths:</p>
                <ul class="text-xs text-text-200 space-y-1">
                  {#each learningInsights.filter(i => i.insight_type === 'strength').slice(0, 3) as insight}
                    <li class="flex items-start gap-1.5">
                      <span class="text-emerald-400">✓</span>
                      <span>{insight.content}</span>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
            
            <!-- Topics of Interest -->
            {#if learningInsights.filter(i => i.insight_type === 'topic_interest').length > 0}
              <div>
                <p class="text-xs font-semibold text-sky-400 mb-1.5">Topics You Like:</p>
                <div class="flex flex-wrap gap-1">
                  {#each learningInsights.filter(i => i.insight_type === 'topic_interest').slice(0, 5) as insight}
                    <span class="px-2 py-0.5 bg-sky-500/20 text-sky-300 text-xs rounded-full">
                      {insight.content}
                    </span>
                  {/each}
                </div>
              </div>
            {/if}
            
            <!-- Recent Sessions -->
            {#if recentConversations.length > 0}
              <div>
                <p class="text-xs font-semibold text-text-300 mb-1.5">Recent Sessions:</p>
                <div class="space-y-2">
                  {#each recentConversations.slice(0, 3) as conv}
                    <div class="text-xs bg-tile-300/50 rounded-lg p-2 border border-tile-500/50">
                      <p class="text-text-200 line-clamp-2">{conv.summary || 'Conversation with tutor'}</p>
                      {#if conv.topics_discussed && conv.topics_discussed.length > 0}
                        <div class="flex flex-wrap gap-1 mt-1">
                          {#each conv.topics_discussed.slice(0, 3) as topic}
                            <span class="px-1.5 py-0.5 bg-tile-500/50 text-text-300 text-[10px] rounded">
                              {topic}
                            </span>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 p-4 sm:p-6 bg-tile-200 min-h-screen">
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
        <!-- Conversation Mode Content -->
        <div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden h-full">
          <div class="p-4 border-b border-tile-600 sticky top-0 bg-tile-400 z-10">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
                <span>💬</span> Conversation
              </h3>
              {#if conversation.length > 0}
                <span class="px-3 py-1 bg-tile-500 rounded-full text-sm font-medium text-text-300">
                  {conversation.length} message{conversation.length !== 1 ? 's' : ''}
                </span>
              {/if}
            </div>
          </div>
        
        <div
          bind:this={transcriptContainer}
          class="p-4 min-h-[500px] max-h-[calc(100vh-200px)] overflow-y-auto"
        >
          {#if conversation.length === 0 && !isTranscribing && !isGettingResponse}
            <div class="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div class="text-6xl mb-6">👋</div>
              <h3 class="text-xl font-bold text-text-300 mb-3">Start a Conversation</h3>
              <p class="text-text-200 max-w-md leading-relaxed">
                Click one of the recording buttons to begin speaking with your AI tutor. 
                Your conversation will appear here.
              </p>
              <div class="mt-6 grid grid-cols-2 gap-4 max-w-sm">
                <div class="p-4 bg-tile-300 rounded-lg border border-tile-500 text-center">
                  <span class="text-2xl block mb-2">🗣️</span>
                  <span class="text-sm font-medium text-text-300">Speak Arabic</span>
                  <p class="text-xs text-text-200 mt-1">Practice conversation</p>
                </div>
                <div class="p-4 bg-tile-300 rounded-lg border border-tile-500 text-center">
                  <span class="text-2xl block mb-2">❓</span>
                  <span class="text-sm font-medium text-text-300">Ask in English</span>
                  <p class="text-xs text-text-200 mt-1">Get help & translations</p>
                </div>
              </div>
            </div>
          {:else}
            <div class="space-y-4">
              {#each conversation as message (message.id)}
                {#if message.type === 'user'}
                  <!-- User Message -->
                  <div class="bg-sky-500/10 border-2 border-sky-500/30 rounded-xl p-4">
                    <div class="flex items-center justify-between mb-3">
                      <div class="flex items-center gap-2">
                        <span class="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          You
                        </span>
                        <span class="text-sm text-text-200">
                          {message.originalLanguage === 'ar' ? 'Spoke Arabic' : 'Asked in English'}
                        </span>
                      </div>
                      <div class="flex gap-1.5 flex-wrap">
                        <button
                          onclick={() => toggleMessageVisibility(message.id, 'showArabic')}
                          class="text-xs px-2 py-1 rounded-md font-medium transition-colors {message.showArabic !== false ? 'bg-sky-600 text-white' : 'bg-tile-500 text-text-300 hover:bg-tile-600'}"
                        >
                          العربية
                        </button>
                        <button
                          onclick={() => toggleMessageVisibility(message.id, 'showEnglish')}
                          class="text-xs px-2 py-1 rounded-md font-medium transition-colors {message.showEnglish !== false ? 'bg-sky-600 text-white' : 'bg-tile-500 text-text-300 hover:bg-tile-600'}"
                        >
                          English
                        </button>
                        <button
                          onclick={() => toggleMessageVisibility(message.id, 'showTransliteration')}
                          class="text-xs px-2 py-1 rounded-md font-medium transition-colors {message.showTransliteration !== false ? 'bg-sky-600 text-white' : 'bg-tile-500 text-text-300 hover:bg-tile-600'}"
                        >
                          Franco
                        </button>
                        {#if message.feedback && message.feedback.trim() !== ''}
                          <button
                            onclick={() => toggleMessageVisibility(message.id, 'showFeedback')}
                            class="text-xs px-2 py-1 rounded-md font-medium transition-colors {message.showFeedback !== false ? 'bg-amber-600 text-white' : 'bg-tile-500 text-text-300 hover:bg-tile-600'}"
                          >
                            💡 Tips
                          </button>
                        {/if}
                      </div>
                    </div>
                    
                    {#if message.arabic && message.english && message.transliteration}
                      <!-- Stories-style sentence card -->
                      <div class="bg-tile-400 border-2 border-tile-600 rounded-xl p-4 sm:p-6">
                        <!-- English translation at top -->
                        {#if message.showEnglish !== false}
                          <div class="mb-4 pb-3 border-b border-tile-600">
                            <div class="flex flex-wrap gap-1.5 justify-center">
                              {#each (message.english || '').split(' ') as word}
                                <button
                                  onclick={() => handleWordClick(word, 'english', message)}
                                  class="px-2 py-1 text-base sm:text-lg text-text-200 rounded-lg border-2 border-transparent hover:bg-tile-500 hover:border-tile-600 hover:shadow-md transition-all duration-200 cursor-pointer"
                                >
                                  {word}
                                </button>
                              {/each}
                            </div>
                          </div>
                        {/if}

                        <!-- Transliteration -->
                        {#if message.showTransliteration !== false}
                          <p class="text-base sm:text-lg text-text-200 italic text-center mb-4 leading-relaxed">
                            {message.transliteration}
                          </p>
                        {/if}

                        <!-- Arabic words - clickable for definitions -->
                        {#if message.showArabic !== false}
                          <div class="flex flex-wrap gap-2 sm:gap-3 justify-center" dir="rtl">
                            {#each (message.arabic || '').split(' ') as arabicWord}
                              <button
                                onclick={() => handleWordClick(arabicWord, 'arabic', message)}
                                class="px-2 py-1 sm:px-3 sm:py-2 rounded-lg hover:bg-tile-500 hover:shadow-md transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-tile-600 text-xl sm:text-2xl md:text-3xl font-semibold text-text-300"
                              >
                                {arabicWord}
                              </button>
                            {/each}
                          </div>
                        {/if}
                      </div>
                      
                      {#if message.feedback && message.feedback.trim() !== '' && message.showFeedback !== false}
                        <div class="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                          <p class="text-sm font-bold text-amber-300 mb-2 flex items-center gap-2">
                            <span>💡</span> Grammar Feedback
                          </p>
                          <p class="text-text-300 whitespace-pre-wrap leading-relaxed">{message.feedback}</p>
                        </div>
                      {/if}
                    {:else}
                      {@const containsArabic = /[\u0600-\u06FF]/.test(message.arabic || '')}
                      <p class="text-xl text-text-300" dir={containsArabic ? 'rtl' : 'ltr'}>{message.arabic}</p>
                    {/if}
                  </div>
                {:else}
                  <!-- Tutor Message -->
                  <div class="bg-tile-300 border-2 border-tile-500 rounded-xl p-4">
                    <div class="flex items-center justify-between mb-3">
                      <div class="flex items-center gap-2">
                        <span class="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-lg">
                          🎓
                        </span>
                        <span class="text-sm font-semibold text-text-300">Tutor</span>
                      </div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <div class="flex gap-1.5">
                          <button
                            onclick={() => toggleMessageVisibility(message.id, 'showArabic')}
                            class="text-xs px-2 py-1 rounded-md font-medium transition-colors {message.showArabic !== false ? 'bg-emerald-600 text-white' : 'bg-tile-500 text-text-300 hover:bg-tile-600'}"
                          >
                            العربية
                          </button>
                          <button
                            onclick={() => toggleMessageVisibility(message.id, 'showEnglish')}
                            class="text-xs px-2 py-1 rounded-md font-medium transition-colors {message.showEnglish !== false ? 'bg-emerald-600 text-white' : 'bg-tile-500 text-text-300 hover:bg-tile-600'}"
                          >
                            English
                          </button>
                          <button
                            onclick={() => toggleMessageVisibility(message.id, 'showTransliteration')}
                            class="text-xs px-2 py-1 rounded-md font-medium transition-colors {message.showTransliteration !== false ? 'bg-emerald-600 text-white' : 'bg-tile-500 text-text-300 hover:bg-tile-600'}"
                          >
                            Franco
                          </button>
                        </div>
                        {#if message.arabic}
                          <div class="flex gap-1.5">
                            <AudioButton text={message.arabic} dialect={selectedDialect} className="!p-2 !rounded-lg bg-tile-500 hover:bg-tile-600" />
                            <button 
                              onclick={() => compareDialects(message.arabic || '', message.english, message.transliteration)}
                              class="text-xs px-3 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                            >
                              Compare
                            </button>
                          </div>
                        {/if}
                      </div>
                    </div>
                    
                    <!-- Stories-style sentence card for tutor -->
                      <div class="bg-tile-400 border-2 border-tile-600 rounded-xl p-4 sm:p-6">
                        <!-- English translation at top -->
                        {#if message.showEnglish !== false}
                          <div class="mb-4 pb-3 border-b border-tile-600">
                            <div class="flex flex-wrap gap-1.5 justify-center">
                              {#each (message.english || '').split(' ') as word}
                                <button
                                  onclick={() => handleWordClick(word, 'english', message)}
                                  class="px-2 py-1 text-base sm:text-lg text-text-200 rounded-lg border-2 border-transparent hover:bg-tile-500 hover:border-tile-600 hover:shadow-md transition-all duration-200 cursor-pointer"
                                >
                                  {word}
                                </button>
                              {/each}
                            </div>
                          </div>
                        {/if}

                        <!-- Transliteration -->
                        {#if message.showTransliteration !== false}
                          <p class="text-base sm:text-lg text-text-200 italic text-center mb-4 leading-relaxed">
                            {message.transliteration}
                          </p>
                        {/if}

                        <!-- Arabic words - clickable for definitions -->
                        {#if message.showArabic !== false}
                          <div class="flex flex-wrap gap-2 sm:gap-3 justify-center" dir="rtl">
                            {#each (message.arabic || '').split(' ') as arabicWord}
                              <button
                                onclick={() => handleWordClick(arabicWord, 'arabic', message)}
                                class="px-2 py-1 sm:px-3 sm:py-2 rounded-lg hover:bg-tile-500 hover:shadow-md transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-tile-600 text-xl sm:text-2xl md:text-3xl font-semibold text-text-300"
                              >
                                {arabicWord}
                              </button>
                            {/each}
                          </div>
                        {/if}
                      </div>
                    </div>
                {/if}
              {/each}
              
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
            </div>
          {/if}
        </div>
      </div>
      {/if}
    </div>
  </div>
</section>
