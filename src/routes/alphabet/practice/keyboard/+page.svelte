<script lang="ts">
	import { letters } from '$lib/constants/alphabet';
	import LetterBlock from './../components/LetterBlock.svelte';
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
						<span class="text-sm">⌨️</span>
						<span class="text-sm text-text-200 font-medium">Keyboard Practice</span>
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
	<div class="h-2 sm:h-1.5 bg-tile-400 relative overflow-hidden">
		<div
			class="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 ease-out relative shadow-lg shadow-green-500/50"
			style="width: {((index + 1) / lettersCopy.length) * 100}%"
		>
			<!-- Add shimmer effect -->
			<div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="py-6 sm:py-10">
		<div class="max-w-4xl mx-auto px-4 sm:px-8">
			<!-- Current Letter Info -->
			<div class="mb-6 text-center">
				<h1 class="text-2xl sm:text-3xl font-bold text-text-300 mb-2">
					Practice: <span class="text-4xl sm:text-5xl mx-2">{letter.isolated}</span> ({letter.name})
				</h1>
				<p class="text-text-200">Type the letter shown using the keyboard below</p>
			</div>

			<!-- Letter Block Component -->
			<div class="bg-gradient-to-br from-tile-400 to-tile-300 border-2 border-tile-600 rounded-2xl shadow-xl p-4 sm:p-6">
				<LetterBlock {letter} />
			</div>
		</div>
	</div>

	<!-- Bottom Navigation -->
	<footer class="border-t border-tile-600 sticky bottom-0 bg-gradient-to-b from-tile-300/95 to-tile-300 backdrop-blur-md shadow-lg">
		<div class="max-w-4xl mx-auto px-4 sm:px-8 py-4">
			<div class="flex items-center justify-between">
				<div>
					{#if index > 0}
						<button
							onclick={handlePrevious}
							class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-tile-400 to-tile-300 border-2 border-tile-600 text-text-300 font-semibold rounded-xl hover:from-tile-500 hover:to-tile-400 active:scale-95 shadow-md hover:shadow-lg transition-all duration-200"
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
				<div class="hidden md:flex items-center gap-1 overflow-x-auto max-w-[50%] px-2 scrollbar-thin" dir="rtl">
					{#each lettersCopy.slice(0, 10) as l, i}
						<button
							onclick={() => goToLetter(i)}
							class="w-10 h-10 flex-shrink-0 rounded-xl text-lg flex items-center justify-center transition-all duration-200 {index === i ? 'bg-gradient-to-br from-tile-600 to-tile-700 text-white shadow-lg scale-110' : 'text-text-200 hover:bg-tile-400 active:scale-95'}"
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
							class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-tile-600 to-tile-700 border-2 border-tile-700 text-white font-semibold rounded-xl hover:from-tile-700 hover:to-tile-800 active:scale-95 shadow-lg hover:shadow-xl transition-all duration-200"
						>
							<span class="hidden sm:inline">Next</span>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
							</svg>
						</button>
					{:else}
						<a
							href="/alphabet/practice/handwriting"
							class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 border-2 border-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 active:scale-95 shadow-lg hover:shadow-xl transition-all duration-200"
						>
							<span class="hidden sm:inline">Try Handwriting</span>
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
