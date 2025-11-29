<script lang="ts">
	import { run } from 'svelte/legacy';
	import { letters } from '$lib/constants/alphabet';
	import cn from 'classnames';
	import { hue, theme } from '$lib/store/store';
	import { onMount } from 'svelte';
	import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
	import { goto } from '$app/navigation';

	let page = $state(0);
	const totalPages = 2;

	function playAudio(letter: string) {
		const audio = new Audio(`/letters/audios/${letter}.mp3`);
		audio.play();
	}

	function nextPage() {
		if (page === totalPages - 1) {
			goto('/alphabet/practice');
			return;
		}
		page += 1;
	}

	function previousPage() {
		page -= 1;
	}

	onMount(() => {
		updateKeyboardStyle();
	});

	run(() => {
		hue.subscribe(() => {
			updateKeyboardStyle();
		});
	});

	run(() => {
		theme.subscribe(() => {
			updateKeyboardStyle();
		});
	});

	const lettersToRender = letters;
</script>

<section class="min-h-screen bg-tile-300">
	<!-- Header with Navigation -->
	<header class="border-b border-tile-600 sticky top-0 bg-tile-300 z-10">
		<div class="max-w-7xl mx-auto px-4 sm:px-8 py-4">
			<div class="flex items-center justify-between">
				<a href="/alphabet" class="flex items-center gap-2 text-text-200 hover:text-text-300 transition-colors">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
					</svg>
					<span class="font-medium">Back to Alphabet</span>
				</a>
				
				<div class="flex items-center gap-4">
					<!-- Progress indicator -->
					<div class="flex items-center gap-2">
						{#each Array(totalPages) as _, i}
							<button
								onclick={() => page = i}
								class={cn(
									'w-3 h-3 rounded-full transition-all duration-300',
									page === i ? 'bg-text-300 scale-110' : 'bg-tile-500 border border-tile-600 hover:bg-tile-400'
								)}
								aria-label="Go to page {i + 1}"
							></button>
						{/each}
					</div>
					<span class="text-text-200 text-sm hidden sm:block">
						Lesson {page + 1} of {totalPages}
					</span>
				</div>
			</div>
		</div>
	</header>

	<!-- Content -->
	<div class="py-8 sm:py-12">
		<div class="max-w-7xl mx-auto px-4 sm:px-8">
			{#if page === 0}
				<!-- Lesson 1: All Letters -->
				<div class="mb-8">
					<div class="max-w-3xl mb-10">
						<div class="inline-flex items-center gap-2 px-3 py-1.5 bg-tile-400 border border-tile-600 rounded-full text-xs text-text-200 mb-4">
							<span>Lesson 1</span>
						</div>
						<h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-300 leading-tight mb-4">
							The Arabic alphabet has 28 letters
						</h1>
						<p class="text-lg text-text-200 leading-relaxed mb-4">
							Here they are arranged in order, starting from top right and moving across to the left. Each letter has a name and a unique sound.
						</p>
						<div class="inline-flex items-center gap-2 px-4 py-2 bg-tile-400 border border-tile-600 rounded-lg text-sm text-text-200">
							<span>💡</span>
							<span>Click on any letter to hear its pronunciation</span>
						</div>
					</div>
					
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 shadow-lg">
						<div class="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10" dir="rtl">
							{#each lettersToRender as letter}
								<div class="flex flex-col items-center justify-center group">
									<p class="text-xs sm:text-sm font-medium text-text-200 mb-2 group-hover:text-text-300 transition-colors">{letter.name}</p>
									<button
										onclick={() => playAudio(letter.key)}
										value={letter.key}
										class="flex w-full aspect-square cursor-pointer items-center justify-center border-2 border-tile-600 bg-tile-300 rounded-xl text-3xl sm:text-4xl lg:text-5xl text-text-300 transition-all duration-300 ease-in-out hover:bg-tile-500 hover:border-text-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:scale-105"
									>
										{letter.isolated}
									</button>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}
			
			{#if page === 1}
				<!-- Lesson 2: Letter Forms -->
				<div class="mb-8">
					<div class="max-w-4xl mb-10">
						<div class="inline-flex items-center gap-2 px-3 py-1.5 bg-tile-400 border border-tile-600 rounded-full text-xs text-text-200 mb-4">
							<span>Lesson 2</span>
						</div>
						<h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-300 leading-tight mb-4">
							Arabic is cursive, written right to left
						</h1>
						<p class="text-lg text-text-200 leading-relaxed mb-3">
							Each letter takes a different form depending on whether it has an independent, initial, medial, or final position in a word.
						</p>
						<p class="text-base text-text-200 leading-relaxed mb-4 opacity-80">
							<span class="text-green-400 font-medium">Highlighted letters</span> (ا - ز ـ ر ـ ذ ـ د ـ و) have only two forms: Independent and Final. They don't connect to the left.
						</p>
						<div class="inline-flex items-center gap-2 px-4 py-2 bg-tile-400 border border-tile-600 rounded-lg text-sm text-text-200">
							<span>💡</span>
							<span>Click on any letter card to hear its pronunciation</span>
						</div>
					</div>
					
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" dir="rtl">
						{#each letters as letter}
							<button
								onclick={() => playAudio(letter.key)}
								class={cn(
									'group cursor-pointer border-2 rounded-xl transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 overflow-hidden',
									(!letter.start || !letter.middle)
										? 'border-green-500/50 bg-green-500/10 hover:bg-green-500/20 hover:border-green-400'
										: 'border-tile-600 bg-tile-400 hover:bg-tile-500 hover:border-tile-500'
								)}
							>
								<div class="p-4 sm:p-5">
									<!-- Letter name -->
									<p class="text-sm font-medium text-text-200 mb-3 text-center group-hover:text-text-300 transition-colors">
										{letter.name}
									</p>
									
									<!-- Main letter -->
									<p class="text-5xl sm:text-6xl text-center font-bold text-text-300 mb-4">
										{letter.isolated}
									</p>
									
									<!-- Forms -->
									<div class="flex w-full flex-row items-center justify-between px-2 py-3 bg-tile-300/50 rounded-lg border border-tile-500/30">
										<div class="flex flex-col items-center flex-1">
											<span class="text-xs text-text-200 mb-1">Start</span>
											<p class={cn('text-2xl sm:text-3xl text-text-300', { 'opacity-30': !letter.start })}>
												{letter.start || '—'}
											</p>
										</div>
										<div class="flex flex-col items-center flex-1 border-x border-tile-500/30">
											<span class="text-xs text-text-200 mb-1">Middle</span>
											<p class={cn('text-2xl sm:text-3xl text-text-300', { 'opacity-30': !letter.middle })}>
												{letter.middle || '—'}
											</p>
										</div>
										<div class="flex flex-col items-center flex-1">
											<span class="text-xs text-text-200 mb-1">End</span>
											<p class="text-2xl sm:text-3xl text-text-300">{letter.end}</p>
										</div>
									</div>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Bottom Navigation -->
	<footer class="border-t border-tile-600 sticky bottom-0 bg-tile-300">
		<div class="max-w-7xl mx-auto px-4 sm:px-8 py-4">
			<div class="flex items-center justify-between">
				<div>
					{#if page > 0}
						<button
							onclick={previousPage}
							class="flex items-center gap-2 px-5 py-2.5 bg-tile-400 border-2 border-tile-600 text-text-300 font-medium rounded-lg hover:bg-tile-500 transition-colors"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
							Previous
						</button>
					{:else}
						<div></div>
					{/if}
				</div>
				
				<button
					onclick={nextPage}
					class="flex items-center gap-2 px-5 py-2.5 bg-tile-600 border-2 border-tile-600 text-text-300 font-medium rounded-lg hover:bg-tile-700 transition-colors shadow-md"
				>
					{page === totalPages - 1 ? 'Start Practicing' : 'Next Lesson'}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
					</svg>
				</button>
			</div>
		</div>
	</footer>
</section>
