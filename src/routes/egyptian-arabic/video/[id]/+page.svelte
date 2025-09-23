<script lang="ts">
	import { onMount } from 'svelte';
	import { currentDialect } from '$lib/store/store';
	import Audio from '$lib/components/Audio.svelte';
	import Button from '$lib/components/Button.svelte';
	import Sentence from '$lib/components/dialect-shared/story/components/Sentence.svelte';

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

	onMount(() => {
		currentDialect.set('egyptian-arabic');
		
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
	}
</script>

	<!-- Header -->


<!-- Main Content: Side-by-side Video and Sentences -->
<div class="flex flex-col lg:flex-row">
	<!-- Left Column: Fixed Video Player -->
	<div class="lg:w-1/3 p-6 bg-tile-300 lg:fixed lg:left-0">
    <header class="px-6 py-6 border-b border-tile-600">
      <div class="text-left">
		<h1 class="text-2xl sm:text-3xl text-text-300 font-bold mb-2 tracking-tight">
			{data.video.title?.arabic || 'فيديو'}
		</h1>
        <h2 class="text-lg sm:text-xl text-text-200 mb-2">
			{data.video.title?.english || 'Video'}
		</h2>
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
		</div>
		
		<div class="flex justify-between items-center mb-4">
			<Button 
				onClick={previousLine} 
				disabled={currentLineIndex === 0}
				type="button"
			>
				Previous
			</Button>
			
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
			
			<Button 
				onClick={nextLine} 
				disabled={currentLineIndex >= (data.video.lines?.length || 1) - 1}
				type="button"
			>
				Next
			</Button>
		</div>
	</div>

	<!-- Current Line Display -->
	{#if data.video.lines && data.video.lines[currentLineIndex]}
		{@const currentLine = data.video.lines[currentLineIndex]}
			{@const transformedCurrentSentence = {
				arabic: { text: currentLine.arabic?.text || '', speaker: '' },
				english: { text: currentLine.english?.text || '', speaker: '' },
				transliteration: { text: currentLine.transliteration?.text || '', speaker: '' }
			}}
			
			<div class="bg-tile-400 border border-tile-600 p-6 mb-6 shadow-lg">
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-lg font-bold text-text-300">Current Line</h3>
					<p class="text-xs text-text-200 opacity-70">
						Time: {currentLine.start}s - {(parseFloat(currentLine.start) + parseFloat(currentLine.dur)).toFixed(2)}s
					</p>
				</div>

				<div class="bg-tile-300 border border-tile-500 rounded-lg overflow-hidden">
					{#if showTransliteration}
						<Sentence 
							sentence={transformedCurrentSentence}
							type="transliteration"
							{setActiveWord}
							index={currentLineIndex}
							mode="CurrentView"
							dialect="egyptian-arabic"
							classname="!border-0 !py-4 !px-6"
						/>
				{/if}

					<Sentence 
						sentence={transformedCurrentSentence}
						type="arabic"
						{setActiveWord}
						index={currentLineIndex}
						mode="CurrentView"
						dialect="egyptian-arabic"
						classname="!border-0 !py-4 !px-6"
					/>
					
					{#if showEnglish}
						<Sentence 
							sentence={transformedCurrentSentence}
							type="english"
							{setActiveWord}
							index={currentLineIndex}
							mode="CurrentView"
							dialect="egyptian-arabic"
							classname="!border-0 !py-4 !px-6"
						/>
				{/if}
			</div>
		</div>
	{/if}

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
							class="cursor-pointer hover:bg-tile-300 transition-all duration-300 rounded-lg {
								currentLineIndex === index 
									? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-[1.02]' 
									: 'hover:shadow-md'
							}"
						onclick={() => goToLine(index)}
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
											dialect="egyptian-arabic"
											classname="!border-0 !py-2 !px-0"
										/>
									{/if}
									
									<Sentence 
										sentence={transformedSentence}
										type="arabic"
										{setActiveWord}
										index={index}
										mode="SentenceView"
										dialect="egyptian-arabic"
										classname="!border-0 !py-2 !px-0"
									/>
									
								{#if showEnglish}
										<Sentence 
											sentence={transformedSentence}
											type="english"
											{setActiveWord}
											index={index}
											mode="SentenceView"
											dialect="egyptian-arabic"
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
		
		<!-- Active Word Definition -->
		{#if activeWord.arabic || activeWord.description || activeWord.isLoading}
			<div class="bg-tile-400 border border-tile-600 p-6 shadow-lg mb-6">
				<h3 class="text-lg font-bold text-text-300 mb-4">Word Definition</h3>
				
				{#if activeWord.isLoading}
					<div class="flex items-center gap-2">
						<div role="status">
							<svg
								aria-hidden="true"
								class="h-[24px] w-[24px] animate-spin fill-tile-300 text-text-200"
								viewBox="0 0 100 101"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
									fill="currentColor"
								/>
								<path
									d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
									fill="currentFill"
								/>
							</svg>
							<span class="sr-only">Loading...</span>
						</div>
						<span class="text-text-200">Loading definition...</span>
					</div>
				{:else}
					<div class="bg-tile-300 border border-tile-500 p-4 space-y-3">
						{#if activeWord.arabic}
							<div>
								<h4 class="text-sm font-bold text-text-200 mb-1">Word</h4>
								<p class="text-2xl text-text-300 font-medium">{activeWord.arabic}</p>
							</div>
						{/if}
						
						{#if activeWord.description}
							<div>
								<h4 class="text-sm font-bold text-text-200 mb-1">Definition</h4>
								<p class="text-text-200 leading-relaxed">{activeWord.description}</p>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
