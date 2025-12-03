<script lang="ts">
  import { Howl } from 'howler';
  import type { Dialect } from '$lib/types/index';

  interface StorySentence {
    arabic: { text: string };
    english?: { text: string };
    transliteration?: { text: string };
  }

  interface Props {
    storyId?: string;
    dialect: Dialect;
    class?: string;
    className?: string;
    sentences: StorySentence[]; // Array of sentences to play sequentially
    onSentenceChange?: (index: number | null) => void; // Callback when current sentence changes
  }

  let { storyId, dialect, class: className = '', className: additionalClassName = '', sentences, onSentenceChange }: Props = $props();
  
  let playbackRate = $state(0.9);
  let isPlaying = $state(false);
  let isPaused = $state(false);
  let currentSentenceIndex = $state(0);
  let currentSound: Howl | null = null;
  let isLoading = $state(false);
  let audioQueue: string[] = [];

  async function playNextSentence() {
    if (currentSentenceIndex >= sentences.length) {
      // All sentences played
      isPlaying = false;
      isPaused = false;
      currentSentenceIndex = 0;
      audioQueue = [];
      return;
    }

    const sentence = sentences[currentSentenceIndex];
    if (!sentence || !sentence.arabic || !sentence.arabic.text) {
      currentSentenceIndex++;
      playNextSentence();
      return;
    }

    const text = sentence.arabic.text.trim();
    if (!text) {
      currentSentenceIndex++;
      playNextSentence();
      return;
    }

    isLoading = true;

    try {
      // Generate TTS for this sentence
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

      // Get playback rate from response headers
      const serverPlaybackRate = parseFloat(res.headers.get('X-Playback-Rate') || '1.0');

      // Convert response to a blob
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create a Howl instance to play the audio
      currentSound = new Howl({
        src: [audioUrl],
        autoplay: true,
        rate: serverPlaybackRate * playbackRate,
        format: ['mp3', 'wav'],
        onloaderror: (id, error) => {
          console.error('Audio load error:', error);
          isLoading = false;
          currentSentenceIndex++;
          if (onSentenceChange) {
            if (currentSentenceIndex >= sentences.length) {
              onSentenceChange(null);
            } else {
              onSentenceChange(currentSentenceIndex);
            }
          }
          if (isPlaying && !isPaused) {
            playNextSentence();
          }
        },
        onplayerror: (id, error) => {
          console.error('Audio play error:', error);
          isLoading = false;
          currentSentenceIndex++;
          if (onSentenceChange) {
            if (currentSentenceIndex >= sentences.length) {
              onSentenceChange(null);
            } else {
              onSentenceChange(currentSentenceIndex);
            }
          }
          if (isPlaying && !isPaused) {
            playNextSentence();
          }
        },
        onend: () => {
          isLoading = false;
          URL.revokeObjectURL(audioUrl);
          const previousIndex = currentSentenceIndex;
          currentSentenceIndex++;
          // Notify parent of sentence change
          if (onSentenceChange) {
            if (currentSentenceIndex >= sentences.length) {
              onSentenceChange(null); // All sentences played
            } else {
              onSentenceChange(currentSentenceIndex);
            }
          }
          if (isPlaying && !isPaused) {
            playNextSentence();
          }
        }
      });

      isLoading = false;
      // Notify parent of current sentence
      if (onSentenceChange && currentSentenceIndex < sentences.length) {
        onSentenceChange(currentSentenceIndex);
      }
      currentSound.play();
    } catch (error) {
      console.error('Audio playback failed:', error);
      isLoading = false;
      currentSentenceIndex++;
      if (onSentenceChange) {
        if (currentSentenceIndex >= sentences.length) {
          onSentenceChange(null);
        } else {
          onSentenceChange(currentSentenceIndex);
        }
      }
      if (isPlaying && !isPaused) {
        playNextSentence();
      }
    }
  }

  function toggleStoryAudio() {
    // If currently playing, pause
    if (isPlaying && currentSound && currentSound.playing()) {
      currentSound.pause();
      isPlaying = false;
      isPaused = true;
      handlePause();
      return;
    }

    // If paused, resume
    if (isPaused && currentSound) {
      currentSound.play();
      isPlaying = true;
      isPaused = false;
      return;
    }

    // Start playing from the beginning or current index
    if (currentSentenceIndex >= sentences.length) {
      currentSentenceIndex = 0;
    }

    isPlaying = true;
    isPaused = false;
    // Notify parent of starting sentence
    if (onSentenceChange && currentSentenceIndex < sentences.length) {
      onSentenceChange(currentSentenceIndex);
    }
    playNextSentence();
  }

  // Notify parent when pausing
  function handlePause() {
    if (onSentenceChange) {
      onSentenceChange(null);
    }
  }

  // Notify parent when stopping
  function handleStop() {
    if (onSentenceChange) {
      onSentenceChange(null);
    }
  }

  function changePlaybackRate(newRate: number) {
    playbackRate = newRate;
    if (currentSound) {
      currentSound.rate(newRate);
    }
  }

  function stopAudio() {
    if (currentSound) {
      currentSound.stop();
      currentSound = null;
    }
    isPlaying = false;
    isPaused = false;
    currentSentenceIndex = 0;
    isLoading = false;
    handleStop();
  }

  const speedOptions = [0.5, 0.7, 0.8, 0.9, 1];
  
  function getAriaLabel() {
    if (isLoading) return 'Loading audio...';
    if (isPlaying) return 'Pause story audio';
    if (isPaused) return 'Resume story audio';
    return 'Play full story audio';
  }

  // Cleanup on unmount
  $effect(() => {
    return () => {
      stopAudio();
    };
  });
</script>

<div class="flex items-center gap-2">
  <button
    onclick={toggleStoryAudio}
    type="button"
    disabled={isLoading || !sentences || !Array.isArray(sentences) || sentences.length === 0}
    class="inline-flex items-center justify-center p-1 rounded hover:bg-tile-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed {className} {additionalClassName} min-w-[50px]"
    aria-label={getAriaLabel()}
  >
      {#if isLoading}
        <!-- Loading/spinner icon -->
        <svg
          class="w-4 h-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      {:else if isPlaying}
        <!-- Pause icon -->
        <svg
          class="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
      {:else if isPaused}
        <!-- Play icon -->
        <svg
          class="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
            clip-rule="evenodd"
          />
        </svg>
      {:else}
        <!-- Audio/speaker icon -->
        <svg
          class="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.617a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
            clip-rule="evenodd"
          />
        </svg>
      {/if}
  </button>
  
  <!-- Speed Control -->
  {#if sentences && Array.isArray(sentences) && sentences.length > 0}
    <div class="flex items-center gap-1">
      {#each speedOptions as speed}
        <button
          onclick={() => changePlaybackRate(speed)}
          class="px-1.5 py-0.5 text-xs border border-tile-500 rounded transition-colors
                 {playbackRate === speed 
                   ? 'bg-tile-500 text-text-300 border-tile-600' 
                   : 'bg-tile-300 text-text-200 border-tile-400 hover:bg-tile-400'}"
          aria-label="Set playback speed to {speed}x"
        >
          {speed}x
        </button>
      {/each}
    </div>
  {/if}
</div> 