<script lang="ts">
	import { run } from 'svelte/legacy';

	import { letters } from '$lib/constants/alphabet';
	import Button from '$lib/components/Button.svelte';
	import cn from 'classnames';
	import { hue, theme } from '$lib/store/store';
	import { onMount } from 'svelte';
	import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
	import { goto } from '$app/navigation';

	let page = $state(0);
	

	function playAudio(letter: string) {
		const audio = new Audio(`/letters/audios/${letter}.mp3`);
		audio.play();
	}

	function nextPage() {
		if (page === 1) {
			goto('/alphabet/practice');
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

<section class="px-4 mt-6 sm:px-8 lg:px-12 max-w-7xl mx-auto pb-8">
	<header class="flex w-fit flex-row gap-3 mb-8">
		{#if page > 0}
			<Button onClick={previousPage} type="button" className="!text-base">Previous</Button>
		{/if}
		<Button onClick={nextPage} type="button" className="!text-base">Next</Button>
	</header>
	
	{#if page === 0}
		<div class="mb-8">
			<div class="mb-8 pb-6 border-b border-tile-500">
				<h1 class="text-4xl sm:text-5xl text-text-300 font-bold mb-3 tracking-tight">The Arabic alphabet has 28 letters.</h1>
				<p class="text-text-200 text-xl sm:text-2xl leading-relaxed max-w-3xl mb-4">
					Here they are arranged in order starting from top right and moving across to the left.
				</p>
				<p class="text-text-200 text-lg mb-6 opacity-90 bg-tile-400/50 w-fit px-4 py-2 rounded-lg border border-tile-500">💡 Click on a letter to hear its name</p>
			</div>
			
			<div class="grid grid-cols-4 gap-4 sm:grid-cols-5 lg:grid-cols-10" dir="rtl">
				{#each lettersToRender as letter}
					<div class="flex !w-full shrink-0 flex-col items-center justify-center group">
						<p class="text-sm font-bold text-text-200 mb-2 group-hover:text-text-300 transition-colors">{letter.name}</p>
						<button
							onclick={() => playAudio(letter.key)}
							value={letter.key}
							class="flex w-full aspect-square cursor-pointer items-center justify-center border-2 border-tile-600 bg-tile-400/50 rounded-xl text-4xl sm:text-5xl text-text-300 transition-all duration-300 ease-in-out hover:bg-tile-500 hover:border-tile-500 shadow-sm hover:shadow-md hover:-translate-y-1"
						>
							{letter.isolated}
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}
	
	{#if page === 1}
		<div>
			<div class="mb-8 pb-6 border-b border-tile-500">
				<h1 class="text-4xl sm:text-5xl text-text-300 font-bold mb-3 tracking-tight">Arabic is a cursive language, written from right to left.</h1>
				<p class="text-text-200 text-xl sm:text-2xl leading-relaxed max-w-4xl mb-2">
					Each letter takes a different form depending on whether it has an independent, initial, medial, or final position in a word.
				</p>
				<p class="text-text-200 text-lg sm:text-xl leading-relaxed mb-4 italic opacity-80">
					Six letters (ا - ز ـ ر ـ ذ ـ د ـ و ) have only two forms, Independent and final.
				</p>
				<p class="text-text-200 text-lg mb-6 opacity-90 bg-tile-400/50 w-fit px-4 py-2 rounded-lg border border-tile-500">💡 Click on a letter to hear its name</p>
			</div>
			
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" dir="rtl">
				{#each letters as letter}
					<div class="flex !w-full shrink-0 flex-col items-center justify-center group h-full">
						<p class="text-sm font-bold text-text-200 mb-2 group-hover:text-text-300 transition-colors">{letter.name}</p>
						<button
							onclick={() => playAudio(letter.key)}
							value={letter.isolated}
							class={cn(
								'flex w-full h-full cursor-pointer items-center justify-center border-2 border-tile-600 bg-tile-400/50 rounded-xl text-3xl text-text-300 transition-all duration-300 ease-in-out hover:bg-tile-500 hover:border-tile-500 shadow-sm hover:shadow-md hover:-translate-y-1',
								{
									'!border-green-200 !bg-green-100/80 hover:!bg-green-200':
										!letter.start || !letter.middle
								}
							)}
						>
							<div class="w-full p-6 flex flex-col justify-between h-full">
								<p class="text-5xl mb-6 text-center font-bold">
									{letter.isolated}
								</p>
								<div class="flex w-full flex-row items-center justify-between px-2 py-3 bg-tile-300/50 rounded-lg border border-tile-500/30">
									<div class="flex flex-col items-center">
										<span class="text-xs text-text-200 mb-1">Start</span>
										<p class={cn('text-3xl', { invisible: !letter.start })}>{letter.start || '-'}</p>
									</div>
									<div class="flex flex-col items-center border-x border-tile-500/30 px-4">
										<span class="text-xs text-text-200 mb-1">Middle</span>
										<p class={cn('text-3xl', { invisible: !letter.middle })}>{letter.middle || '-'}</p>
									</div>
									<div class="flex flex-col items-center">
										<span class="text-xs text-text-200 mb-1">End</span>
										<p class={cn('text-3xl', { invisible: !letter.end })}>{letter.end}</p>
									</div>
								</div>
							</div>
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</section>
