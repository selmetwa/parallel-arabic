<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDialect } from '$lib/store/store';
  import RecordButton from '$lib/components/RecordButton.svelte';
  import AudioLoading from '$lib/components/AudioLoading.svelte';
  import Sentence from '$lib/components/dialect-shared/story/components/Sentence.svelte';
  import AudioButton from '$lib/components/AudioButton.svelte';
  import PaywallModal from '$lib/components/PaywallModal.svelte';
  import DialectComparisonModal from '$lib/components/dialect-shared/sentences/DialectComparisonModal.svelte';
  import { type Dialect } from '$lib/types/index';
  import type { DialectComparisonSchema } from '$lib/utils/gemini-schemas';
  import { getDefaultDialect } from '$lib/helpers/get-default-dialect';

  let { data } = $props();

  let isModalOpen = $state(false);
  let hasActiveSubscription = $derived(data.hasActiveSubscription);

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

  let selectedDialect = $state<Dialect>(getDefaultDialect(data.user) as Dialect);
  let recording = $state(false);
  let recordingLanguage = $state<'ar' | 'en'>('ar');
  let mediaRecorder: MediaRecorder | null = $state(null);
  let audioChunks: Blob[] = $state([]);
  let conversation: ConversationMessage[] = $state([]);
  let isProcessing = $state(false);
  let isTranscribing = $state(false);
  let isGettingResponse = $state(false);
  let transcriptContainer: HTMLDivElement | null = $state(null);

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

  function setDialect(dialect: string) {
    selectedDialect = dialect as Dialect;
    conversation = [];
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
          conversation: conversationHistory
        })
      });

      if (!tutorResponse.ok) {
        throw new Error('Failed to get tutor response');
      }

      const tutorData = await tutorResponse.json();

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

  function clearConversation() {
    conversation = [];
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
            Practice speaking Arabic with an AI tutor. Have real conversations in your chosen dialect with instant feedback and translations.
          </p>
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

      <!-- Recording Controls Card -->
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

      <!-- Actions Card -->
      {#if conversation.length > 0}
        <div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
          <div class="p-4">
            <button
              onclick={clearConversation}
              class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Conversation
            </button>
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
          <p>• Use <strong class="text-text-300">"Speak Arabic"</strong> for conversation practice</p>
          <p>• Use <strong class="text-text-300">"Ask in English"</strong> to ask "How do I say...?"</p>
          <p>• Click any word in responses for definitions</p>
          <p>• Toggle visibility buttons to hide/show translations</p>
        </div>
      </div>
    </div>

    <!-- Main Chat Area -->
    <div class="flex-1 p-4 sm:p-6 bg-tile-200 min-h-screen">
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
                      <div class="space-y-2">
                        {#if message.showArabic !== false}
                          <Sentence
                            sentence={{
                              arabic: { text: message.arabic || '' },
                              english: { text: message.english || '' },
                              transliteration: { text: message.transliteration || '' }
                            }}
                            setActiveWord={() => {}}
                            type="arabic"
                            index={0}
                            mode="SentenceView"
                            dialect={selectedDialect}
                            intersecting={true}
                            classname="!border-0 !py-1 !px-0"
                          />
                        {/if}
                        {#if message.showEnglish !== false}
                          <Sentence
                            sentence={{
                              arabic: { text: message.arabic || '' },
                              english: { text: message.english || '' },
                              transliteration: { text: message.transliteration || '' }
                            }}
                            setActiveWord={() => {}}
                            type="english"
                            index={0}
                            mode="SentenceView"
                            dialect={selectedDialect}
                            intersecting={true}
                            classname="!border-0 !py-1 !px-0"
                          />
                        {/if}
                        {#if message.showTransliteration !== false}
                          <Sentence
                            sentence={{
                              arabic: { text: message.arabic || '' },
                              english: { text: message.english || '' },
                              transliteration: { text: message.transliteration || '' }
                            }}
                            setActiveWord={() => {}}
                            type="transliteration"
                            index={0}
                            mode="SentenceView"
                            dialect={selectedDialect}
                            intersecting={true}
                            classname="!border-0 !py-1 !px-0"
                          />
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
                    
                    <div class="space-y-2">
                      {#if message.showArabic !== false}
                        <Sentence
                          sentence={{
                            arabic: { text: message.arabic || '' },
                            english: { text: message.english || '' },
                            transliteration: { text: message.transliteration || '' }
                          }}
                          setActiveWord={() => {}}
                          type="arabic"
                          index={0}
                          mode="SentenceView"
                          dialect={selectedDialect}
                          intersecting={true}
                          classname="!border-0 !py-1 !px-0"
                        />
                      {/if}
                      {#if message.showEnglish !== false}
                        <Sentence
                          sentence={{
                            arabic: { text: message.arabic || '' },
                            english: { text: message.english || '' },
                            transliteration: { text: message.transliteration || '' }
                          }}
                          setActiveWord={() => {}}
                          type="english"
                          index={0}
                          mode="SentenceView"
                          dialect={selectedDialect}
                          intersecting={true}
                          classname="!border-0 !py-1 !px-0"
                        />
                      {/if}
                      {#if message.showTransliteration !== false}
                        <Sentence
                          sentence={{
                            arabic: { text: message.arabic || '' },
                            english: { text: message.english || '' },
                            transliteration: { text: message.transliteration || '' }
                          }}
                          setActiveWord={() => {}}
                          type="transliteration"
                          index={0}
                          mode="SentenceView"
                          dialect={selectedDialect}
                          intersecting={true}
                          classname="!border-0 !py-1 !px-0"
                        />
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
    </div>
  </div>
</section>
