<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import cn from 'classnames';

	let { data } = $props();

	interface YouTubeShort {
		id: string;
		title: string;
		channelTitle: string;
		thumbnail: string;
		publishedAt: string;
	}

	let shorts = $state<YouTubeShort[]>(data.initialShorts || []);
	let currentIndex = $state(0);
	let selectedDialect = $state(data.initialDialect || 'egyptian-arabic');
	let nextPageToken = $state(data.nextPageToken);
	let isLoading = $state(false);
	let error = $state<string | null>(data.error);
	let viewTracked = $state<Set<string>>(new Set());
	let viewTimer: ReturnType<typeof setTimeout> | null = null;

	// Paywall state
	let totalViewsInSession = $state(0);
	let showPaywall = $state(data.hasReachedLimit || false);
	const isSubscribed = data.isSubscribed;
	const freeLimit = data.freeLimit;
	
	// Derived: remaining free views (accounting for session views)
	let remainingFreeViews = $derived(
		isSubscribed ? Infinity : Math.max(0, freeLimit - (data.totalShortsViewed + totalViewsInSession))
	);

	// Only Egyptian for now - more dialects coming soon
	const dialectOptions = [
		{ value: 'egyptian-arabic', label: 'Egyptian', emoji: '🇪🇬', color: 'bg-blue-600', available: true },
		{ value: 'levantine', label: 'Levantine', emoji: '🇱🇧', color: 'bg-orange-600', available: false },
		{ value: 'darija', label: 'Darija', emoji: '🇲🇦', color: 'bg-green-600', available: false },
		{ value: 'fusha', label: 'MSA', emoji: '📚', color: 'bg-purple-600', available: false },
		{ value: 'khaleeji', label: 'Khaleeji', emoji: '🇦🇪', color: 'bg-amber-600', available: false }
	];

	async function fetchShorts(dialect: string, skipCache = false) {
		isLoading = true;
		error = null;
		
		try {
			const params = new URLSearchParams({ dialect });
			if (skipCache) params.set('skipCache', 'true');
			
			const response = await fetch(`/api/youtube-shorts?${params}`);
			const result = await response.json();
			
			if (!response.ok) {
				throw new Error(result.error || 'Failed to fetch shorts');
			}
			
			shorts = result.shorts || [];
			nextPageToken = result.nextPageToken;
			currentIndex = 0;
			viewTracked = new Set();
		} catch (err) {
			console.error('Error fetching shorts:', err);
			error = err instanceof Error ? err.message : 'Failed to load shorts';
		} finally {
			isLoading = false;
		}
	}

	function handleDialectChange(dialect: string, available: boolean) {
		if (!available || dialect === selectedDialect) return;
		selectedDialect = dialect;
		fetchShorts(dialect);
	}

	function scrollToIndex(index: number) {
		if (index < 0 || index >= shorts.length || isLoading) return;
		currentIndex = index;
		startViewTimer();
	}

	/**
	 * Track view after user watches for 3 seconds
	 */
	function startViewTimer() {
		if (viewTimer) {
			clearTimeout(viewTimer);
		}
		
		// Don't start timer if paywall is shown
		if (showPaywall) return;
		
		const currentShort = shorts[currentIndex];
		if (!currentShort || viewTracked.has(currentShort.id)) return;
		
		viewTimer = setTimeout(async () => {
			if (currentShort && !viewTracked.has(currentShort.id)) {
				viewTracked.add(currentShort.id);
				viewTracked = new Set(viewTracked); // Trigger reactivity
				
				// Track the view
				try {
					const response = await fetch('/api/track-short-view', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ count: 1 })
					});
					
					const result = await response.json();
					
					// Update session view count
					totalViewsInSession++;
					
					// Check if limit reached
					if (!isSubscribed && result.limitReached) {
						showPaywall = true;
					}
				} catch (err) {
					console.error('Failed to track view:', err);
				}
			}
		}, 3000);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown' || e.key === 'j') {
			e.preventDefault();
			scrollToIndex(currentIndex + 1);
		} else if (e.key === 'ArrowUp' || e.key === 'k') {
			e.preventDefault();
			scrollToIndex(currentIndex - 1);
		}
	}

	let lastWheelTime = 0;
	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		
		// Debounce wheel events
		const now = Date.now();
		if (now - lastWheelTime < 300) return;
		lastWheelTime = now;
		
		if (e.deltaY > 30) {
			scrollToIndex(currentIndex + 1);
		} else if (e.deltaY < -30) {
			scrollToIndex(currentIndex - 1);
		}
	}

	let touchStartY = 0;
	let touchStartTime = 0;
	
	function handleTouchStart(e: TouchEvent) {
		touchStartY = e.touches[0].clientY;
		touchStartTime = Date.now();
	}

	function handleTouchEnd(e: TouchEvent) {
		const touchEndY = e.changedTouches[0].clientY;
		const diff = touchStartY - touchEndY;
		const timeDiff = Date.now() - touchStartTime;
		
		// Only register swipe if it's fast enough and long enough
		if (timeDiff < 500 && Math.abs(diff) > 50) {
			if (diff > 0) {
				scrollToIndex(currentIndex + 1);
			} else {
				scrollToIndex(currentIndex - 1);
			}
		}
	}

	function refresh() {
		fetchShorts(selectedDialect, true);
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		startViewTimer();
		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});

	onDestroy(() => {
		if (viewTimer) {
			clearTimeout(viewTimer);
		}
	});
