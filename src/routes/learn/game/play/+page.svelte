<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Howl } from 'howler';
  import AudioButton from '$lib/components/AudioButton.svelte';
  import SaveButton from '$lib/components/SaveButton.svelte';
  import PaywallModal from '$lib/components/PaywallModal.svelte';
  import type { Dialect } from '$lib/types/index';

  // Free tier limit (5 turns for non-subscribers)
  const FREE_TURN_LIMIT = 5;

  interface Word {
    id?: string;
    arabic_word: string;
    english_word: string;
    transliterated_word: string;
    dialect: string;
    category?: string;
    audio_url?: string | null;
  }

  interface Sentence {
    arabic: string;
    english: string;
    transliteration: string;
    blankWord: string;
    blankWordEnglish: string;
    blankWordTransliteration: string;
    wrongOptions: string[];
  }

  interface GameQuestion {
    word?: Word;
    sentence?: Sentence;
    options: string[];
    correctAnswer: string;
    type: 'arabic-to-english' | 'english-to-arabic' | 'listening' | 'fill-in-blank';
    // For sentence mode, the sentence with blank shown
    displayText?: string;
  }

  let { data } = $props();

  // Game state
  let isLoading = $state(true);
  let loadingMessage = $state('Preparing your game...');
  let questions = $state<GameQuestion[]>([]);
  let currentIndex = $state(0);
  let score = $state(0);
  let selectedAnswer = $state<string | null>(null);
  let showResult = $state(false);
  let isCorrect = $state(false);
  let showHint = $state(false);
  let gameComplete = $state(false);
  let wordsToReview = $state<Word[]>([]);
  let sentencesToReview = $state<Sentence[]>([]);

  // Game progress persistence
  let gameProgressId = $state<string | null>(null);
  let isResuming = $state(false);
  let questionOrder = $state<string[]>([]);

  // Paywall state
  let showPaywallModal = $state(false);
  let turnsPlayed = $state(0);

  // Check if current game is sentence-based
  let isSentenceMode = $derived(data.gameParams.contentType === 'sentences');

  // Speaking mode state
  let isRecording = $state(false);
  let spokenText = $state('');
  let pronunciationScore = $state<number | null>(null);
  let speechRecognition: any = null;
  let speakingAttempts = $state(0);
  let showSpeakingFeedback = $state(false);

  // Audio playback state
  let isPlayingAudio = $state(false);
  let currentSound: Howl | null = null;

  let currentQuestion = $derived(questions[currentIndex]);
  let progress = $derived(questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0);

  onMount(async () => {
    await initializeGame();
  });

  async function initializeGame() {
    isLoading = true;

    // Check if we're resuming a game (from server-side data or sessionStorage)
    const serverResumeData = data.resumeData;
    let resumeGameData = serverResumeData;

    // Also check sessionStorage as fallback (for continue from /learn/game page)
    if (!resumeGameData && typeof window !== 'undefined') {
      const storedData = sessionStorage.getItem('resumeGame');
      if (storedData) {
        try {
          resumeGameData = JSON.parse(storedData);
          sessionStorage.removeItem('resumeGame');
        } catch (e) {
          console.error('Error parsing resume data:', e);
          sessionStorage.removeItem('resumeGame');
        }
      }
    }

    if (resumeGameData) {
      try {
        isResuming = true;
        gameProgressId = resumeGameData.id;
        questionOrder = resumeGameData.questionOrder || [];

        // Set up questions from the saved order
        loadingMessage = 'Resuming your game...';
        setupQuestionsFromData(questionOrder);

        // Restore state
        currentIndex = resumeGameData.currentIndex || 0;
        score = resumeGameData.score || 0;
        wordsToReview = resumeGameData.wordsToReview || [];
        turnsPlayed = resumeGameData.currentIndex || 0;

        isLoading = false;

        // Setup speech recognition for speaking mode
        if (data.gameParams.mode === 'speaking') {
          setupSpeechRecognition();
        }
        return;
      } catch (e) {
        console.error('Error resuming game:', e);
      }
    }

    if (data.gameParams.useCustom) {
      if (data.gameParams.contentType === 'sentences') {
        loadingMessage = 'Generating custom sentences...';
        await generateCustomSentences();
      } else {
        loadingMessage = 'Generating custom words...';
        await generateCustomWords();
      }
    } else {
      loadingMessage = 'Setting up questions...';
      setupQuestionsFromData();

      // Save initial game progress for category-based games (not custom generated)
      if (data.user && !data.gameParams.useCustom && questions.length > 0) {
        await saveInitialProgress();
      }
    }

    // Setup speech recognition for speaking mode
    if (data.gameParams.mode === 'speaking' && typeof window !== 'undefined') {
      setupSpeechRecognition();
    }

    isLoading = false;
  }

  async function saveInitialProgress() {
    try {
      const response = await fetch('/api/game-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialect: data.gameParams.dialect,
          category: data.gameParams.category,
          gameMode: data.gameParams.mode,
          currentIndex: 0,
          totalQuestions: questions.length,
          score: 0,
          wordsToReview: [],
          questionOrder: questionOrder,
          status: 'in_progress'
        })
      });

      if (response.ok) {
        const result = await response.json();
        gameProgressId = result.game?.id || null;
      }
    } catch (error) {
      console.error('Error saving initial game progress:', error);
    }
  }

  async function saveProgress(completed = false) {
    if (!data.user || !gameProgressId) return;

    try {
      await fetch('/api/game-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: gameProgressId,
          dialect: data.gameParams.dialect,
          category: data.gameParams.category,
          gameMode: data.gameParams.mode,
          currentIndex: currentIndex,
          totalQuestions: questions.length,
          score: score,
          wordsToReview: wordsToReview,
          status: completed ? 'completed' : 'in_progress'
        })
      });
    } catch (error) {
      console.error('Error saving game progress:', error);
    }
  }

  async function generateCustomWords() {
    try {
      const res = await fetch('/api/generate-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialect: data.gameParams.dialect,
          difficulty: data.gameParams.difficulty,
          customRequest: data.gameParams.customTopic,
          wordTypes: []
        })
      });

      if (!res.ok) {
        throw new Error('Failed to generate words');
      }

      const result = await res.json();
      const content = JSON.parse(result.message.message.content);
      const generatedWords: Word[] = content.words.map((w: any, i: number) => ({
        id: `generated-${i}`,
        arabic_word: w.arabic,
        english_word: w.english,
        transliterated_word: w.transliteration,
        dialect: data.gameParams.dialect
      }));

      // Limit to requested count
      const wordsToUse = generatedWords.slice(0, data.gameParams.count);
      const otherWords = generatedWords.slice(data.gameParams.count);

      createQuestions(wordsToUse, otherWords);
    } catch (error) {
      console.error('Error generating words:', error);
      loadingMessage = 'Failed to generate words. Please try again.';
    }
  }

  async function generateCustomSentences() {
    try {
      // Get review words from sessionStorage if using them
      let reviewWords: Array<{ arabic: string; english: string; transliteration: string }> = [];
      if (data.gameParams.useReviewWords && typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('gameReviewWords');
        if (stored) {
          reviewWords = JSON.parse(stored);
          // Clean up after reading
          sessionStorage.removeItem('gameReviewWords');
        }
      }

      const res = await fetch('/api/generate-game-sentences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialect: data.gameParams.dialect,
          difficulty: data.gameParams.difficulty,
          customRequest: data.gameParams.customTopic,
          count: data.gameParams.count,
          learningTopics: data.gameParams.learningTopics || [],
          reviewWords: reviewWords
        })
      });

      if (!res.ok) {
        throw new Error('Failed to generate sentences');
      }

      const result = await res.json();
      const generatedSentences: Sentence[] = result.sentences;

      createSentenceQuestions(generatedSentences);
    } catch (error) {
      console.error('Error generating sentences:', error);
      loadingMessage = 'Failed to generate sentences. Please try again.';
    }
  }

  function createSentenceQuestions(sentences: Sentence[]) {
    const mode = data.gameParams.mode;

    questions = sentences.map(sentence => {
      // Create the display text with blank
      const displayText = sentence.arabic.replace(sentence.blankWord, '______');

      // Shuffle options (correct + 3 wrong)
      const options = [...sentence.wrongOptions, sentence.blankWord].sort(() => Math.random() - 0.5);

      if (mode === 'listening') {
        // For listening mode with sentences: listen to full sentence, identify the missing word
        return {
          sentence,
          options,
          correctAnswer: sentence.blankWord,
          type: 'listening' as const,
          displayText
        };
      } else if (mode === 'speaking') {
        // For speaking mode: pronounce the full sentence
        return {
          sentence,
          options: [],
          correctAnswer: sentence.arabic,
          type: 'fill-in-blank' as const,
          displayText
        };
      } else {
        // Multiple choice: fill in the blank
        return {
          sentence,
          options,
          correctAnswer: sentence.blankWord,
          type: 'fill-in-blank' as const,
          displayText
        };
      }
    });
  }

  function setupQuestionsFromData(savedOrder?: string[]) {
    if (data.words.length === 0) {
      loadingMessage = 'No words available for this category.';
      return;
    }

    // If we have a saved order, reorder words accordingly
    let orderedWords = data.words as Word[];
    if (savedOrder && savedOrder.length > 0) {
      const wordMap = new Map((data.words as Word[]).map(w => [w.id || w.arabic_word, w]));
      const reorderedWords = savedOrder
        .map(id => wordMap.get(id))
        .filter((w): w is Word => w !== undefined);

      // If order doesn't match (some words missing), fall back to original
      if (reorderedWords.length !== data.words.length) {
        orderedWords = data.words as Word[];
      } else {
        orderedWords = reorderedWords;
      }
    }

    createQuestions(orderedWords, data.otherWords || []);
  }

  function createQuestions(gameWords: Word[], extraWords: Word[]) {
    const allWords = [...gameWords, ...extraWords];

    // Save the question order for persistence (use id or arabic_word as identifier)
    if (!isResuming) {
      questionOrder = gameWords.map(w => w.id || w.arabic_word);
    }

    questions = gameWords.map(word => {
      const mode = data.gameParams.mode;

      // For multiple-choice and listening, we need wrong answers
      if (mode === 'multiple-choice' || mode === 'listening') {
        // Randomly decide question type for multiple-choice
        const type: GameQuestion['type'] = mode === 'listening'
          ? 'listening'
          : Math.random() > 0.5 ? 'arabic-to-english' : 'english-to-arabic';

        // Get the correct answer
        const correctAnswer = type === 'arabic-to-english' || type === 'listening'
          ? word.english_word
          : word.arabic_word;

        // Get wrong options (3 random other words)
        const wrongWords = allWords
          .filter(w => w.arabic_word !== word.arabic_word)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);

        const wrongAnswers = wrongWords.map(w =>
          type === 'arabic-to-english' || type === 'listening' ? w.english_word : w.arabic_word
        );

        // Combine and shuffle options
        const options = [...wrongAnswers, correctAnswer].sort(() => Math.random() - 0.5);

        return { word, options, correctAnswer, type };
      }

      // Speaking mode
      return {
        word,
        options: [],
        correctAnswer: word.arabic_word,
        type: 'arabic-to-english' as const
      };
    });
  }

  function setupSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    speechRecognition = new SpeechRecognition();
    speechRecognition.lang = 'ar';
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;

    speechRecognition.onresult = (event: any) => {
      const result = event.results[0][0];
      spokenText = result.transcript;
      const confidence = result.confidence;

      // Calculate pronunciation score based on similarity and confidence
      // For sentences, compare against full sentence; for words, compare against the word
      const targetText = currentQuestion.sentence
        ? currentQuestion.sentence.arabic
        : currentQuestion.word?.arabic_word || '';
      const similarity = calculateSimilarity(spokenText, targetText);
      pronunciationScore = Math.round(similarity * confidence * 100);

      isRecording = false;
      speakingAttempts++;
      showSpeakingFeedback = true;

      // Consider it correct if score >= 60 (or 50 for sentences since they're longer)
      const threshold = currentQuestion.sentence ? 50 : 60;
      if (pronunciationScore >= threshold) {
        handleCorrectAnswer();
      }
      // If incorrect, show feedback but allow retry (don't call handleWrongAnswer yet)
    };

    speechRecognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      isRecording = false;
      spokenText = 'Could not recognize speech. Please try again.';
    };

    speechRecognition.onend = () => {
      isRecording = false;
    };
  }

  function calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity calculation (Levenshtein-based ratio)
    const s1 = str1.trim();
    const s2 = str2.trim();

    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const track = Array(s2.length + 1).fill(null).map(() =>
      Array(s1.length + 1).fill(null)
    );

    for (let i = 0; i <= s1.length; i++) track[0][i] = i;
    for (let j = 0; j <= s2.length; j++) track[j][0] = j;

    for (let j = 1; j <= s2.length; j++) {
      for (let i = 1; i <= s1.length; i++) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        );
      }
    }

    const distance = track[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - distance / maxLength;
  }

  async function playAudio(text: string, dialect: string, audioUrl?: string | null) {
    if (isPlayingAudio) return;

    isPlayingAudio = true;

    // Stop any currently playing sound
    if (currentSound) {
      currentSound.stop();
    }

    try {
      let finalAudioUrl: string;
      let playbackRate = 1.0;

      if (audioUrl) {
        finalAudioUrl = audioUrl;
      } else {
        // Use TTS API
        const res = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, dialect })
        });

        if (!res.ok) {
          throw new Error(`TTS request failed: ${res.statusText}`);
        }

        playbackRate = parseFloat(res.headers.get('X-Playback-Rate') || '1.0');
        const audioBlob = await res.blob();
        finalAudioUrl = URL.createObjectURL(audioBlob);
      }

      currentSound = new Howl({
        src: [finalAudioUrl],
        autoplay: true,
        rate: playbackRate * 0.9,
        format: ['mp3', 'wav'],
        onend: () => {
          isPlayingAudio = false;
        },
        onloaderror: () => {
          console.error('Audio load error');
          isPlayingAudio = false;
        },
        onplayerror: () => {
          console.error('Audio play error');
          isPlayingAudio = false;
        }
      });

      currentSound.play();
    } catch (error) {
      console.error('Audio playback failed:', error);
      isPlayingAudio = false;
    }
  }

  function selectAnswer(answer: string) {
    if (showResult) return;

    selectedAnswer = answer;
    showResult = true;
    isCorrect = answer === currentQuestion.correctAnswer;

    if (isCorrect) {
      score++;
    } else {
      // Add to review list if wrong
      if (currentQuestion.sentence) {
        sentencesToReview = [...sentencesToReview, currentQuestion.sentence];
      } else if (currentQuestion.word) {
        wordsToReview = [...wordsToReview, currentQuestion.word];
      }
    }
  }

  function handleCorrectAnswer() {
    showResult = true;
    isCorrect = true;
    score++;
  }

  function handleWrongAnswer() {
    showResult = true;
    isCorrect = false;
    if (currentQuestion.sentence) {
      sentencesToReview = [...sentencesToReview, currentQuestion.sentence];
    } else if (currentQuestion.word) {
      wordsToReview = [...wordsToReview, currentQuestion.word];
    }
  }

  function startRecording() {
    if (!speechRecognition) {
      spokenText = 'Speech recognition is not available in your browser.';
      return;
    }

    spokenText = '';
    pronunciationScore = null;
    isRecording = true;
    speechRecognition.start();
  }

  function stopRecording() {
    if (speechRecognition && isRecording) {
      speechRecognition.stop();
    }
  }

  function retrySpeaking() {
    spokenText = '';
    pronunciationScore = null;
    showSpeakingFeedback = false;
  }

  function skipSpeakingWord() {
    // Mark as wrong and add to review
    if (currentQuestion.sentence) {
      sentencesToReview = [...sentencesToReview, currentQuestion.sentence];
    } else if (currentQuestion.word) {
      wordsToReview = [...wordsToReview, currentQuestion.word];
    }
    showResult = true;
    isCorrect = false;
    showSpeakingFeedback = false;
  }

  async function nextQuestion() {
    turnsPlayed++;

    // Check turn limit for non-subscribers (only for category-based games, not custom generated)
    if (!data.gameParams.useCustom && !data.isSubscribed && turnsPlayed >= FREE_TURN_LIMIT) {
      // Save progress before showing paywall
      if (currentIndex < questions.length - 1) {
        currentIndex++;
        await saveProgress();
      }
      showPaywallModal = true;
      return;
    }

    if (currentIndex < questions.length - 1) {
      currentIndex++;
      selectedAnswer = null;
      showResult = false;
      showHint = false;
      spokenText = '';
      pronunciationScore = null;
      speakingAttempts = 0;
      showSpeakingFeedback = false;

      // Save progress after each question
      if (!data.gameParams.useCustom) {
        await saveProgress();
      }
    } else {
      gameComplete = true;
      // Mark game as completed
      if (!data.gameParams.useCustom) {
        await saveProgress(true);
      }
    }
  }

  function restartGame() {
    currentIndex = 0;
    score = 0;
    selectedAnswer = null;
    showResult = false;
    showHint = false;
    gameComplete = false;
    wordsToReview = [];
    sentencesToReview = [];
    spokenText = '';
    pronunciationScore = null;
    speakingAttempts = 0;
    showSpeakingFeedback = false;

    // Re-shuffle questions
    questions = questions.sort(() => Math.random() - 0.5);
  }

  function getDialectLabel(dialect: string): string {
    const labels: { [key: string]: string } = {
      'egyptian-arabic': 'Egyptian',
      'levantine': 'Levantine',
      'darija': 'Darija',
      'fusha': 'Fusha'
    };
    return labels[dialect] || dialect;
  }
