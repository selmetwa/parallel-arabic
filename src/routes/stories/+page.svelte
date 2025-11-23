<script lang="ts">
	import { stories } from '$lib/constants/stories';
	import PaywallModal from '$lib/components/PaywallModal.svelte';
	import CreateStoryModal from '$lib/components/dialect-shared/story/components/CreateStoryModal.svelte';
	import { BLOCKED_STORY_IDS } from '$lib/constants/stories/blocked';

	let { data } = $props();
	let isModalOpen = $state(false);
	let selectedDialect = $state('egyptian-arabic');

	// Function to filter out incomplete sentences
	function filterValidSentences(sentences: any[]) {
		if (!Array.isArray(sentences)) return [];
		return sentences.filter(sentence => 
			sentence && 
			sentence.arabic?.text && 
			sentence.english?.text && 
			sentence.transliteration?.text &&
			typeof sentence.arabic.text === 'string' &&
			typeof sentence.english.text === 'string' &&
			typeof sentence.transliteration.text === 'string' &&
			sentence.arabic.text.trim() !== '' &&
			sentence.english.text.trim() !== '' &&
			sentence.transliteration.text.trim() !== ''
		);
	}

	let userGeneratedStories = $derived.by(() => {
		const output = []

		for (const story of data.user_generated_stories) {
			const storyBody = story.story_body

			if (BLOCKED_STORY_IDS.includes(story.id)) {
				continue
			}

			// Filter valid sentences and get the count
			const validSentences = filterValidSentences(storyBody?.sentences || []);

			output.push({
				id: story.id,
				title: `${storyBody?.title?.english || ''} / ${storyBody?.title?.arabic || ''}`,
				description: story.description,
				createdAt: story.created_at,
				difficulty: story.difficulty,
				dialect: story.dialect,
				dialectName: story.dialect_name,
				length: validSentences.length
			})
		}
		return output
	})

	function openPaywallModal() {
		isModalOpen = true;
	}

	function handleCloseModal() {
		isModalOpen = false;
	}

	const dialectOptions = [
		{ value: 'egyptian-arabic', label: 'Egyptian Arabic' },
		{ value: 'fusha', label: 'Modern Standard Arabic' },
		{ value: 'levantine', label: 'Levantine Arabic' },
		{ value: 'darija', label: 'Moroccan Darija' },
	];

	// Get dialect badge color
	function getDialectBadgeColor(dialect: string) {
		const colors = {
			'egyptian-arabic': 'bg-tile-500 text-text-300',
			'levantine': 'bg-orange-100 text-orange-800',
			'darija': 'bg-green-100 text-green-800',
			'fusha': 'bg-purple-100 text-purple-800',
		};
		return colors[dialect as keyof typeof colors] || 'bg-gray-100 text-gray-800';
	}
</script>

<PaywallModal isOpen={isModalOpen} {handleCloseModal}></PaywallModal>

