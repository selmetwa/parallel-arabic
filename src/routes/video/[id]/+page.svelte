<script lang="ts">
	import { onMount } from 'svelte';
	import { currentDialect } from '$lib/store/store';
	import Audio from '$lib/components/Audio.svelte';
	import Button from '$lib/components/Button.svelte';
	import Sentence from '$lib/components/dialect-shared/story/components/Sentence.svelte';
	import DefinitionModal from '$lib/components/dialect-shared/sentences/DefinitionModal.svelte';
	import DialectComparisonModal from '$lib/components/dialect-shared/sentences/DialectComparisonModal.svelte';
	import type { DialectComparisonSchema } from '$lib/utils/gemini-schemas';
	import type { Dialect } from '$lib/types';

	let { data } = $props();
	let currentLineIndex = $state(0);
	let showTransliteration = $state(true);
	let showEnglish = $state(true);
	let player: any = null;
	let isVideoReady = $state(false);
	
	// Active word state for definitions
	let activeWord = $state({
		english: '',
		arabic: '',
		transliterated: '',
		description: '',
		isLoading: false,
		type: ''
	});

	// Modal state
	let isDefinitionModalOpen = $state(false);

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
					currentDialect: data.video.dialect,
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

	// Get dialect badge color
	function getDialectBadgeColor(dialect: string) {
		const colors = {
			'egyptian-arabic': 'bg-blue-100 text-blue-800',
			'levantine': 'bg-orange-100 text-orange-800',
			'darija': 'bg-green-100 text-green-800',
			'fusha': 'bg-purple-100 text-purple-800',
		};
		return colors[dialect as keyof typeof colors] || 'bg-gray-100 text-gray-800';
	}

	onMount(() => {
		// Set the current dialect to match this video's dialect
		currentDialect.set(data.video.dialect);
		
		// Store original layout width and set wider width for video page
		const root = document.documentElement;
		const originalWidth = getComputedStyle(root).getPropertyValue('--layout-width');
		root.style.setProperty('--layout-width', '2400px');
		
		// Load YouTube Player API
		if (data.video.url) {
			loadYouTubeAPI();
		}
		
		// Restore original width on unmount
		return () => {
			root.style.setProperty('--layout-width', originalWidth);
			if (player) {
				player.destroy();
			}
		};
	});

	function loadYouTubeAPI() {
		// Load YouTube iframe API if not already loaded
		if (!(window as any).YT) {
			const tag = document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';
			const firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
			
			(window as any).onYouTubeIframeAPIReady = createPlayer;
		} else {
			createPlayer();
		}
	}

	function createPlayer() {
		const videoId = data.video.url.includes('watch?v=') 
			? data.video.url.split('watch?v=')[1].split('&')[0]
			: data.video.url.split('/').pop();

		player = new (window as any).YT.Player('youtube-player', {
			height: '100%',
			width: '100%',
			videoId: videoId,
			events: {
				'onReady': onPlayerReady,
				'onStateChange': onPlayerStateChange
			}
		});
	}

	function onPlayerReady() {
		isVideoReady = true;
		startTimeTracking();
	}

	function onPlayerStateChange(event: any) {
		// Start tracking when video is playing
		if (event.data === (window as any).YT.PlayerState.PLAYING) {
			startTimeTracking();
		}
	}

	function startTimeTracking() {
		if (!player || !data.video.lines) return;

		const trackTime = () => {
			if (player && player.getCurrentTime) {
				const currentTime = player.getCurrentTime();
				updateCurrentSentence(currentTime);
			}
		};

		// Track time every 100ms when video is playing
		const interval = setInterval(() => {
			if (player && player.getPlayerState && player.getPlayerState() === (window as any).YT.PlayerState.PLAYING) {
				trackTime();
			}
		}, 100);

		// Clean up interval when component unmounts
		return () => clearInterval(interval);
	}

	function updateCurrentSentence(currentTime: number) {
		if (!data.video.lines) return;

		for (let i = 0; i < data.video.lines.length; i++) {
			const line = data.video.lines[i];
			const startTime = parseFloat(line.start);
			const endTime = startTime + parseFloat(line.dur);

			if (currentTime >= startTime && currentTime <= endTime) {
				if (currentLineIndex !== i) {
					currentLineIndex = i;
					// Scroll to keep current sentence in view
					scrollToCurrentSentence(i);
				}
				break;
			}
		}
	}

	function scrollToCurrentSentence(index: number) {
		// Scroll the sentence into view
		const sentenceElement = document.getElementById(`sentence-${index}`);
		if (sentenceElement) {
			sentenceElement.scrollIntoView({ 
				behavior: 'smooth', 
				block: 'center' 
			});
		}
	}

	function nextLine() {
		if (data.video.lines && currentLineIndex < data.video.lines.length - 1) {
			goToLine(currentLineIndex + 1);
		}
	}

	function previousLine() {
		if (currentLineIndex > 0) {
			goToLine(currentLineIndex - 1);
		}
	}

	function goToLine(index: number) {
		currentLineIndex = index;
		// Also jump to timestamp in video if player is ready
		if (player && data.video.lines && data.video.lines[index]) {
			const startTime = parseFloat(data.video.lines[index].start);
			player.seekTo(startTime, true);
		}
	}
	
	function setActiveWord(wordData: any) {
		activeWord = wordData;
		isDefinitionModalOpen = true;
	}

	function closeDefinitionModal() {
		isDefinitionModalOpen = false;
	}