</script>

<svelte:head>
  <title>Playing Game - Arabic Vocabulary</title>
</svelte:head>

<section class="px-3 py-6 sm:px-8 max-w-2xl mx-auto">
  {#if isLoading}
    <!-- Loading State -->
    <div class="flex flex-col items-center justify-center min-h-[60vh]">
      <div class="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
      <p class="text-text-200 text-lg">{loadingMessage}</p>
    </div>
  {:else if gameComplete}
    <!-- Game Complete Screen -->
    <div class="bg-tile-400 border-2 border-tile-600 rounded-xl p-8 text-center">
      <div class="text-6xl mb-4">
        {#if score / questions.length >= 0.8}
          =
        {:else if score / questions.length >= 0.5}
          =
        {:else}
          =
        {/if}
      </div>

      <h2 class="text-3xl font-bold text-text-300 mb-2">Game Complete!</h2>

      <p class="text-xl text-text-200 mb-6">
        You scored <span class="font-bold text-emerald-500">{score}</span> out of <span class="font-bold">{questions.length}</span>
      </p>

      <!-- Score Bar -->
      <div class="w-full bg-tile-600 rounded-full h-4 mb-6 overflow-hidden">
        <div
          class="h-full transition-all duration-500 {score / questions.length >= 0.8
            ? 'bg-emerald-500'
            : score / questions.length >= 0.5
              ? 'bg-yellow-500'
              : 'bg-red-500'}"
          style="width: {(score / questions.length) * 100}%"
        ></div>
      </div>

      <!-- Words to Review -->
      {#if wordsToReview.length > 0}
        <div class="mt-8 text-left">
          <h3 class="text-lg font-bold text-text-300 mb-4">Words to Review ({wordsToReview.length})</h3>
          <div class="space-y-3 max-h-64 overflow-y-auto">
            {#each wordsToReview as word}
              <div class="bg-tile-300 border-2 border-tile-600 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p class="text-lg font-bold text-text-300">{word.arabic_word}</p>
                  <p class="text-sm text-text-200">{word.transliterated_word}</p>
                  <p class="text-sm font-semibold text-text-300">{word.english_word}</p>
                </div>
                <div class="flex items-center gap-2">
                  <AudioButton
                    text={word.arabic_word}
                    dialect={word.dialect as Dialect}
                    audioUrl={word.audio_url || undefined}
                  />
                  <SaveButton
                    objectToSave={{
                      arabic: word.arabic_word,
                      english: word.english_word,
                      transliterated: word.transliterated_word
                    }}
                    type="Word"
                  />
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Sentences to Review -->
      {#if sentencesToReview.length > 0}
        <div class="mt-8 text-left">
          <h3 class="text-lg font-bold text-text-300 mb-4">Sentences to Review ({sentencesToReview.length})</h3>
          <div class="space-y-3 max-h-64 overflow-y-auto">
            {#each sentencesToReview as sentence}
              <div class="bg-tile-300 border-2 border-tile-600 rounded-lg p-4">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1">
                    <p class="text-lg font-bold text-text-300">{sentence.arabic}</p>
                    <p class="text-sm text-text-200">{sentence.transliteration}</p>
                    <p class="text-sm font-semibold text-text-300">{sentence.english}</p>
                    <div class="mt-2 pt-2 border-t border-tile-500">
                      <p class="text-xs text-text-100">Missing word:</p>
                      <p class="text-sm font-bold text-blue-400">{sentence.blankWord} ({sentence.blankWordEnglish})</p>
                    </div>
                  </div>
                  <AudioButton
                    text={sentence.arabic}
                    dialect={data.gameParams.dialect as Dialect}
                  />
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 mt-8">
        <button
          onclick={restartGame}
          class="flex-1 py-3 px-6 bg-blue-500 text-white font-bold rounded-lg md:hover:bg-blue-600 transition-colors"
        >
          Play Again
        </button>
        <button
          onclick={() => goto('/learn/game')}
          class="flex-1 py-3 px-6 bg-tile-500 text-text-300 font-bold rounded-lg md:hover:bg-tile-600 transition-colors border-2 border-tile-600"
        >
          New Game
        </button>
      </div>
    </div>
  {:else if currentQuestion}
    <!-- Game In Progress -->
    <div class="space-y-6">
      <!-- Progress Bar -->
      <div class="flex items-center gap-4">
        <button
          onclick={() => goto('/learn/game')}
          class="text-text-200 md:hover:text-text-300 transition-colors"
          aria-label="Back to game setup"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
        </button>

        <div class="flex-1 bg-tile-600 rounded-full h-3 overflow-hidden">
          <div
            class="h-full bg-blue-500 transition-all duration-300"
            style="width: {progress}%"
          ></div>
        </div>

        <span class="text-text-200 font-semibold text-sm whitespace-nowrap">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      <!-- Score Display -->
      <div class="flex justify-between items-center">
        <span class="px-3 py-1 bg-emerald-500/20 text-emerald-600 font-bold rounded-lg text-sm">
          Score: {score}
        </span>
        <span class="px-3 py-1 bg-tile-500 text-text-200 font-semibold rounded-lg text-sm">
          {getDialectLabel(data.gameParams.dialect)} - {data.gameParams.mode.replace('-', ' ')}
        </span>
      </div>

      <!-- Question Card -->
      <div class="bg-tile-400 border-2 border-tile-600 rounded-xl p-6">
        {#if data.gameParams.mode === 'multiple-choice'}
          <!-- Multiple Choice Mode -->
          {#if currentQuestion.sentence}
            <!-- Sentence fill-in-the-blank -->
            <div class="text-center mb-6">
              <p class="text-text-200 text-sm mb-2">Fill in the blank with the correct word</p>
              <div class="mb-4">
                <h2 class="text-2xl font-bold text-text-300 leading-relaxed" dir="rtl">
                  {currentQuestion.displayText}
                </h2>
                <AudioButton
                  text={currentQuestion.sentence.arabic}
                  dialect={data.gameParams.dialect as Dialect}
                  className="text-text-300 mt-2"
                />
              </div>
              <p class="text-text-200 text-sm italic">{currentQuestion.sentence.english}</p>
            </div>

            <!-- Hint -->
            {#if !showResult}
              <button
                onclick={() => showHint = !showHint}
                class="w-full mb-4 py-2 text-sm text-text-200 md:hover:text-text-300 transition-colors"
              >
                {showHint ? 'Hide' : 'Show'} Hint (transliteration)
              </button>
            {/if}

            {#if showHint || showResult}
              <p class="text-center text-text-200 italic mb-4">
                {currentQuestion.sentence.transliteration}
              </p>
            {/if}
          {:else if currentQuestion.word}
            <!-- Word mode -->
            <div class="text-center mb-6">
              <p class="text-text-200 text-sm mb-2">
                {currentQuestion.type === 'arabic-to-english'
                  ? 'What does this word mean?'
                  : 'What is this word in Arabic?'}
              </p>
              <div class="flex items-center justify-center gap-3">
                <h2 class="text-3xl font-bold text-text-300">
                  {currentQuestion.type === 'arabic-to-english'
                    ? currentQuestion.word.arabic_word
                    : currentQuestion.word.english_word}
                </h2>
                {#if currentQuestion.type === 'arabic-to-english'}
                  <AudioButton
                    text={currentQuestion.word.arabic_word}
                    dialect={currentQuestion.word.dialect as Dialect}
                    audioUrl={currentQuestion.word.audio_url || undefined}
                    className="text-text-300"
                  />
                {/if}
              </div>
            </div>

            <!-- Hint -->
            {#if !showResult}
              <button
                onclick={() => showHint = !showHint}
                class="w-full mb-4 py-2 text-sm text-text-200 md:hover:text-text-300 transition-colors"
              >
                {showHint ? 'Hide' : 'Show'} Hint
              </button>
            {/if}

            {#if showHint || showResult}
              <p class="text-center text-text-200 italic mb-4">
                {currentQuestion.word.transliterated_word}
              </p>
            {/if}
          {/if}

          <!-- Options -->
          <div class="grid grid-cols-1 gap-3">
            {#each currentQuestion.options as option}
              <button
                onclick={() => selectAnswer(option)}
                disabled={showResult}
                class="py-4 px-6 rounded-lg font-semibold text-left transition-all {showResult
                  ? option === currentQuestion.correctAnswer
                    ? 'bg-emerald-500 text-white'
                    : option === selectedAnswer
                      ? 'bg-red-500 text-white'
                      : 'bg-tile-300 text-text-200'
                  : selectedAnswer === option
                    ? 'bg-blue-500 text-white'
                    : 'bg-tile-300 text-text-200 md:hover:bg-tile-500 border-2 border-tile-600'}"
              >
                {option}
              </button>
            {/each}
          </div>

        {:else if data.gameParams.mode === 'listening'}
          <!-- Listening Mode -->
          {#if currentQuestion.sentence}
            <!-- Sentence listening -->
            <div class="text-center mb-6">
              <p class="text-text-200 text-sm mb-4">Listen to the sentence and identify the missing word</p>

              <button
                onclick={() => playAudio(
                  currentQuestion.sentence?.arabic || '',
                  data.gameParams.dialect,
                  undefined
                )}
                disabled={isPlayingAudio}
                class="w-24 h-24 mx-auto bg-blue-500 rounded-full flex items-center justify-center md:hover:bg-blue-600 transition-colors shadow-lg disabled:opacity-50"
                aria-label="Play audio"
              >
                {#if isPlayingAudio}
                  <svg class="w-10 h-10 text-white animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                {:else}
                  <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.617a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd" />
                  </svg>
                {/if}
              </button>

              <p class="text-text-100 text-sm mt-2">Click to play audio</p>
              <p class="text-text-200 text-sm mt-4 italic">{currentQuestion.sentence.english}</p>
            </div>

            <!-- Hint -->
            {#if !showResult}
              <button
                onclick={() => showHint = !showHint}
                class="w-full mb-4 py-2 text-sm text-text-200 md:hover:text-text-300 transition-colors"
              >
                {showHint ? 'Hide' : 'Show'} Hint (sentence with blank)
              </button>
            {/if}

            {#if showHint || showResult}
              <p class="text-center text-xl font-bold text-text-300 mb-4" dir="rtl">
                {currentQuestion.displayText}
              </p>
            {/if}
          {:else if currentQuestion.word}
            <!-- Word listening -->
            <div class="text-center mb-6">
              <p class="text-text-200 text-sm mb-4">Listen to the audio and select the correct meaning</p>

              <button
                onclick={() => playAudio(
                  currentQuestion.word?.arabic_word || '',
                  currentQuestion.word?.dialect || '',
                  currentQuestion.word?.audio_url
                )}
                disabled={isPlayingAudio}
                class="w-24 h-24 mx-auto bg-blue-500 rounded-full flex items-center justify-center md:hover:bg-blue-600 transition-colors shadow-lg disabled:opacity-50"
                aria-label="Play audio"
              >
                {#if isPlayingAudio}
                  <svg class="w-10 h-10 text-white animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                {:else}
                  <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.617a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd" />
                  </svg>
                {/if}
              </button>

              <p class="text-text-100 text-sm mt-2">Click to play audio</p>
            </div>

            <!-- Hint -->
            {#if !showResult}
              <button
                onclick={() => showHint = !showHint}
                class="w-full mb-4 py-2 text-sm text-text-200 md:hover:text-text-300 transition-colors"
              >
                {showHint ? 'Hide' : 'Show'} Hint (Arabic text)
              </button>
            {/if}

            {#if showHint || showResult}
              <p class="text-center text-2xl font-bold text-text-300 mb-4">
                {currentQuestion.word.arabic_word}
              </p>
            {/if}
          {/if}

          <!-- Options -->
          <div class="grid grid-cols-1 gap-3">
            {#each currentQuestion.options as option}
              <button
                onclick={() => selectAnswer(option)}
                disabled={showResult}
                class="py-4 px-6 rounded-lg font-semibold text-left transition-all {showResult
                  ? option === currentQuestion.correctAnswer
                    ? 'bg-emerald-500 text-white'
                    : option === selectedAnswer
                      ? 'bg-red-500 text-white'
                      : 'bg-tile-300 text-text-200'
                  : selectedAnswer === option
                    ? 'bg-blue-500 text-white'
                    : 'bg-tile-300 text-text-200 md:hover:bg-tile-500 border-2 border-tile-600'}"
              >
                {option}
              </button>
            {/each}
          </div>

        {:else if data.gameParams.mode === 'speaking'}
          <!-- Speaking Mode -->
          <div class="text-center">
            {#if currentQuestion.sentence}
              <!-- Sentence speaking -->
              <p class="text-text-200 text-sm mb-2">Pronounce this sentence</p>

              <div class="mb-4">
                <h2 class="text-2xl font-bold text-text-300 leading-relaxed" dir="rtl">{currentQuestion.sentence.arabic}</h2>
                <AudioButton
                  text={currentQuestion.sentence.arabic}
                  dialect={data.gameParams.dialect as Dialect}
                  className="text-text-300 mt-2"
                />
              </div>

              <p class="text-text-200 italic mb-2">{currentQuestion.sentence.transliteration}</p>
              <p class="text-text-300 font-semibold mb-6">{currentQuestion.sentence.english}</p>
            {:else if currentQuestion.word}
              <!-- Word speaking -->
              <p class="text-text-200 text-sm mb-2">Pronounce this word</p>

              <div class="flex items-center justify-center gap-3 mb-4">
                <h2 class="text-4xl font-bold text-text-300">{currentQuestion.word.arabic_word}</h2>
                <AudioButton
                  text={currentQuestion.word.arabic_word}
                  dialect={currentQuestion.word.dialect as Dialect}
                  audioUrl={currentQuestion.word.audio_url || undefined}
                  className="text-text-300"
                />
              </div>

              <p class="text-text-200 italic mb-2">{currentQuestion.word.transliterated_word}</p>
              <p class="text-text-300 font-semibold mb-6">{currentQuestion.word.english_word}</p>
            {/if}

            {#if !showResult}
              {#if showSpeakingFeedback && pronunciationScore !== null && pronunciationScore < (currentQuestion.sentence ? 50 : 60)}
                <!-- Pronunciation Feedback with Retry -->
                <div class="p-4 bg-yellow-500/20 rounded-lg mb-4">
                  <div class="flex items-center justify-center gap-2 mb-2">
                    <svg class="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    <p class="text-yellow-500 font-bold">Keep practicing!</p>
                  </div>
                  <p class="text-text-200 text-sm mb-1">You said: <span class="font-semibold text-text-300">{spokenText}</span></p>
                  <p class="text-text-200 text-sm">Score: <span class="font-semibold text-yellow-500">{pronunciationScore}%</span> (need {currentQuestion.sentence ? '50' : '60'}% to pass)</p>
                  <p class="text-text-100 text-xs mt-2">Attempt {speakingAttempts}</p>
                </div>

                <div class="flex gap-3 justify-center">
                  <button
                    onclick={retrySpeaking}
                    class="flex-1 max-w-[150px] py-3 px-6 bg-blue-500 text-white font-bold rounded-lg md:hover:bg-blue-600 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onclick={skipSpeakingWord}
                    class="flex-1 max-w-[150px] py-3 px-6 bg-tile-500 text-text-300 font-bold rounded-lg md:hover:bg-tile-600 transition-colors border-2 border-tile-600"
                  >
                    Skip
                  </button>
                </div>
              {:else}
                <!-- Recording Button -->
                <button
                  onclick={isRecording ? stopRecording : startRecording}
                  class="w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all shadow-lg {isRecording
                    ? 'bg-red-500 animate-pulse'
                    : 'bg-blue-500 md:hover:bg-blue-600'}"
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  {#if isRecording}
                    <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  {:else}
                    <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                  {/if}
                </button>

                <p class="text-text-200 text-sm mt-4">
                  {isRecording ? 'Listening... Click to stop' : 'Click to start speaking'}
                </p>
              {/if}
            {/if}
          </div>
        {/if}

        <!-- Result Feedback -->
        {#if showResult}
          <div class="mt-6 p-4 rounded-lg {isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20'}">
            <div class="flex items-center gap-3">
              {#if isCorrect}
                <svg class="w-8 h-8 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <div>
                  <p class="text-emerald-500 font-bold text-lg">Correct!</p>
                  {#if pronunciationScore !== null}
                    <p class="text-emerald-600 text-sm">Pronunciation score: {pronunciationScore}%</p>
                  {/if}
                </div>
              {:else}
                <svg class="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <div>
                  <p class="text-red-500 font-bold text-lg">
                    {data.gameParams.mode === 'speaking' ? 'Try again!' : 'Incorrect'}
                  </p>
                  {#if data.gameParams.mode !== 'speaking'}
                    <p class="text-text-200 text-sm">
                      Correct answer: <span class="font-semibold text-text-300">{currentQuestion.correctAnswer}</span>
                    </p>
                  {/if}
                  {#if pronunciationScore !== null}
                    <p class="text-red-400 text-sm">Pronunciation score: {pronunciationScore}%</p>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Save Word/Sentence Option -->
            {#if !isCorrect && currentQuestion.word}
              <div class="mt-4 flex items-center gap-2">
                <span class="text-text-200 text-sm">Save for later review:</span>
                <SaveButton
                  objectToSave={{
                    arabic: currentQuestion.word.arabic_word,
                    english: currentQuestion.word.english_word,
                    transliterated: currentQuestion.word.transliterated_word
                  }}
                  type="Word"
                />
              </div>
            {:else if !isCorrect && currentQuestion.sentence}
              <div class="mt-4">
                <p class="text-text-200 text-sm mb-2">Missing word: <span class="font-bold text-blue-400">{currentQuestion.sentence.blankWord}</span> ({currentQuestion.sentence.blankWordEnglish})</p>
              </div>
            {/if}
          </div>

          <!-- Next Button -->
          <button
            onclick={nextQuestion}
            class="w-full mt-6 py-4 px-8 bg-blue-500 text-white text-lg font-bold rounded-lg md:hover:bg-blue-600 transition-colors"
          >
            {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
          </button>
        {/if}
      </div>
    </div>
  {:else}
    <!-- No Questions State -->
    <div class="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div class="text-6xl mb-4">=</div>
      <h2 class="text-2xl font-bold text-text-300 mb-2">No Words Available</h2>
      <p class="text-text-200 mb-6">
        We couldn't find enough words for this game. Try a different category or dialect.
      </p>
      <button
        onclick={() => goto('/learn/game')}
        class="py-3 px-6 bg-blue-500 text-white font-bold rounded-lg md:hover:bg-blue-600 transition-colors"
      >
        Go Back
      </button>
    </div>
  {/if}
</section>

<!-- Paywall Modal for free tier limit -->
<PaywallModal isOpen={showPaywallModal} handleCloseModal={() => {
  showPaywallModal = false;
  // When closing paywall, redirect to game setup
  goto('/learn/game');
}} />
