<script lang="ts">
	import { onMount } from 'svelte';
	import { currentDialect } from '$lib/store/store';
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
					transliteration,
					english: english || ''
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
			'egyptian-arabic': 'bg-blue-600 text-white',
			'levantine': 'bg-orange-600 text-white',
			'darija': 'bg-green-600 text-white',
			'fusha': 'bg-purple-600 text-white',
		};
		return colors[dialect as keyof typeof colors] || 'bg-gray-600 text-white';
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

<section class="min-h-screen bg-tile-300">
	<!-- Header -->
	<header class="py-8 bg-tile-200 border-b border-tile-600">
		<div class="max-w-7xl mx-auto px-4 sm:px-8">
			<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
				<div>
					<a href="/videos" class="inline-flex items-center gap-2 text-text-200 hover:text-text-300 transition-colors mb-4">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
						Back to Videos
					</a>
					<h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-300 leading-tight mb-2">
						{data.video.title?.arabic || 'فيديو'}
					</h1>
					<h2 class="text-lg sm:text-xl text-text-200 mb-4">
						{data.video.title?.english || 'Video'}
					</h2>
					<span class="inline-flex items-center px-4 py-1.5 text-sm font-bold rounded-full shadow-md {getDialectBadgeColor(data.video.dialect)}">
						{data.video.dialect_name}
					</span>
				</div>
				{#if data.video.description}
					<div class="lg:max-w-md">
						<p class="text-text-200 leading-relaxed">
							{data.video.description?.english || data.video.description?.arabic}
						</p>
					</div>
				{/if}
			</div>
		</div>
	</header>

	<!-- Main Content: Side-by-side Video and Sentences -->
	<div class="flex flex-col lg:flex-row">
		<!-- Left Column: Fixed Video Player -->
		<div class="lg:w-2/5 xl:w-1/3 p-4 sm:p-6 bg-tile-300 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto relative z-10">
			<!-- Video Player Card -->
			<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden mb-6 relative z-10">
				<div class="p-4 border-b border-tile-600">
					<h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
						</svg>
						Video Player
					</h3>
				</div>
				{#if data.video.url}
					<div class="aspect-video relative z-10">
						<div id="youtube-player" class="w-full h-full"></div>
					</div>
				{:else}
					<div class="aspect-video flex items-center justify-center bg-tile-500">
						<p class="text-text-200">No video available.</p>
					</div>
				{/if}
			</div>

			<!-- Navigation Controls Card -->
			<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
				<div class="p-4 border-b border-tile-600">
					<div class="flex justify-between items-center">
						<h3 class="text-lg font-bold text-text-300">Navigation</h3>
						<span class="px-3 py-1 bg-tile-500 rounded-full text-sm font-semibold text-text-300">
							{currentLineIndex + 1} / {data.video.lines?.length || 0}
						</span>
					</div>
				</div>
				
				<div class="p-4 space-y-4">
					<!-- Toggle Options -->
					<div class="flex flex-wrap gap-4">
						<label class="flex items-center gap-2 text-text-200 cursor-pointer">
							<input 
								type="checkbox" 
								bind:checked={showEnglish}
								class="w-4 h-4 rounded border-tile-500 bg-tile-300 text-tile-700 focus:ring-tile-600"
							/>
							<span class="text-sm font-medium">Show English</span>
						</label>
						<label class="flex items-center gap-2 text-text-200 cursor-pointer">
							<input 
								type="checkbox" 
								bind:checked={showTransliteration}
								class="w-4 h-4 rounded border-tile-500 bg-tile-300 text-tile-700 focus:ring-tile-600"
							/>
							<span class="text-sm font-medium">Show Transliteration</span>
						</label>
					</div>
					
					<!-- Navigation Buttons -->
					<div class="grid grid-cols-2 gap-3">
						<button 
							onclick={previousLine} 
							disabled={currentLineIndex === 0}
							class="flex items-center justify-center gap-2 px-4 py-3 bg-tile-500 text-text-300 font-semibold rounded-lg hover:bg-tile-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-tile-600"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
							</svg>
							Previous
						</button>
						
						<button 
							onclick={nextLine} 
							disabled={currentLineIndex >= (data.video.lines?.length || 1) - 1}
							class="flex items-center justify-center gap-2 px-4 py-3 bg-tile-500 text-text-300 font-semibold rounded-lg hover:bg-tile-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-tile-600"
						>
							Next
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</button>
					</div>
					
					<!-- Compare Dialects Button -->
					{#if data.video.lines && data.video.lines[currentLineIndex]?.arabic?.text}
						<button 
							onclick={() => compareDialects(
								data.video.lines[currentLineIndex].arabic.text,
								data.video.lines[currentLineIndex].english?.text,
								data.video.lines[currentLineIndex].transliteration?.text
							)}
							class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
							</svg>
							Compare Dialects
						</button>
					{/if}
				</div>
			</div>
		</div>

		<!-- Right Column: Scrollable Sentences -->
		<div class="lg:w-3/5 xl:w-2/3 p-4 sm:p-6 bg-tile-200 min-h-screen">
			<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
				<div class="p-4 border-b border-tile-600 sticky top-0 bg-tile-400 z-10">
					<h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						Transcript
						<span class="text-sm font-normal text-text-200">— Click any word for definition</span>
					</h3>
				</div>
				
				<div class="p-4">
					{#if data.video.lines && data.video.lines.length > 0}
						<div class="space-y-2">
							{#each data.video.lines as line, index}
								{@const transformedSentence = {
									arabic: { text: line.arabic?.text || '', speaker: '' },
									english: { text: line.english?.text || '', speaker: '' },
									transliteration: { text: line.transliteration?.text || '', speaker: '' }
								}}
								
								<div 
									id="sentence-{index}"
									class="cursor-pointer rounded-lg transition-all duration-300 border-2 {
										currentLineIndex === index 
											? 'border-sky-500 bg-sky-500/10 shadow-lg' 
											: 'border-transparent hover:bg-tile-500/50 hover:border-tile-500'
									}"
									onclick={(e) => goToLine(index)}
									role="button"
									tabindex="0"
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											goToLine(index);
										}
									}}
								>
									<div class="p-4">
										{#if currentLineIndex === index}
											<div class="flex items-center gap-2 mb-3">
												<div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
												<span class="text-xs text-red-400 font-semibold uppercase tracking-wide">Now Playing</span>
											</div>
										{/if}
										
										<div class="flex items-start justify-between gap-4">
											<div class="flex-1 space-y-2">
												{#if showTransliteration}
													<Sentence 
														sentence={transformedSentence}
														type="transliteration"
														{setActiveWord}
														index={index}
														mode="SentenceView"
														dialect={data.video.dialect}
														classname="!border-0 !py-1 !px-0"
													/>
												{/if}
												
												<Sentence 
													sentence={transformedSentence}
													type="arabic"
													{setActiveWord}
													index={index}
													mode="SentenceView"
													dialect={data.video.dialect}
													classname="!border-0 !py-1 !px-0"
													innerClassname="py-4"
												/>
												
												{#if showEnglish}
													<Sentence 
														sentence={transformedSentence}
														type="english"
														{setActiveWord}
														index={index}
														mode="SentenceView"
														dialect={data.video.dialect}
														classname="!border-0 !py-1 !px-0"
													/>
												{/if}
											</div>
											<span class="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-tile-500 rounded-full text-text-200 text-xs font-mono font-bold">
												{index + 1}
											</span>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-12">
							<div class="text-4xl mb-4">📄</div>
							<p class="text-text-200">No transcript available for this video.</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</section>

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
