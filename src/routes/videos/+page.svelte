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
      'egyptian-arabic': 'bg-blue-100 text-blue-800',
      'levantine': 'bg-orange-100 text-orange-800',
      'darija': 'bg-green-100 text-green-800',
      'fusha': 'bg-purple-100 text-purple-800',
    };
    return colors[dialect as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }
</script>

<div class="px-3 mt-6 sm:px-8 max-w-7xl mx-auto">
  <div class="text-left mb-6">
    <h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-1 tracking-tight">
      Videos
    </h1>
    <p class="text-text-200 text-lg sm:text-xl leading-snug mb-4">
      Interactive Arabic videos with transcripts, translations, and transliterations from all dialects.
    </p>
    <VideoUploadModal {data} />
  </div>

  <!-- Search and Filter Controls -->
  <div class="mb-6 space-y-4">
    <!-- Search Bar -->
    <div class="relative">
      <input
        type="text"
        placeholder="Search videos by title or description..."
        bind:value={searchQuery}
        class="w-full pl-10 pr-4 py-3 border border-tile-500 bg-tile-300 text-text-300 rounded-lg focus:outline-none focus:border-tile-600 focus:ring-1 focus:ring-tile-600"
      />
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-text-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>

    <!-- Filters and Sort -->
    <div class="flex flex-col sm:flex-row gap-4">
      <!-- Dialect Filter -->
      <div class="flex-1">
        <label for="dialect-filter" class="block text-sm font-medium text-text-200 mb-2">Filter by Dialect</label>
        <select
          id="dialect-filter"
          bind:value={selectedDialect}
          class="w-full px-4 py-2.5 border border-tile-500 bg-tile-300 text-text-300 rounded-lg focus:outline-none focus:border-tile-600 focus:ring-1 focus:ring-tile-600 cursor-pointer"
        >
          {#each dialectOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <!-- Sort -->
      <div class="flex-1">
        <label for="sort-filter" class="block text-sm font-medium text-text-200 mb-2">Sort By</label>
        <select
          id="sort-filter"
          bind:value={sortBy}
          class="w-full px-4 py-2.5 border border-tile-500 bg-tile-300 text-text-300 rounded-lg focus:outline-none focus:border-tile-600 focus:ring-1 focus:ring-tile-600 cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="title">Title (A-Z)</option>
        </select>
      </div>
    </div>

    <!-- Results Count -->
    <div class="text-sm text-text-200">
      Showing {filteredAndSortedVideos.length} of {data.videos.length} videos
    </div>
  </div>

  {#if data.videos.length === 0}
    <div class="text-center py-12">
      <p class="text-xl text-text-200">No videos available yet.</p>
      <p class="text-text-200 mt-2">Be the first to upload a video!</p>
    </div>
  {:else if filteredAndSortedVideos.length === 0}
    <div class="text-center py-12">
      <p class="text-xl text-text-200">No videos found matching your criteria.</p>
      <p class="text-text-200 mt-2">Try adjusting your search or filters.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredAndSortedVideos as video}
        <button 
          onclick={() => goto(`/video/${video.id}`)}
          class="group bg-tile-400 border-2 border-tile-600 shadow-lg hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 transform"
        >
          <div class="relative">
            <img 
              src={video.thumbnail_url} 
              alt={video.title} 
              class="w-full h-48 object-cover" 
            />
            <!-- Play button overlay -->
            <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-300">
              <div class="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center group-hover:bg-opacity-100 transition-all duration-300">
                <svg class="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div class="p-4 text-left">
            <div class="flex flex-col gap-2 mb-3">
              <h3 class="text-lg font-bold text-text-300 group-hover:text-text-200 transition-colors duration-300 line-clamp-2">
                {video.title}
              </h3>
              <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full w-fit {getDialectBadgeColor(video.dialect)}">
                {video.dialect_name}
              </span>
            </div>
            
            {#if video.description}
              <p class="text-sm text-text-200 opacity-90 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2 mb-2">
                {video.description}
              </p>
            {/if}
            
            <p class="text-xs text-text-200 opacity-75">
              {new Date(video.created_at).toLocaleDateString()}
            </p>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
