<script lang="ts">
	import { goto } from '$app/navigation';
	import VideoUploadModal from '$lib/components/VideoUploadModal.svelte';
	import Button from '$lib/components/Button.svelte';
	let { data } = $props();

  // Get dialect badge color
  function getDialectBadgeColor(dialect: string) {
    const colors = {
      'egyptian-arabic': 'bg-blue-100 text-blue-800',
      'darija': 'bg-green-100 text-green-800',
      'fusha': 'bg-purple-100 text-purple-800',
      'levantine': 'bg-pink-100 text-pink-800',
      'iraqi': 'bg-yellow-100 text-yellow-800',
      'khaleeji': 'bg-indigo-100 text-indigo-800'
    };
    return colors[dialect as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  $inspect(data);
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

  {#if data.videos.length === 0}
    <div class="text-center py-12">
      <p class="text-xl text-text-200">No videos available yet.</p>
      <p class="text-text-200 mt-2">Be the first to upload a video!</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each data.videos as video}
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
{/if}


<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
