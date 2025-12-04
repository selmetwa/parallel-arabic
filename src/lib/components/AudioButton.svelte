<script lang="ts">
  import { Howl } from 'howler';
  import { type Dialect } from '$lib/types/index';
  
  interface Props {
    text: string;
    dialect?: Dialect;
    audioUrl?: string;
    className?: string;
  }
  
  let { text, dialect = 'egyptian-arabic', audioUrl, className = '' }: Props = $props();

	let isLoading = $state(false);
	let playbackRate = $state(0.9);
	let currentSound: Howl | null = null;

	const speakArabic = async () => {
		isLoading = true;
		
		// Stop any currently playing sound
		if (currentSound) {
			currentSound.stop();
		}
		
		try {
			let finalAudioUrl: string;
			let serverPlaybackRate = 1.0;

			// Prefer audioUrl if provided, otherwise use TTS
			if (audioUrl) {
				finalAudioUrl = audioUrl;
				// Default playback rate for pre-recorded audio
				serverPlaybackRate = 1.0;
			} else {
				// Fall back to TTS
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
				serverPlaybackRate = parseFloat(res.headers.get('X-Playback-Rate') || '1.0');

				// Convert response to a blob
				const audioBlob = await res.blob();

				// Create a URL for the audio blob
				finalAudioUrl = URL.createObjectURL(audioBlob);
			}

			// Create a Howl instance to play the audio
			currentSound = new Howl({
				src: [finalAudioUrl],
				autoplay: true,
				rate: serverPlaybackRate * playbackRate, // Apply both server and user playback rates
				format: ['mp3', 'wav'], // Support both formats
				onloaderror: (id, error) => {
					console.error('Audio load error:', error);
					isLoading = false;
				},
				onplayerror: (id, error) => {
					console.error('Audio play error:', error);
					isLoading = false;
				}
			});

			isLoading = false;

			// Play the audio
			currentSound.play();
		} catch (error) {
			console.error('Audio playback failed:', error);
			isLoading = false;
		}
	};
</script>

<button
	type="button"
	onclick={speakArabic}
	class="inline-flex shrink-0 items-center justify-center p-1 rounded md:hover:bg-tile-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed {className}"
	disabled={isLoading}
	aria-label="Play audio"
>
	{#if isLoading}
		<svg
			class="w-4 h-4 animate-spin"
			fill="none"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle
				class="opacity-25"
				cx="12"
				cy="12"
				r="10"
				stroke="currentColor"
				stroke-width="4"
			></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
	{:else}
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
