<script lang="ts">
	import { letters } from '$lib/constants/alphabet';
	import Draw from '../components/Draw.svelte';
	import { updateUrl } from '$lib/helpers/update-url';

	let index = $state((() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const urlIndex = parseInt(params.get('letter') ?? '0') || 0;
			return Math.min(Math.max(urlIndex - 1, 0), (letters.length ?? 1) - 1);
		}
		return 0;
	})());

	const lettersCopy = [...letters];

	let letter = $derived(lettersCopy[index]);

	function handleNext() {
		index += 1;
		updateUrl('letter', (index + 1).toString());
	}

	function handlePrevious() {
		index -= 1;
		updateUrl('letter', (index + 1).toString());
	}

	function goToLetter(i: number) {
		index = i;
		updateUrl('letter', (index + 1).toString());
	}
</script>

<section class="min-h-screen bg-tile-200">
	<!-- Header with Navigation -->
	<header class="border-b border-tile-600 sticky top-0 bg-tile-200 z-10">
		<div class="max-w-6xl mx-auto px-3 sm:px-8 py-4">
			<div class="flex items-center justify-between">
				<a href="/alphabet/practice" class="flex items-center gap-2 text-text-200 hover:text-text-300 transition-colors">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
					</svg>
					<span class="font-medium hidden sm:inline">Back to Practice</span>
				</a>
				
				<div class="flex items-center gap-4">
					<div class="flex items-center gap-2 px-3 py-1.5 bg-tile-400 border border-tile-600 rounded-full">
						<span class="text-sm">✏️</span>
						<span class="text-sm text-text-200 font-medium">Handwriting Practice</span>
					</div>
				</div>

				<div class="flex items-center gap-2 text-text-200">
					<span class="text-sm font-medium">{index + 1}</span>
					<span class="text-sm">/</span>
					<span class="text-sm">{lettersCopy.length}</span>
				</div>
			</div>
		</div>
	</header>

	<!-- Progress Bar -->
	<div class="h-1 bg-tile-400">
		<div 
			class="h-full bg-green-500 transition-all duration-300"
			style="width: {((index + 1) / lettersCopy.length) * 100}%"
		></div>
	</div>

	<!-- Main Content -->
	<div class="py-6 sm:py-10">
		<div class="max-w-4xl mx-auto px-3 sm:px-8">
			<!-- Current Letter Info -->
			<div class="mb-6 text-center">
				<h1 class="text-2xl sm:text-3xl font-bold text-text-300 mb-2">
					Draw: <span class="text-4xl sm:text-5xl mx-2">{letter.isolated}</span> ({letter.name})
				</h1>
				<p class="text-text-200">Trace or freehand draw the letter on the canvas below</p>
			</div>

			<!-- Draw Component -->
			<div class="bg-tile-400 border-2 border-tile-600 rounded-xl shadow-lg p-4 sm:p-6">
				<Draw {letter} />
			</div>

			<!-- Tips -->
			<div class="mt-6 flex flex-wrap gap-3 justify-center">
				<div class="flex items-center gap-2 px-3 py-1.5 bg-tile-400 border border-tile-600 rounded-full text-sm text-text-200">
					<span>💡</span>
					<span>Use your finger or stylus to draw</span>
				</div>
				<div class="flex items-center gap-2 px-3 py-1.5 bg-tile-400 border border-tile-600 rounded-full text-sm text-text-200">
					<span>🔄</span>
					<span>Tap clear to start over</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Bottom Navigation -->
	<footer class="border-t border-tile-600 sticky bottom-0 bg-tile-300">
		<div class="max-w-4xl mx-auto px-3 sm:px-8 py-4">
			<div class="flex items-center justify-between">
				<div>
					{#if index > 0}
						<button
							onclick={handlePrevious}
							class="flex items-center gap-2 px-4 py-2.5 bg-tile-400 border-2 border-tile-600 text-text-300 font-medium rounded-lg hover:bg-tile-500 transition-colors"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
							<span class="hidden sm:inline">Previous</span>
						</button>
					{:else}
						<div></div>
					{/if}
				</div>
				
				<!-- Quick Letter Jump (scrollable on mobile) -->
				<div class="hidden md:flex items-center gap-1 overflow-x-auto max-w-[50%] px-2" dir="rtl">
					{#each lettersCopy.slice(0, 10) as l, i}
						<button
							onclick={() => goToLetter(i)}
							class="w-8 h-8 flex-shrink-0 rounded-lg text-lg flex items-center justify-center transition-all {index === i ? 'bg-tile-600 text-text-300' : 'text-text-200 hover:bg-tile-400'}"
						>
							{l.isolated}
						</button>
					{/each}
					{#if lettersCopy.length > 10}
						<span class="text-text-200 text-sm px-1">...</span>
					{/if}
				</div>

				<div>
					{#if index < lettersCopy.length - 1}
						<button
							onclick={handleNext}
							class="flex items-center gap-2 px-4 py-2.5 bg-tile-600 border-2 border-tile-600 text-text-300 font-medium rounded-lg hover:bg-tile-700 transition-colors shadow-md"
						>
							<span class="hidden sm:inline">Next</span>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
							</svg>
						</button>
					{:else}
						<a
							href="/alphabet/practice/keyboard"
							class="flex items-center gap-2 px-4 py-2.5 bg-green-600 border-2 border-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-md"
						>
							<span class="hidden sm:inline">Try Keyboard</span>
							<span class="sm:hidden">Done</span>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
						</a>
					{/if}
				</div>
			</div>
		</div>
	</footer>
</section>