</script>

<svelte:head>
	<title>Arabic Shorts | Learn Arabic</title>
	<meta name="description" content="Learn Arabic through short-form video content in your target dialect" />
</svelte:head>

<div class="fixed inset-0 bg-gray-950 flex flex-col z-50">
	<!-- Header with dialect selector -->
	<header class="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/90 via-black/60 to-transparent">
		<div class="flex items-center justify-between p-4 max-w-2xl mx-auto">
			<div class="flex items-center gap-3">
				<a 
					href="/" 
					class="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-all"
					aria-label="Go back home"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
				</a>
				<div>
					<h1 class="text-white font-bold text-lg">Arabic Shorts</h1>
					<p class="text-white/60 text-xs">Swipe to learn</p>
				</div>
			</div>
			
			<button
				onclick={refresh}
				disabled={isLoading}
				class="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-all disabled:opacity-50"
				aria-label="Refresh shorts"
			>
				<svg class={cn("w-5 h-5", isLoading && "animate-spin")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
			</button>
		</div>
		
		<!-- Dialect pills -->
		<div class="flex flex-col items-center gap-2 px-4 pb-4 max-w-2xl mx-auto">
			<div class="flex gap-2 overflow-x-auto scrollbar-hide">
				{#each dialectOptions as option}
					<button
						onclick={() => handleDialectChange(option.value, option.available)}
						disabled={isLoading || !option.available}
						class={cn(
							"flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
							!option.available
								? "bg-white/5 text-white/30 cursor-not-allowed"
								: selectedDialect === option.value
									? `${option.color} text-white shadow-lg`
									: "bg-white/15 text-white/80 hover:bg-white/25"
						)}
						title={!option.available ? "Coming soon!" : option.label}
					>
						<span>{option.emoji}</span>
						<span>{option.label}</span>
						{#if !option.available}
							<span class="text-[10px] opacity-60">🔒</span>
						{/if}
					</button>
				{/each}
			</div>
			<p class="text-white/40 text-xs">More dialects coming soon!</p>
		</div>
	</header>

	<!-- Main video container -->
	<div 
		class="flex-1 relative overflow-hidden"
		onwheel={handleWheel}
		ontouchstart={handleTouchStart}
		ontouchend={handleTouchEnd}
		role="application"
		aria-label="Video feed - use arrow keys or swipe to navigate"
	>
		{#if isLoading && shorts.length === 0}
			<!-- Loading state -->
			<div class="absolute inset-0 flex flex-col items-center justify-center gap-4">
				<div class="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
				<p class="text-white/70 text-lg">Loading shorts...</p>
			</div>
		{:else if error && shorts.length === 0}
			<!-- Error state -->
			<div class="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
				<div class="text-6xl">😕</div>
				<p class="text-white text-xl font-semibold">Couldn't load shorts</p>
				<p class="text-white/60">{error}</p>
				<button
					onclick={refresh}
					class="mt-4 px-6 py-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-all"
				>
					Try Again
				</button>
			</div>
		{:else if shorts.length === 0}
			<!-- Empty state -->
			<div class="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
				<div class="text-6xl">📹</div>
				<p class="text-white text-xl font-semibold">No shorts found</p>
				<p class="text-white/60">Try a different dialect or refresh</p>
				<button
					onclick={refresh}
					class="mt-4 px-6 py-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-all"
				>
					Refresh
				</button>
			</div>
		{:else}
			<!-- Video slides -->
			{#each shorts as short, index}
				<div 
					class={cn(
						"absolute inset-0 transition-transform duration-300 ease-out will-change-transform",
						index === currentIndex ? "translate-y-0 z-10" :
						index < currentIndex ? "-translate-y-full z-0" : "translate-y-full z-0"
					)}
				>
					<!-- Only load iframe for current and adjacent videos -->
					{#if Math.abs(index - currentIndex) <= 1}
						<iframe
							src={`https://www.youtube.com/embed/${short.id}?autoplay=${index === currentIndex ? 1 : 0}&loop=1&playlist=${short.id}&controls=1&modestbranding=1&rel=0&playsinline=1`}
							class="absolute inset-0 w-full h-full"
							frameborder="0"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowfullscreen
							title={short.title}
						></iframe>
					{:else}
						<!-- Placeholder thumbnail for non-adjacent videos -->
						<div class="absolute inset-0 bg-gray-900 flex items-center justify-center">
							<img 
								src={short.thumbnail} 
								alt={short.title}
								class="w-full h-full object-cover opacity-50"
							/>
						</div>
					{/if}
					
					<!-- Video info overlay -->
					<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pb-24 pointer-events-none">
						<div class="max-w-lg mx-auto">
							<p class="text-white font-semibold text-lg line-clamp-2 mb-2 drop-shadow-lg">
								{short.title}
							</p>
							<p class="text-white/70 text-sm flex items-center gap-2">
								<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
								</svg>
								{short.channelTitle}
							</p>
						</div>
					</div>
					
					<!-- Viewed indicator -->
					{#if viewTracked.has(short.id)}
						<div class="absolute top-24 right-4 bg-green-500/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
							<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
							<span>Watched</span>
						</div>
					{/if}
				</div>
			{/each}
		{/if}

		<!-- Loading overlay when fetching more -->
		{#if isLoading && shorts.length > 0}
			<div class="absolute inset-0 bg-black/30 flex items-center justify-center z-30">
				<div class="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
			</div>
		{/if}
	</div>

	<!-- Navigation dots (right side) -->
	{#if shorts.length > 0}
		<div class="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5">
			{#each shorts.slice(Math.max(0, currentIndex - 4), Math.min(shorts.length, currentIndex + 5)) as _, i}
				{@const actualIndex = Math.max(0, currentIndex - 4) + i}
				<button
					onclick={() => scrollToIndex(actualIndex)}
					class={cn(
						"w-2 rounded-full transition-all",
						actualIndex === currentIndex 
							? "h-8 bg-white" 
							: "h-2 bg-white/40 hover:bg-white/60"
					)}
					aria-label={`Go to video ${actualIndex + 1}`}
				></button>
			{/each}
		</div>
	{/if}

	<!-- Bottom navigation -->
	{#if shorts.length > 0}
		<div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
			<button
				onclick={() => scrollToIndex(currentIndex - 1)}
				disabled={currentIndex === 0}
				class="w-14 h-14 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/25 transition-all active:scale-95"
				aria-label="Previous video"
			>
				<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
				</svg>
			</button>
			
			<div class="px-4 py-2 bg-white/15 backdrop-blur rounded-full text-white text-sm font-medium">
				{currentIndex + 1} / {shorts.length}
			</div>
			
			<button
				onclick={() => scrollToIndex(currentIndex + 1)}
				disabled={currentIndex === shorts.length - 1}
				class="w-14 h-14 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/25 transition-all active:scale-95"
				aria-label="Next video"
			>
				<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>
		</div>
	{/if}

	<!-- Keyboard hints (desktop only) -->
	<div class="absolute bottom-6 left-4 z-20 hidden lg:flex flex-col gap-1 text-white/40 text-xs">
		<div class="flex items-center gap-2">
			<kbd class="px-1.5 py-0.5 bg-white/10 rounded text-white/60">↑</kbd>
			<kbd class="px-1.5 py-0.5 bg-white/10 rounded text-white/60">k</kbd>
			<span>Previous</span>
		</div>
		<div class="flex items-center gap-2">
			<kbd class="px-1.5 py-0.5 bg-white/10 rounded text-white/60">↓</kbd>
			<kbd class="px-1.5 py-0.5 bg-white/10 rounded text-white/60">j</kbd>
			<span>Next</span>
		</div>
	</div>

	<!-- Remaining views indicator (for free users) -->
	{#if !isSubscribed && remainingFreeViews > 0 && remainingFreeViews <= 3}
		<div class="absolute top-36 left-1/2 -translate-x-1/2 z-30">
			<div class="bg-amber-500/90 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
				</svg>
				{remainingFreeViews} free {remainingFreeViews === 1 ? 'video' : 'videos'} left
			</div>
		</div>
	{/if}

	<!-- Paywall Modal -->
	{#if showPaywall}
		<div class="absolute inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-6">
			<div class="max-w-md w-full bg-gradient-to-br from-tile-400 to-tile-500 rounded-2xl p-8 text-center border-2 border-tile-600 shadow-2xl">
				<!-- Icon -->
				<div class="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
					<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
				</div>
				
				<!-- Title -->
				<h2 class="text-2xl font-bold text-text-300 mb-3">
					You've Watched All Your Free Shorts!
				</h2>
				
				<!-- Subtitle -->
				<p class="text-text-200 mb-6">
					You've watched <span class="font-bold text-amber-400">{freeLimit} shorts</span>. 
					Subscribe to unlock unlimited access to Arabic learning content.
				</p>
				
				<!-- Features list -->
				<div class="bg-tile-300/50 rounded-lg p-4 mb-6 text-left">
					<p class="text-sm font-semibold text-text-300 mb-3">With a subscription you get:</p>
					<ul class="space-y-2 text-sm text-text-200">
						<li class="flex items-center gap-2">
							<svg class="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
							Unlimited Arabic Shorts
						</li>
						<li class="flex items-center gap-2">
							<svg class="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
							AI-powered conversations
						</li>
						<li class="flex items-center gap-2">
							<svg class="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
							Unlimited lessons & stories
						</li>
						<li class="flex items-center gap-2">
							<svg class="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
							Progress tracking & analytics
						</li>
					</ul>
				</div>
				
				<!-- CTA Buttons -->
				<div class="space-y-3">
					<a 
						href="/pricing"
						class="block w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
					>
						View Subscription Plans
					</a>
					<a 
						href="/"
						class="block w-full py-3 px-6 bg-tile-600 text-text-200 font-medium rounded-lg hover:bg-tile-700 transition-all"
					>
						Back to Home
					</a>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.border-3 {
		border-width: 3px;
	}
</style>

