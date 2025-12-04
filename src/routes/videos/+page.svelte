<script lang="ts">
	import { goto } from '$app/navigation';
	import VideoUploadModal from '$lib/components/VideoUploadModal.svelte';

	let { data } = $props();

	let searchQuery = $state('');
	let selectedDialect = $state<string>('all');
	let sortBy = $state<'newest' | 'oldest' | 'title'>('newest');

	const dialectOptions = [
		{ value: 'all', label: 'All Dialects' },
		{ value: 'egyptian-arabic', label: 'Egyptian Arabic' },
		{ value: 'levantine', label: 'Levantine Arabic' },
		{ value: 'darija', label: 'Moroccan Darija' },
		{ value: 'fusha', label: 'Modern Standard Arabic' },
	];

	const filteredAndSortedVideos = $derived.by(() => {
		let filtered = [...data.videos];

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(video =>
				video.title?.toLowerCase().includes(query) ||
				video.description?.toLowerCase().includes(query)
			);
		}

		// Filter by dialect
		if (selectedDialect !== 'all') {
			filtered = filtered.filter(video => video.dialect === selectedDialect);
		}

		// Sort
		if (sortBy === 'newest') {
			filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
		} else if (sortBy === 'oldest') {
			filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
		} else if (sortBy === 'title') {
			filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
		}

		return filtered;
	});

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
</script>

