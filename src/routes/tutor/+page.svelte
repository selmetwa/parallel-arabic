<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDialect } from '$lib/store/store';
  import RadioButton from '$lib/components/RadioButton.svelte';
  import RecordButton from '$lib/components/RecordButton.svelte';
  import AudioLoading from '$lib/components/AudioLoading.svelte';
  import Sentence from '$lib/components/dialect-shared/story/components/Sentence.svelte';
  import AudioButton from '$lib/components/AudioButton.svelte';
  import PaywallModal from '$lib/components/PaywallModal.svelte';
  import DialectComparisonModal from '$lib/components/dialect-shared/sentences/DialectComparisonModal.svelte';
  import Button from '$lib/components/Button.svelte';
  import { type Dialect } from '$lib/types/index';
  import type { DialectComparisonSchema } from '$lib/utils/gemini-schemas';

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
    
    // Set full width layout like video route
    const root = document.documentElement;
    const originalWidth = getComputedStyle(root).getPropertyValue('--layout-width');
    root.style.setProperty('--layout-width', '2400px');
    
    // Restore original width on unmount
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
    feedback?: string; // Grammar feedback for user messages
    originalLanguage?: 'ar' | 'en'; // Store the original language for user messages
    timestamp: Date;
    showArabic?: boolean;
    showEnglish?: boolean;
    showTransliteration?: boolean;
    showFeedback?: boolean;
  };

  const dialectOptions = [
    { value: 'egyptian-arabic', label: 'Egyptian Arabic' },
    { value: 'fusha', label: 'Modern Standard Arabic (Fusha)' },
    { value: 'levantine', label: 'Levantine Arabic' },
  ];

  let selectedDialect = $state<Dialect>('egyptian-arabic');
  let recording = $state(false);
  let recordingLanguage = $state<'ar' | 'en'>('ar'); // Track which language mode is active
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
          transliteration
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

  function setDialect(e: Event) {
    const target = e.target as HTMLInputElement;
    selectedDialect = target.value as Dialect;
    // Clear conversation when dialect changes
    conversation = [];
  }

  async function startRecording(language: 'ar' | 'en') {
    // Check subscription before allowing recording
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
        // Stop all tracks to release microphone
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
      formData.append('language', recordingLanguage); // Pass the language parameter

      // Transcribe audio
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

      // Translate and transliterate the user message
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

      // Add user message to conversation with all three versions
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
      
      // Scroll again after a short delay to ensure loading state is visible
      setTimeout(() => scrollToBottom(), 100);

      // Get conversation history for context
      // Use the original transcribed message for user messages, Arabic for tutor messages
      const conversationHistory = conversation
        .filter(msg => msg.type === 'user' || msg.type === 'tutor')
        .map(msg => {
          if (msg.type === 'user') {
            // For user messages, use the appropriate field based on the original language
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
        .slice(-10); // Last 10 messages

      // Get tutor response - use the original transcribed message
      const tutorResponse = await fetch('/api/tutor-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage, // Use original transcribed text
          dialect: selectedDialect,
          conversation: conversationHistory
        })
      });

      if (!tutorResponse.ok) {
        throw new Error('Failed to get tutor response');
      }

      const tutorData = await tutorResponse.json();

      // Add tutor response to conversation
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
      
      // Scroll again after a short delay to ensure tutor message is visible
      setTimeout(() => scrollToBottom(), 100);

      // Auto-play tutor audio response
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
    // Check subscription before allowing recording
    if (!hasActiveSubscription && !recording) {
      openPaywallModal();
      return;
    }

    if (recording) {
      // If already recording, stop it
      stopRecording();
    } else {
      // Start recording with the specified language
      startRecording(language);
    }
  }

  function clearConversation() {
    conversation = [];
  }

  // Function to play tutor audio programmatically
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
      
      // Clean up URL after playback
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