<section class="px-4 mt-12 sm:px-8 max-w-7xl mx-auto mb-20">
	<div class="text-left mb-12">
		<h1 class="text-4xl sm:text-5xl text-text-300 font-bold mb-4 tracking-tight">Stories</h1>
		<p class="text-text-200 text-lg sm:text-xl leading-relaxed opacity-90 max-w-3xl">Improve your Arabic reading and listening comprehension skills with stories from all dialects.</p>
		
		<!-- Dialect Selection for Story Creation -->
		<div class="mt-8 p-6 bg-tile-400/50 border border-tile-500 rounded-xl inline-block">
			<h3 class="text-lg font-bold text-text-300 mb-4">Create a New Story</h3>
			<div class="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
				<div class="flex flex-col gap-2">
					<label for="dialect-select" class="text-sm text-text-200 font-medium">Choose dialect:</label>
					<div class="relative">
						<select 
							id="dialect-select"
							bind:value={selectedDialect}
							class="appearance-none pl-4 pr-10 py-2.5 border border-tile-500 bg-tile-300 text-text-300 rounded-lg focus:outline-none focus:border-tile-600 focus:ring-1 focus:ring-tile-600 min-w-[200px] cursor-pointer"
						>
							{#each dialectOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-300">
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
							</svg>
						</div>
					</div>
				</div>
				<div class="flex-shrink-0">
					<CreateStoryModal dialect={selectedDialect as any} data={data}></CreateStoryModal>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Static Stories Section -->
	<div class="mb-16">
		<div class="flex items-center gap-4 mb-8">
			<h2 class="text-2xl sm:text-3xl text-text-300 font-bold">Featured Stories</h2>
			<div class="h-0.5 bg-tile-500 flex-1 opacity-50 rounded-full"></div>
		</div>
		
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each Object.entries(stories) as [key, value]}
				{#if value.isPaywalled && !data.hasActiveSubscription}
					<button onclick={openPaywallModal} class="group flex flex-col bg-tile-400 border-2 border-tile-600 rounded-xl p-8 shadow-lg hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 hover:-translate-y-1 text-left w-full h-full">
						<div class="flex justify-between items-start mb-4">
							<div class="text-4xl">🔒</div>
							<span class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-tile-500 text-text-300">
								Egyptian Arabic
							</span>
						</div>
						
						<h3 class="text-2xl font-bold text-text-300 mb-3 group-hover:text-text-200 transition-colors leading-tight">
							{value.story.title.english} / {value.story.title.arabic}
						</h3>

						<p class="text-text-200 text-base leading-relaxed opacity-90 group-hover:opacity-100 mb-4 line-clamp-3 flex-grow">
							{value.description}
						</p>
						
						<div class="flex items-center gap-4 pt-4 border-t border-tile-500/50 mt-auto text-sm text-text-200 font-medium opacity-80">
							<div class="flex items-center gap-1.5">
								<span>📝</span>
								<span>{value.story.sentences.length} Sentences</span>
							</div>
						</div>
					</button>
				{:else}
					<a href={`/egyptian-arabic/stories/${key}`} class="group flex flex-col bg-tile-400 border-2 border-tile-600 rounded-xl p-8 shadow-lg hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 hover:-translate-y-1">
						<div class="flex justify-between items-start mb-4">
							<div class="text-4xl">📖</div>
							<span class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-tile-500 text-text-300">
								Egyptian Arabic
							</span>
						</div>
						
						<h3 class="text-2xl font-bold text-text-300 mb-3 group-hover:text-text-200 transition-colors leading-tight">
							{value.story.title.english} / {value.story.title.arabic}
						</h3>

						<p class="text-text-200 text-base leading-relaxed opacity-90 group-hover:opacity-100 mb-4 line-clamp-3 flex-grow">
							{value.description}
						</p>
						
						<div class="flex items-center gap-4 pt-4 border-t border-tile-500/50 mt-auto text-sm text-text-200 font-medium opacity-80">
							<div class="flex items-center gap-1.5">
								<span>📝</span>
								<span>{value.story.sentences.length} Sentences</span>
							</div>
						</div>
					</a>
				{/if}
			{/each}
		</div>
	</div>
	
	<!-- User Generated Stories -->
	<div>
		<div class="flex items-center gap-4 mb-8">
			<h2 class="text-2xl sm:text-3xl text-text-300 font-bold">Community Stories</h2>
			<div class="h-0.5 bg-tile-500 flex-1 opacity-50 rounded-full"></div>
		</div>
		
		{#if userGeneratedStories.length === 0}
			<div class="text-center py-16 bg-tile-400/30 border-2 border-dashed border-tile-500 rounded-xl">
				<div class="text-6xl mb-4 opacity-50">✍️</div>
				<p class="text-text-200 text-xl mb-2">No community stories yet</p>
				<p class="text-text-200 text-base opacity-70">Be the first to create one!</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each userGeneratedStories as story}
					<a href={`/generated_story/${story.id}`} class="group flex flex-col bg-tile-400 border-2 border-tile-600 rounded-xl p-8 shadow-lg hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 hover:-translate-y-1">
						<div class="flex justify-between items-start mb-4">
							<div class="text-4xl">✨</div>
							<div class="flex flex-col gap-1 items-end">
								<span class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full {getDialectBadgeColor(story.dialect)}">
									{story.dialectName}
								</span>
								{#if story.difficulty}
									<span class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-tile-300 text-text-200 border border-tile-500">
										{story.difficulty.toUpperCase()}
									</span>
								{/if}
							</div>
						</div>
						
						<h3 class="text-2xl font-bold text-text-300 mb-3 group-hover:text-text-200 transition-colors leading-tight line-clamp-2">
							{story.title}
						</h3>
						
						<div class="flex-grow"></div>
						
						<div class="flex items-center gap-4 pt-4 border-t border-tile-500/50 mt-4 text-sm text-text-200 font-medium opacity-80">
							<div class="flex items-center gap-1.5">
								<span>📝</span>
								<span>{story.length} Sentences</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</section>