<section class="min-h-screen bg-tile-200">
	<!-- Hero Section -->
	<header class="py-12 sm:py-16 border-b border-tile-600">
		<div class="max-w-7xl mx-auto px-3 sm:px-8">
			<div class="text-center max-w-3xl mx-auto">
				<div class="text-6xl mb-6">🎬</div>
				<h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-300 leading-tight mb-6">
					Interactive Arabic Videos
				</h1>
				<p class="text-lg sm:text-xl text-text-200 leading-relaxed mb-8">
					Watch native Arabic content with synchronized transcripts, translations, and transliterations. 
					Click any word for instant definitions.
				</p>
				<VideoUploadModal {data} />
			</div>
		</div>
	</header>

	<!-- Search and Filter Section -->
	<section class="py-8 bg-tile-300 border-b border-tile-600">
		<div class="max-w-7xl mx-auto px-3 sm:px-8">
			<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 shadow-lg">
				<!-- Search Bar -->
				<div class="relative mb-6">
					<input
						type="text"
						placeholder="Search videos by title or description..."
						bind:value={searchQuery}
						class="w-full pl-12 pr-4 py-4 border-2 border-tile-500 bg-tile-300 text-text-300 rounded-lg focus:outline-none focus:border-tile-700 focus:ring-2 focus:ring-tile-600/50 text-lg"
					/>
					<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
						<svg class="h-6 w-6 text-text-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</div>
				</div>

				<!-- Filters and Sort -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<!-- Dialect Filter -->
					<div>
						<label for="dialect-filter" class="block text-sm font-semibold text-text-300 mb-2">Filter by Dialect</label>
						<select
							id="dialect-filter"
							bind:value={selectedDialect}
							class="w-full px-4 py-3 border-2 border-tile-500 bg-tile-300 text-text-300 rounded-lg focus:outline-none focus:border-tile-700 focus:ring-2 focus:ring-tile-600/50 cursor-pointer font-medium"
						>
							{#each dialectOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>

					<!-- Sort -->
					<div>
						<label for="sort-filter" class="block text-sm font-semibold text-text-300 mb-2">Sort By</label>
						<select
							id="sort-filter"
							bind:value={sortBy}
							class="w-full px-4 py-3 border-2 border-tile-500 bg-tile-300 text-text-300 rounded-lg focus:outline-none focus:border-tile-700 focus:ring-2 focus:ring-tile-600/50 cursor-pointer font-medium"
						>
							<option value="newest">Newest First</option>
							<option value="oldest">Oldest First</option>
							<option value="title">Title (A-Z)</option>
						</select>
					</div>
				</div>

				<!-- Results Count -->
				<div class="mt-4 text-sm text-text-200 font-medium">
					Showing {filteredAndSortedVideos.length} of {data.videos.length} videos
				</div>
			</div>
		</div>
	</section>

	<!-- Videos Grid Section -->
	<section class="py-12 sm:py-16">
		<div class="max-w-7xl mx-auto px-3 sm:px-8">
			{#if data.videos.length === 0}
				<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-12 shadow-lg text-center">
					<div class="text-6xl mb-4">📹</div>
					<p class="text-xl text-text-300 font-semibold mb-2">No videos available yet</p>
					<p class="text-text-200">Be the first to upload a video and help others learn Arabic!</p>
				</div>
			{:else if filteredAndSortedVideos.length === 0}
				<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-12 shadow-lg text-center">
					<div class="text-6xl mb-4">🔍</div>
					<p class="text-xl text-text-300 font-semibold mb-2">No videos found</p>
					<p class="text-text-200">Try adjusting your search or filters to find what you're looking for.</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each filteredAndSortedVideos as video}
						<button 
							onclick={() => goto(`/video/${video.id}`)}
							class="group bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden hover:border-tile-500 transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 transform text-left"
						>
							<!-- Thumbnail -->
							<div class="relative">
								<img 
									src={video.thumbnail_url} 
									alt={video.title} 
									class="w-full h-48 object-cover" 
								/>
								<!-- Play button overlay -->
								<div class="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-all duration-300">
									<div class="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-300 shadow-lg">
										<svg class="w-7 h-7 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
											<path d="M8 5v14l11-7z"/>
										</svg>
									</div>
								</div>
								<!-- Dialect Badge -->
								<div class="absolute top-3 left-3">
									<span class="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full shadow-md {getDialectBadgeColor(video.dialect)}">
										{video.dialect_name}
									</span>
								</div>
							</div>
							
							<!-- Content -->
							<div class="p-5">
								<h3 class="text-lg font-bold text-text-300 group-hover:text-text-200 transition-colors duration-300 line-clamp-2 mb-3">
									{video.title}
								</h3>
								
								{#if video.description}
									<p class="text-sm text-text-200 line-clamp-2 mb-4 leading-relaxed">
										{video.description}
									</p>
								{/if}
								
								<div class="flex items-center justify-between text-xs text-text-200">
									<span class="flex items-center gap-1">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
										{new Date(video.created_at).toLocaleDateString()}
									</span>
									<span class="flex items-center gap-1 text-tile-700 font-semibold group-hover:text-text-300 transition-colors">
										Watch
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
										</svg>
									</span>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	<!-- Features Section -->
	<section class="py-12 sm:py-16 bg-tile-200 border-t border-tile-600">
		<div class="max-w-7xl mx-auto px-3 sm:px-8">
			<h2 class="text-2xl sm:text-3xl font-bold text-text-300 text-center mb-8">Why Learn with Videos?</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 shadow-lg text-center">
					<div class="text-4xl mb-4">📝</div>
					<h3 class="text-xl font-bold text-text-300 mb-3">Synced Transcripts</h3>
					<p class="text-text-200 leading-relaxed">
						Follow along with Arabic, English translations, and transliterations that highlight in sync with the video.
					</p>
				</div>

				<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 shadow-lg text-center">
					<div class="text-4xl mb-4">📖</div>
					<h3 class="text-xl font-bold text-text-300 mb-3">Instant Definitions</h3>
					<p class="text-text-200 leading-relaxed">
						Click any word in the transcript to get AI-powered definitions and explanations instantly.
					</p>
				</div>

				<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 shadow-lg text-center">
					<div class="text-4xl mb-4">🌍</div>
					<h3 class="text-xl font-bold text-text-300 mb-3">Multiple Dialects</h3>
					<p class="text-text-200 leading-relaxed">
						Content in Egyptian, Levantine, Moroccan, and Modern Standard Arabic to match your learning goals.
					</p>
				</div>
			</div>
		</div>
	</section>
</section>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
