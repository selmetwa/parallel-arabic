<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Button from '$lib/components/Button.svelte';

  interface Props {
    storyId: string;
    dialect: string;
    class?: string;
  }

  let { storyId, dialect, class: className = '' }: Props = $props();
  
  let audioExists = $state(false);
  let audioPath = $state('');
  let playbackRate = $state(1.0);
  let isChecking = $state(true);
  let isPlaying = $state(false);
  let isPaused = $state(false);
  let currentAudio: HTMLAudioElement | null = null;
  let pollCount = $state(0);
  let maxPollAttempts = 30; // 30 seconds max
  let pollInterval: NodeJS.Timeout | null = null;

  async function checkAudioExists() {
    try {
      const response = await fetch(`/api/check-story-audio?storyId=${storyId}&dialect=${dialect}`);
      const data = await response.json();
      
      if (data.exists) {
        audioExists = true;
        audioPath = data.audioPath || '';
        playbackRate = data.playbackRate || 1.0;
        isChecking = false;
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to check story audio:', error);
      return false;
    }
  }

  onMount(async () => {
    // Initial check
    const initialExists = await checkAudioExists();
    
    if (!initialExists) {
      // Start polling if audio doesn't exist yet
      pollInterval = setInterval(async () => {
        pollCount++;
        
        const exists = await checkAudioExists();
        
        if (exists || pollCount >= maxPollAttempts) {
          if (!exists) {
            // Audio still doesn't exist after 30 seconds
            audioExists = false;
            isChecking = false;
          }
          
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        }
      }, 1000); // Check every second
    }
  });

  onDestroy(() => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
  });

  function toggleStoryAudio() {
    if (!audioPath) return;

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
    
    currentAudio.addEventListener('error', () => {
      isPlaying = false;
      isPaused = false;
      currentAudio = null;
      console.error('Failed to play story audio');
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

{#if audioExists}
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