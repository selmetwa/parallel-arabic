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

<section class="px-3 mt-6 sm:px-8 max-w-6xl mx-auto pb-8">
	<header class="flex w-fit flex-row gap-2 mb-6">
		{#if page > 0}
			<Button onClick={previousPage} type="button">Previous</Button>
		{/if}
		<Button onClick={nextPage} type="button">Next</Button>
	</header>
	
	{#if page === 0}
		<div class="mb-8">
			<h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-2 tracking-tight">The Arabic alphabet has 28 letters.</h1>
			<p class="text-text-200 text-lg sm:text-xl leading-snug mb-4">
				Here they are arranged in order starting from top right and moving across to the left.
			</p>
			<p class="text-text-200 text-base mb-6 opacity-90">Click on a letter to hear its name</p>
			
			<div class="grid grid-cols-4 gap-2 sm:grid-cols-10" dir="rtl">
				{#each lettersToRender as letter}
					<div class="flex !w-full shrink-0 flex-col items-center justify-center">
						<p class="text-xs text-text-200 mb-1">{letter.name}</p>
						<button
							onclick={() => playAudio(letter.key)}
							value={letter.key}
							class="flex w-full cursor-pointer items-center justify-center border-2 border-tile-500 bg-tile-400 p-2 text-3xl text-text-300 transition-all duration-300 ease-in-out hover:bg-tile-500 hover:border-tile-600"
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
			<h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-2 tracking-tight">Arabic is a cursive language, written from right to left.</h1>
			<p class="text-text-200 text-lg sm:text-xl leading-snug mb-2">
				Each letter takes a different form depending on whether it has an independent, initial, medial, or final position in a word.
			</p>
			<p class="text-text-200 text-lg sm:text-xl leading-snug mb-4">
				Six letters (ا - ز ـ ر ـ ذ ـ د ـ و ) have only two forms, Independent and final.
			</p>
			<p class="text-text-200 text-base mb-6 opacity-90">Click on a letter to hear its name</p>
			
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4" dir="rtl">
				{#each letters as letter}
					<div class="flex !w-full shrink-0 flex-col items-center justify-center">
						<p class="text-xs text-text-200 mb-1">{letter.name}</p>
						<button
							onclick={() => playAudio(letter.key)}
							value={letter.isolated}
							class={cn(
								'flex w-full cursor-pointer items-center justify-center border-2 border-tile-500 bg-tile-400 text-3xl text-text-300 transition-all duration-300 ease-in-out hover:bg-tile-500 hover:border-tile-600',
								{
									'!border-green-100 !bg-green-100 hover:!brightness-90':
										!letter.start || !letter.middle
								}
							)}
						>
							<div class="w-full p-3">
								<p class="text-4xl mb-2">
									{letter.isolated}
								</p>
								<div class="flex w-full flex-row items-center justify-between">
									<p class={cn('text-3xl', { invisible: !letter.start })}>{letter.start}</p>
									<p class={cn('text-3xl', { invisible: !letter.middle })}>{letter.middle}</p>
									<p class={cn('text-3xl', { invisible: !letter.end })}>{letter.end}</p>
								</div>
							</div>
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</section>