<section class="w-full">
  <div class="px-3 mt-6 sm:px-8 mb-6">
    <div class="text-left mb-6">
      <h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-1 tracking-tight">
        Arabic Tutor
      </h1>
      <p class="text-text-200 text-lg sm:text-xl leading-snug">
        Practice speaking Arabic with an AI tutor. Choose your dialect and have a conversation! Use the "Speak Arabic" button for Arabic conversation, or "Ask in English" to ask questions like "how do I say X?".
      </p>
      {#if !hasActiveSubscription}
        <div class="mt-4 p-4 bg-tile-400 border border-tile-600 rounded-lg">
          <p class="text-text-200 text-base">
            <strong>Subscriber Only Feature:</strong> This feature requires an active subscription. 
            <button onclick={openPaywallModal} class="underline text-text-300 hover:text-text-200 transition-colors">
              Subscribe to unlock
            </button>
          </p>
        </div>
      {/if}
    </div>

    <!-- Dialect Selection -->
    <div class="mb-6">
      <h2 class="text-lg font-bold text-text-300 mb-3">Select Arabic Dialect</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {#each dialectOptions as dialectOption}
          <RadioButton
            className="!text-base !font-medium"
            wrapperClass="!p-3 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300"
            onClick={setDialect}
            selectableFor={dialectOption.value}
            isSelected={selectedDialect === dialectOption.value}
            value={dialectOption.value}
            text={dialectOption.label}
          />
        {/each}
      </div>
    </div>
  </div>

  <!-- Recording Controls - Sticky -->
  <div class="sticky top-0 z-50 bg-tile-200 border-b border-tile-600 shadow-lg mb-6">
    <div class="px-3 sm:px-8 py-4">
      <div class="flex items-center gap-4 mb-4">
      <!-- Arabic Recording Button -->
      <div class="flex flex-col items-center gap-2">
        <button
          onclick={() => toggleRecording('ar')}
          disabled={isProcessing || (!hasActiveSubscription && !recording)}
          class="flex items-center justify-center w-16 h-16 rounded-full bg-tile-400 border-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed {recording && recordingLanguage === 'ar' ? 'border-blue-500 bg-blue-500/20' : 'border-tile-600 hover:bg-tile-500 hover:border-tile-500'}"
          aria-label={recording && recordingLanguage === 'ar' ? 'Stop recording Arabic' : 'Start recording Arabic'}
        >
          {#if recording && recordingLanguage === 'ar'}
            <AudioLoading />
          {:else}
            <RecordButton />
          {/if}
        </button>
        <span class="text-sm text-text-200 font-medium">Speak Arabic</span>
      </div>

      <!-- English Recording Button -->
      <div class="flex flex-col items-center gap-2">
        <button
          onclick={() => toggleRecording('en')}
          disabled={isProcessing || (!hasActiveSubscription && !recording)}
          class="flex items-center justify-center w-16 h-16 rounded-full bg-tile-400 border-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed {recording && recordingLanguage === 'en' ? 'border-blue-500 bg-blue-500/20' : 'border-tile-600 hover:bg-tile-500 hover:border-tile-500'}"
          aria-label={recording && recordingLanguage === 'en' ? 'Stop recording English' : 'Start recording English'}
        >
          {#if recording && recordingLanguage === 'en'}
            <AudioLoading />
          {:else}
            <RecordButton />
          {/if}
        </button>
        <span class="text-sm text-text-200 font-medium">Ask in English</span>
      </div>

      <div class="flex-1"></div>

      {#if conversation.length > 0}
        <button
          onclick={clearConversation}
          class="px-4 py-2 bg-tile-400 border border-tile-600 text-text-300 hover:bg-tile-500 transition-colors text-sm"
        >
          Clear Conversation
        </button>
      {/if}
      </div>
      
      <div class="mt-2">
        {#if recording}
          <p class="text-text-300 font-medium">
            Recording {recordingLanguage === 'ar' ? 'Arabic' : 'English'}... Click the same button again to stop
          </p>
        {:else if !hasActiveSubscription}
          <p class="text-text-200">
            <strong>Subscriber Only:</strong> This feature requires an active subscription. 
            <button onclick={openPaywallModal} class="underline text-text-300 hover:text-text-200 transition-colors">
              Subscribe to unlock
            </button>
          </p>
        {:else}
          <p class="text-text-200">Choose a button above to start speaking. Use "Speak Arabic" for Arabic conversation, or "Ask in English" to ask questions in English.</p>
        {/if}
      </div>
    </div>
  </div>

  <!-- Conversation Transcript -->
  <div class="w-full px-3 sm:px-8">
    <div
      bind:this={transcriptContainer}
      class="bg-tile-300 border border-tile-500 rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto"
    >
    {#if conversation.length === 0 && !isTranscribing && !isGettingResponse}
      <div class="flex items-center justify-center h-full min-h-[400px]">
        <p class="text-text-200 text-center">
          Start a conversation by clicking one of the recording buttons above.<br/>
          <span class="text-sm mt-2 block">Use "Speak Arabic" for Arabic conversation, or "Ask in English" to ask questions like "how do I say hello?"</span>
        </p>
      </div>
    {:else}
      <div class="space-y-4">
        {#each conversation as message (message.id)}
          {#if message.type === 'user'}
            <!-- User Message -->
            <div class="flex flex-col gap-2 border-b border-tile-600 pb-4 bg-tile-400 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm text-text-200 font-medium">You</p>
                <div class="flex gap-2 flex-wrap">
                  <button
                    onclick={() => toggleMessageVisibility(message.id, 'showArabic')}
                    class="text-xs px-2 py-1 rounded border border-tile-600 bg-tile-300 hover:bg-tile-500 text-text-300 transition-colors {message.showArabic !== false ? 'bg-tile-600 text-text-200' : ''}"
                  >
                    Arabic
                  </button>
                  <button
                    onclick={() => toggleMessageVisibility(message.id, 'showEnglish')}
                    class="text-xs px-2 py-1 rounded border border-tile-600 bg-tile-300 hover:bg-tile-500 text-text-300 transition-colors {message.showEnglish !== false ? 'bg-tile-600 text-text-200' : ''}"
                  >
                    English
                  </button>
                  <button
                    onclick={() => toggleMessageVisibility(message.id, 'showTransliteration')}
                    class="text-xs px-2 py-1 rounded border border-tile-600 bg-tile-300 hover:bg-tile-500 text-text-300 transition-colors {message.showTransliteration !== false ? 'bg-tile-600 text-text-200' : ''}"
                  >
                    Transliteration
                  </button>
                  {#if message.feedback && message.feedback.trim() !== ''}
                    <button
                      onclick={() => toggleMessageVisibility(message.id, 'showFeedback')}
                      class="text-xs px-2 py-1 rounded border border-tile-600 bg-tile-300 hover:bg-tile-500 text-text-300 transition-colors {message.showFeedback !== false ? 'bg-tile-600 text-text-200' : ''}"
                    >
                      💡 Feedback
                    </button>
                  {/if}
                </div>
              </div>
              {#if message.arabic && message.english && message.transliteration}
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
                    classname="!border-0 !py-2 !px-0"
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
                    classname="!border-0 !py-2 !px-0"
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
                    classname="!border-0 !py-2 !px-0"
                  />
                {/if}
                {#if message.feedback && message.feedback.trim() !== '' && message.showFeedback !== false}
                  <div class="mt-3 p-4 bg-tile-500 border border-tile-600 rounded-lg">
                    <p class="text-sm font-semibold text-text-200 mb-2">💡 Grammar Feedback:</p>
                    {#if message.arabic && message.transliteration}
                      <div class="mb-3 space-y-1">
                        <p class="text-lg text-text-300" dir="rtl">{message.arabic}</p>
                        <p class="text-base text-text-200 italic">{message.transliteration}</p>
                      </div>
                    {/if}
                    <p class="text-base text-text-300 whitespace-pre-wrap leading-relaxed">{message.feedback}</p>
                  </div>
                {/if}
              {:else}
                {@const containsArabic = /[\u0600-\u06FF]/.test(message.arabic || '')}
                <p class="text-2xl text-text-300" dir={containsArabic ? 'rtl' : 'ltr'}>{message.arabic}</p>
                {#if message.feedback && message.feedback.trim() !== '' && message.showFeedback !== false}
                  <div class="mt-3 p-4 bg-tile-500 border border-tile-600 rounded-lg">
                    <p class="text-sm font-semibold text-text-200 mb-2">💡 Grammar Feedback:</p>
                    {#if message.arabic && message.transliteration}
                      <div class="mb-3 space-y-1">
                        <p class="text-lg text-text-300" dir="rtl">{message.arabic}</p>
                        <p class="text-base text-text-200 italic">{message.transliteration}</p>
                      </div>
                    {/if}
                    <p class="text-base text-text-300 whitespace-pre-wrap leading-relaxed">{message.feedback}</p>
                  </div>
                {/if}
              {/if}
            </div>
          {:else}
            <!-- Tutor Message -->
            <div class="flex flex-col gap-2 border-b border-tile-600 pb-4 bg-tile-300 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm text-text-200 font-medium">Tutor</p>
                <div class="flex items-center gap-2">
                  <div class="flex gap-2">
                    <button
                      onclick={() => toggleMessageVisibility(message.id, 'showArabic')}
                      class="text-xs px-2 py-1 rounded border border-tile-600 bg-tile-400 hover:bg-tile-500 text-text-300 transition-colors {message.showArabic !== false ? 'bg-tile-600 text-text-200' : ''}"
                    >
                      Arabic
                    </button>
                    <button
                      onclick={() => toggleMessageVisibility(message.id, 'showEnglish')}
                      class="text-xs px-2 py-1 rounded border border-tile-600 bg-tile-400 hover:bg-tile-500 text-text-300 transition-colors {message.showEnglish !== false ? 'bg-tile-600 text-text-200' : ''}"
                    >
                      English
                    </button>
                    <button
                      onclick={() => toggleMessageVisibility(message.id, 'showTransliteration')}
                      class="text-xs px-2 py-1 rounded border border-tile-600 bg-tile-400 hover:bg-tile-500 text-text-300 transition-colors {message.showTransliteration !== false ? 'bg-tile-600 text-text-200' : ''}"
                    >
                      Transliteration
                    </button>
                  </div>
                  <div class="flex gap-2">
                    {#if message.arabic}
                      <AudioButton text={message.arabic} dialect={selectedDialect}>
                        🔊 Play Audio
                      </AudioButton>
                      <Button onClick={() => compareDialects(message.arabic || '', message.english, message.transliteration)} type="button">
                        Compare Dialects
                      </Button>
                    {/if}
                  </div>
                </div>
              </div>
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
                  classname="!border-0 !py-2 !px-0"
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
                  classname="!border-0 !py-2 !px-0"
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
                  classname="!border-0 !py-2 !px-0"
                />
              {/if}
            </div>
          {/if}
        {/each}
        
        <!-- Loading States within Chat -->
        {#if isTranscribing}
          <div class="flex flex-col gap-2 border-b border-tile-600 pb-4 bg-tile-400 rounded-lg p-6 animate-pulse">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div class="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              <div class="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
              <p class="text-lg font-semibold text-text-300 ml-2">
                Transcribing your {recordingLanguage === 'ar' ? 'Arabic' : 'English'} message...
              </p>
            </div>
            <p class="text-text-200 text-sm ml-11">Processing your audio and generating translations, feedback, and suggestions</p>
          </div>
        {/if}
        
        {#if isGettingResponse}
          <div class="flex flex-col gap-2 border-b border-tile-600 pb-4 bg-tile-300 rounded-lg p-6 animate-pulse">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
              <div class="w-3 h-3 bg-green-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              <div class="w-3 h-3 bg-green-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
              <p class="text-lg font-semibold text-text-300 ml-2">
                Tutor is thinking...
              </p>
            </div>
            <p class="text-text-200 text-sm ml-11">Getting your personalized response</p>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</section>

