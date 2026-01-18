<script lang="ts">
	import { letters } from '$lib/constants/alphabet';
	import cn from 'classnames';
	import { hue, theme } from '$lib/store/store';
	import { onMount } from 'svelte';
	import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

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
		
		// Subscribe to theme changes only on client
		const unsubHue = hue.subscribe(() => {
			updateKeyboardStyle();
		});
		
		const unsubTheme = theme.subscribe(() => {
			updateKeyboardStyle();
		});
		
		return () => {
			unsubHue();
			unsubTheme();
		};
	});

	const lettersToRender = letters;
</script>

<section class="min-h-screen bg-tile-200">
	<!-- Header with Navigation -->
	<header class="border-b border-tile-600 sticky top-0 bg-tile-200 z-10">
		<div class="max-w-7xl mx-auto px-3 sm:px-8 py-4">
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
		<div class="max-w-7xl mx-auto px-3 sm:px-8">
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
					
					<div class="bg-gradient-to-br from-tile-400 to-tile-300 border-2 border-tile-600 rounded-2xl p-6 shadow-xl">
						<div class="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10" dir="rtl">
							{#each lettersToRender as letter}
								<div class="flex flex-col items-center justify-center group transform transition-all duration-300 hover:-translate-y-1">
									<p class="text-xs sm:text-sm font-medium text-text-200 mb-2 group-hover:text-text-300 group-hover:font-semibold transition-all text-center">
										{letter.name}
									</p>
									<button
										onclick={() => playAudio(letter.key)}
										value={letter.key}
										class="relative flex w-full aspect-square cursor-pointer items-center justify-center border-2 border-tile-600 bg-gradient-to-br from-tile-300 to-tile-200 rounded-2xl text-3xl sm:text-4xl lg:text-5xl text-text-300 shadow-md hover:shadow-xl transition-all duration-300 ease-out hover:bg-gradient-to-br hover:from-tile-500 hover:to-tile-400 hover:border-text-200 hover:-translate-y-2 hover:scale-110 active:scale-95 overflow-hidden"
									>
										<!-- Ripple effect -->
										<span class="absolute inset-0 bg-white/30 scale-0 group-active:scale-100 group-active:opacity-0 transition-all duration-500 rounded-2xl"></span>

										<!-- Letter -->
										<span class="relative z-10 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
											{letter.isolated}
										</span>

										<!-- Audio indicator -->
										<div class="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-400 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity"></div>
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
									'group cursor-pointer relative overflow-hidden border-2 rounded-2xl transition-all duration-300 ease-out hover:shadow-2xl hover:-translate-y-2',
									(!letter.start || !letter.middle)
										? 'border-green-500/50 bg-gradient-to-br from-green-500/10 to-green-500/5 hover:from-green-500/20 hover:to-green-500/10 hover:border-green-400'
										: 'border-tile-600 bg-gradient-to-br from-tile-400 to-tile-300 hover:from-tile-500 hover:to-tile-400 hover:border-tile-500'
								)}
							>
								<!-- Shine effect on hover -->
								<div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
									<div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
								</div>

								<div class="p-5 sm:p-6 relative z-10">
									<!-- Letter name with badge -->
									<div class="flex items-center justify-center gap-2 mb-3">
										<p class="text-sm font-medium text-text-200 group-hover:text-text-300 group-hover:font-semibold transition-all">
											{letter.name}
										</p>
										{#if !letter.start || !letter.middle}
											<span class="text-xs px-2 py-0.5 rounded-full bg-green-400/20 text-green-600 font-semibold">
												2 forms
											</span>
										{/if}
									</div>

									<!-- Main letter with enhanced styling -->
									<p class="text-6xl sm:text-7xl text-center font-bold text-text-300 mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
										{letter.isolated}
									</p>

									<!-- Forms grid with better visual separation -->
									<div class="flex w-full flex-row items-stretch justify-between bg-gradient-to-r from-tile-300/40 via-tile-300/60 to-tile-300/40 rounded-xl border border-tile-500/30 overflow-hidden">
										<div class="flex flex-col items-center flex-1 py-3">
											<span class="text-xs text-text-200 mb-1 font-medium">Start</span>
											<p class={cn('text-2xl sm:text-3xl text-text-300', { 'opacity-30': !letter.start })}>
												{letter.start || '—'}
											</p>
										</div>
										<div class="flex flex-col items-center flex-1 border-x border-tile-500/30 py-3">
											<span class="text-xs text-text-200 mb-1 font-medium">Middle</span>
											<p class={cn('text-2xl sm:text-3xl text-text-300', { 'opacity-30': !letter.middle })}>
												{letter.middle || '—'}
											</p>
										</div>
										<div class="flex flex-col items-center flex-1 py-3">
											<span class="text-xs text-text-200 mb-1 font-medium">End</span>
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
	<footer class="border-t border-tile-600 sticky bottom-0 bg-gradient-to-b from-tile-300/95 to-tile-300 backdrop-blur-md shadow-lg">
		<div class="max-w-7xl mx-auto px-3 sm:px-8 py-4">
			<div class="flex items-center justify-between">
				<div>
					{#if page > 0}
						<button
							onclick={previousPage}
							class="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-tile-400 to-tile-300 border-2 border-tile-600 text-text-300 font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-tile-500 hover:to-tile-400 active:scale-95 transition-all duration-200"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
							<span>Previous</span>
						</button>
					{:else}
						<div></div>
					{/if}
				</div>

				<button
					onclick={nextPage}
					class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-tile-600 to-tile-700 border-2 border-tile-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-tile-700 hover:to-tile-800 active:scale-95 transform hover:-translate-y-0.5 transition-all duration-200"
				>
					<span>{page === totalPages - 1 ? 'Start Practicing' : 'Next Lesson'}</span>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
					</svg>
				</button>
			</div>
		</div>
	</footer>
</section>
