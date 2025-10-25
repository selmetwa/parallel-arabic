<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Button from '$lib/components/Button.svelte';

  interface Props {
    storyId: string;
    dialect: string;
    class?: string;
    audioPath: string
  }

  let { storyId, dialect, class: className = '', audioPath }: Props = $props();
  
  $inspect({ audioPath })
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

  function getButtonText() {
    if (isPlaying) return 'Pause Story';
    if (isPaused) return 'Resume Story';
    return 'Play Full Story';
  }

  function changePlaybackRate(newRate: number) {
    playbackRate = newRate;
    if (currentAudio) {
      currentAudio.playbackRate = newRate;
    }
  }

  const speedOptions = [0.5, 0.7, 0.8, 0.9, 1];
</script>

{#if audioPath}
  <div class="flex flex-col gap-2">
    <Button
      onClick={toggleStoryAudio}
      type="button"
      className="flex items-center gap-2 {className}"
    >
      {getButtonText()}
    </Button>
    
    <!-- Speed Control -->
    <div class="flex items-center gap-2 text-sm">
      <span class="text-text-300">Speed:</span>
      <div class="flex gap-1">
        {#each speedOptions as speed}
          <button
            onclick={() => changePlaybackRate(speed)}
            class="px-2 py-1 text-xs border border-tile-500 transition-colors
                   {playbackRate === speed 
                     ? 'bg-tile-400 text-white border-tile-500' 
                     : 'bg-tile-300 text-text-700 border-tile-200 hover:bg-tile-400'}"
          >
            {speed}x
          </button>
        {/each}
      </div>
    </div>
  </div>
{:else}
  <div class="text-sm text-text-300">
    Full story audio not available
  </div>
{/if} 