</script>

<!-- Main Content: Side-by-side Video and Sentences -->
<div class="flex flex-col lg:flex-row">
	<!-- Left Column: Fixed Video Player -->
	<div class="lg:w-1/3 p-6 bg-tile-300 lg:fixed lg:left-0">
		<header class="px-6 py-6 border-b border-tile-600">
			<div class="text-left">
				<div class="flex flex-col gap-3 mb-4">
					<h1 class="text-2xl sm:text-3xl text-text-300 font-bold tracking-tight">
						{data.video.title?.arabic || 'فيديو'}
					</h1>
					<h2 class="text-lg sm:text-xl text-text-200">
						{data.video.title?.english || 'Video'}
					</h2>
					<!-- Dialect Badge -->
					<span class="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full w-fit {getDialectBadgeColor(data.video.dialect)}">
						{data.video.dialect_name}
					</span>
				</div>
				{#if data.video.description}
					<p class="text-text-200 text-sm">
						{data.video.description?.english || data.video.description?.arabic}
					</p>
				{/if}
			</div>
		</header>
		{#if data.video.url}
			<div class="bg-tile-400 border border-tile-600 p-6 shadow-lg h-full flex flex-col">
				<h3 class="text-lg font-bold text-text-300 mb-4">Video</h3>
				<div class="flex-1 aspect-video">
					<div id="youtube-player" class="w-full h-full"></div>
				</div>
			</div>
		{:else}
			<div class="bg-tile-400 border border-tile-600 p-6 shadow-lg h-full flex items-center justify-center">
				<p class="text-text-200">No video available.</p>
			</div>
		{/if}
	</div>

	<!-- Right Column: Scrollable Sentences and Controls -->
	<div class="lg:w-2/3 lg:ml-[33.33%] p-6 bg-tile-200 flex flex-col min-h-screen">
		<!-- Navigation Controls -->
		<div class="bg-tile-400 border border-tile-600 p-6 mb-6 shadow-lg">
			<div class="flex justify-between items-center mb-4">
				<h3 class="text-lg font-bold text-text-300">Content Navigation</h3>
				<div class="flex items-center gap-3">
					<span class="text-text-300 font-semibold">
						{currentLineIndex + 1} / {data.video.lines?.length || 0}
					</span>
				</div>
				<div class="flex gap-2">
					<label class="flex items-center gap-2 text-text-200">
						<input 
							type="checkbox" 
							bind:checked={showEnglish}
							class="rounded"
						/>
						Show English
					</label>
					<label class="flex items-center gap-2 text-text-200">
						<input 
							type="checkbox" 
							bind:checked={showTransliteration}
							class="rounded"
						/>
						Show Transliteration
					</label>
				</div>
			</div>
			
			<div class="flex flex-col gap-2 mb-4">
				<div class="flex justify-between items-center">
					<Button 
						onClick={previousLine} 
						disabled={currentLineIndex === 0}
						type="button"
					>
						Previous
					</Button>
					
					<Button 
						onClick={nextLine} 
						disabled={currentLineIndex >= (data.video.lines?.length || 1) - 1}
						type="button"
					>
						Next
					</Button>
				</div>
				
				{#if data.video.lines && data.video.lines[currentLineIndex]?.arabic?.text}
					<Button 
						onClick={() => compareDialects(
							data.video.lines[currentLineIndex].arabic.text,
							data.video.lines[currentLineIndex].english?.text,
							data.video.lines[currentLineIndex].transliteration?.text
						)}
						type="button"
					>
						Compare Dialects
					</Button>
				{/if}
			</div>
		</div>

		<!-- All Lines Overview -->
		<div class="bg-tile-400 border border-tile-600 p-6 shadow-lg mb-6">
			<h3 class="text-lg font-bold text-text-300 mb-4">All Lines</h3>
			
			{#if data.video.lines && data.video.lines.length > 0}
				<div class="space-y-1">
					{#each data.video.lines as line, index}
						{@const transformedSentence = {
							arabic: { text: line.arabic?.text || '', speaker: '' },
							english: { text: line.english?.text || '', speaker: '' },
							transliteration: { text: line.transliteration?.text || '', speaker: '' }
						}}
						
						<div 
							id="sentence-{index}"
							class="cursor-pointer hover:bg-tile-300 transition-all duration-300 {
								currentLineIndex === index 
									? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-[1.02]' 
									: 'hover:shadow-md'
							}"
							onclick={(e) => {
								// Only trigger goToLine if the click wasn't on a word (which would have stopPropagation)
								goToLine(index);
							}}
							role="button"
							tabindex="0"
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									goToLine(index);
								}
							}}
						>
							<div class="p-2">
								{#if currentLineIndex === index}
									<div class="flex items-center gap-2 mb-3">
										<div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
										<span class="text-xs text-red-500 font-medium">Currently Playing</span>
									</div>
								{/if}
								
								<div class="flex items-start justify-between">
									<div class="flex-1">
										{#if showTransliteration}
											<Sentence 
												sentence={transformedSentence}
												type="transliteration"
												{setActiveWord}
												index={index}
												mode="SentenceView"
												dialect={data.video.dialect}
												classname="!border-0 !py-2 !px-0"
											/>
										{/if}
										
										<Sentence 
											sentence={transformedSentence}
											type="arabic"
											{setActiveWord}
											index={index}
											mode="SentenceView"
											dialect={data.video.dialect}
											classname="!border-0 !py-2 !px-0"
											innerClassname="py-6"
										/>
										
										{#if showEnglish}
											<Sentence 
												sentence={transformedSentence}
												type="english"
												{setActiveWord}
												index={index}
												mode="SentenceView"
												dialect={data.video.dialect}
												classname="!border-0 !py-2 !px-0"
											/>
										{/if}
									</div>
									<span class="text-text-200 text-xs font-mono ml-3 flex-shrink-0 self-start mt-2">
										{index + 1}
									</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-text-200">No content available.</p>
			{/if}
		</div>
	</div>
</div>

<!-- Word Definition Modal -->
<DefinitionModal 
	activeWordObj={activeWord}
	isModalOpen={isDefinitionModalOpen}
	closeModal={closeDefinitionModal}
	dialect={data.video.dialect}
/>

<DialectComparisonModal
	isOpen={isComparisonModalOpen}
	closeModal={closeComparisonModal}
	originalText={comparisonText}
	originalEnglish={comparisonEnglish}
	{comparisonData}
	isLoading={isComparing}
	error={comparisonError}
	currentDialect={data.video.dialect as Dialect}
/>
