<script lang="ts">
	import { Howl } from 'howler';
	import type { Dialect } from '$lib/types/index';

	interface Props {
		text: string;
		dialect: Dialect;
		audioUrl?: string;
		className?: string;
	}

	let { text, dialect, audioUrl, className = '' }: Props = $props();

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
				rate: serverPlaybackRate * playbackRate,
				format: ['mp3', 'wav'],
				onloaderror: (id, error) => {
					console.error('Audio load error:', error);
					isLoading = false;
				},
				onplayerror: (id, error) => {
					console.error('Audio play error:', error);
					isLoading = false;
				},
				onend: () => {
					isLoading = false;
				}
			});

			// Play the audio
			currentSound.play();
			isLoading = false;
		} catch (error) {
			console.error('Audio playback failed:', error);
			isLoading = false;
		}
	};
</script>

<button
	type="button"
	onclick={speakArabic}
	class="inline-flex items-center justify-center rounded p-1 transition-colors hover:bg-tile-500 disabled:cursor-not-allowed disabled:opacity-50 {className}"
	disabled={isLoading}
	aria-label="Play audio"
>
	{#if isLoading}
		<svg
			class="h-4 w-4 animate-spin"
			fill="none"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
			></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
	{:else}
		<!--
			Referenced from the sprite in the root layout rather than inlined. A
			vocabulary table repeats this button once per row, and the full path data
			is ~700 bytes — inlining it put three quarters of a megabyte of identical
			SVG into the thousand-word list.
		-->
		<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
			<use href="#pa-speaker" />
		</svg>
	{/if}
</button>
