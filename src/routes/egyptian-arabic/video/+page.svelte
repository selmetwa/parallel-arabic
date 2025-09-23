<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import { onMount } from 'svelte';
	import { currentDialect } from '$lib/store/store';

	let { data } = $props();
	let youtubeUrl = $state('');
	let isLoading = $state(false);
	let formattedVideo = $state<any>(null);
	let error = $state('');
	let videoTitle = $state('');
	let videoId = $state('');
	let videoDbId = $state('');

	onMount(() => {
		currentDialect.set('egyptian-arabic');
	});

	function extractVideoId(url: string): string | null {
		const patterns = [
			/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
			/^([a-zA-Z0-9_-]{11})$/
		];
		
		for (const pattern of patterns) {
			const match = url.match(pattern);
			if (match) {
				return match[1];
			}
		}
		return null;
	}

	async function handleSubmit() {
		if (!youtubeUrl.trim()) {
			error = 'Please enter a YouTube URL';
			return;
		}

		const extractedVideoId = extractVideoId(youtubeUrl.trim());
		if (!extractedVideoId) {
			error = 'Please enter a valid YouTube URL';
			return;
		}

		isLoading = true;
		error = '';
		formattedVideo = null;
		videoId = extractedVideoId;

		try {
			const response = await fetch('/api/youtube-transcript', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					videoId: extractedVideoId
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to fetch transcript');
			}

			formattedVideo = result.formattedVideo;
			videoTitle = result.title?.english || result.title || '';
			videoDbId = result.videoDbId;
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unexpected error occurred';
		} finally {
			isLoading = false;
		}
	}

	function clearForm() {
		youtubeUrl = '';
		formattedVideo = null;
		error = '';
		videoTitle = '';
		videoId = '';
		videoDbId = '';
	}

	function goToVideo() {
		if (videoDbId) {
			goto(`/egyptian-arabic/video/${videoDbId}`);
		}
	}
</script>

{#if !data.session}
	<div class="mx-4 mb-6 mt-12 border border-tile-600 bg-tile-300 py-4 text-center sm:mx-36">
		<h1 class="text-2xl font-bold text-text-300">
			You must have an account to access this content.
		</h1>
		<div class="mx-auto mt-4 w-fit">
			<Button type="button" onClick={() => goto('/signup')}>Create Account</Button>
		</div>
	</div>
{:else}
	<section class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
		<div class="text-left mb-6">
			<h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-1 tracking-tight">
				YouTube Video Transcripts
			</h1>
			<p class="text-text-200 text-lg sm:text-xl leading-snug">
				Get transcripts from YouTube videos to practice reading Egyptian Arabic content.
			</p>
		</div>
		
		<!-- Upload Form -->
		<div class="bg-tile-400 border border-tile-600 p-6 mb-6 shadow-lg">
			<h2 class="text-xl font-bold text-text-300 mb-4">Enter YouTube Video</h2>
			
			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="youtube-url" class="block text-sm font-medium text-text-200 mb-2">
						YouTube URL or Video ID
					</label>
					<input
						id="youtube-url"
						type="text"
						bind:value={youtubeUrl}
						placeholder="https://www.youtube.com/watch?v=jNQXAC9IVRw or jNQXAC9IVRw"
						class="w-full px-3 py-2 bg-tile-300 border border-tile-500 text-text-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						disabled={isLoading}
					/>
				</div>
				
				{#if error}
					<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
						{error}
					</div>
				{/if}
				
				<div class="flex gap-3">
					<Button 
						type="submit" 
						disabled={isLoading || !youtubeUrl.trim()}
					>
						{isLoading ? 'Processing Video...' : 'Process Video'}
					</Button>
					
					{#if formattedVideo || error}
						<Button 
							type="button" 
							onClick={clearForm}
							disabled={isLoading}
						>
							Clear
						</Button>
					{/if}
				</div>
			</form>
		</div>

		<!-- Video Preview -->
		{#if videoId && videoTitle}
			<div class="bg-tile-400 border border-tile-600 p-6 mb-6 shadow-lg">
				<h3 class="text-lg font-bold text-text-300 mb-4">Video Preview</h3>
				<div class="aspect-video mb-4">
					<iframe
						src="https://www.youtube.com/embed/{videoId}"
						title="YouTube video player"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
						class="w-full h-full"
					></iframe>
				</div>
				{#if videoTitle}
					<h4 class="text-text-200 font-medium">{videoTitle}</h4>
				{/if}
			</div>
		{/if}

		<!-- Success and Video Content -->
		{#if formattedVideo}
			<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
				<div class="flex justify-between items-center">
					<div>
						<p class="font-bold">✅ Video processed successfully!</p>
						<p class="text-sm">Generated {formattedVideo.lines?.length || 0} lines with Arabic, English, and transliteration.</p>
					</div>
					<Button type="button" onClick={goToVideo}>
						View Video
					</Button>
				</div>
			</div>

			<!-- Video Content Preview -->
			<div class="bg-tile-400 border border-tile-600 p-6 shadow-lg">
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-lg font-bold text-text-300">Content Preview</h3>
					<Button type="button" onClick={goToVideo}>
						Open Full Video
					</Button>
				</div>
				
				{#if formattedVideo.title}
					<div class="mb-4">
						<h4 class="text-md font-bold text-text-200 mb-2">Title</h4>
						<div class="bg-tile-300 border border-tile-500 p-3">
							<p class="text-text-300 mb-1"><strong>Arabic:</strong> {formattedVideo.title.arabic}</p>
							<p class="text-text-300"><strong>English:</strong> {formattedVideo.title.english}</p>
						</div>
					</div>
				{/if}

				{#if formattedVideo.lines && formattedVideo.lines.length > 0}
					<div class="mb-4">
						<h4 class="text-md font-bold text-text-200 mb-2">First 3 Lines</h4>
						<div class="bg-tile-300 border border-tile-500 p-3 space-y-3">
							{#each formattedVideo.lines.slice(0, 3) as line}
								<div class="border-b border-tile-500 pb-2 last:border-b-0">
									<p class="text-text-300 mb-1"><strong>Arabic:</strong> {line.arabic?.text || ''}</p>
									<p class="text-text-200 mb-1"><strong>English:</strong> {line.english?.text || ''}</p>
									<p class="text-text-200 text-sm"><strong>Transliteration:</strong> {line.transliteration?.text || ''}</p>
									<p class="text-text-200 text-xs opacity-70"><strong>Time:</strong> {line.start}s - {(parseFloat(line.start) + parseFloat(line.dur)).toFixed(2)}s</p>
								</div>
							{/each}
							{#if formattedVideo.lines.length > 3}
								<p class="text-text-200 text-sm italic text-center">
									... and {formattedVideo.lines.length - 3} more lines
								</p>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Loading State -->
		{#if isLoading}
			<div class="bg-tile-400 border border-tile-600 p-6 text-center shadow-lg">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-text-300 mx-auto mb-4"></div>
				<p class="text-text-200">Processing video with AI...</p>
				<p class="text-text-200 text-sm mt-2">This may take a moment while we format the content</p>
			</div>
		{/if}
	</section>
{/if}
