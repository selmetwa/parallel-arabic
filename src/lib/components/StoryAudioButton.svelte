<script lang="ts">
  interface Props {
    storyId: string;
    dialect: string;
    class?: string;
    audioPath: string;
    className?: string;
  }

  let { storyId, dialect, class: className = '', audioPath, className: additionalClassName = '' }: Props = $props();
  
  let playbackRate = $state(1.0);
  let isPlaying = $state(false);
  let isPaused = $state(false);
  let currentAudio: HTMLAudioElement | null = null;

  function toggleStoryAudio() {
    if (!audioPath) {
      console.warn('No audio path provided');
      return;
    }

    console.log('🎵 Attempting to play audio:', audioPath);

    // If audio is currently playing, pause it
    if (isPlaying && currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      isPlaying = false;
      isPaused = true;
      return;
    }

    // If audio is paused, resume from current position
    if (isPaused && currentAudio) {
      currentAudio.play().catch(error => {
        console.error('Failed to resume story audio:', error);
        isPlaying = false;
        isPaused = false;
      });
      isPlaying = true;
      isPaused = false;
      return;
    }

    // If no audio exists or it's ended, create new audio and start playing
    if (currentAudio) {
      currentAudio.pause();
    }

    currentAudio = new Audio(audioPath);
    
    // Apply the playback rate from voice configuration
    currentAudio.playbackRate = playbackRate;
    
    currentAudio.addEventListener('loadstart', () => {
      isPlaying = true;
      isPaused = false;
    });
    
    currentAudio.addEventListener('ended', () => {
      isPlaying = false;
      isPaused = false;
      currentAudio = null;
    });
    
    currentAudio.addEventListener('error', (errorEvent) => {
      isPlaying = false;
      isPaused = false;
      console.error('Failed to play story audio:', errorEvent);
      console.error('Audio path:', audioPath);
      
      // Let's fetch the URL directly to see what error we get
      fetch(audioPath)
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => {
              console.error('Storage error response:', text);
              console.error('Status:', response.status, response.statusText);
            });
          }
        })
        .catch(fetchError => {
          console.error('Fetch error:', fetchError);
        });
      
      currentAudio = null;
    });

    currentAudio.play().catch(error => {
      console.error('Failed to play story audio:', error);
      isPlaying = false;
      isPaused = false;
      currentAudio = null;
    });
  }

  function changePlaybackRate(newRate: number) {
    playbackRate = newRate;
    if (currentAudio) {
      currentAudio.playbackRate = newRate;
    }
  }

  const speedOptions = [0.5, 0.7, 0.8, 0.9, 1];
  
  function getAriaLabel() {
    if (isPlaying) return 'Pause story audio';
    if (isPaused) return 'Resume story audio';
    return 'Play full story audio';
  }
</script>

{#if audioPath}
  <div class="flex items-center gap-2">
    <button
      onclick={toggleStoryAudio}
      type="button"
      class="inline-flex items-center justify-center p-1 rounded hover:bg-tile-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed {className} {additionalClassName}"
      aria-label={getAriaLabel()}
    >
      {#if isPlaying}
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
  </div>
{:else}
  <div class="text-sm text-text-200 opacity-50">
    <svg
      class="w-4 h-4 inline"
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
  </div>
{/if} 