<script lang="ts">
	import { letters } from '$lib/constants/alphabet';
	import Button from '$lib/components/Button.svelte';
	import cn from 'classnames';
	import { hue, theme } from '$lib/store/store';
	import { onMount } from 'svelte';
	import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
	import { goto } from '$app/navigation';

	$: page = 0;

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
	$: hue.subscribe(() => {
		updateKeyboardStyle();
	});

	$: theme.subscribe(() => {
		updateKeyboardStyle();
	});

	const lettersToRender = letters;
</script>

<section class="mt-8 px-4 pb-10 sm:mt-12 sm:px-16">
	<header class="flex w-fit flex-row gap-2">
		{#if page > 0}
			<Button onClick={previousPage} type="button">Previous</Button>
		{/if}
		<Button onClick={nextPage} type="button">Next</Button>
	</header>
	{#if page === 0}
		<div class="pt-4">
			<p class="text-xl text-text-300">The Arabic alphabet has 28 letters.</p>
			<p class="mt-3 text-xl text-text-300">
				Here they are arranged in order starting from top right and moving across to the left.
			</p>
			<p class="text-md mt-3 text-text-200">Click on a letter to hear its name</p>
			<div class="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-10" dir="rtl">
				{#each lettersToRender as letter}
					<div class="flex !w-full shrink-0 flex-col items-center justify-center">
						<p class="text-sm text-text-200">{letter.name}</p>
						<button
							on:click={() => playAudio(letter.key)}
							value={letter.key}
							class="flex w-full cursor-pointer items-center justify-center rounded-md border-2 border-tile-500 bg-tile-400 p-2 text-3xl text-text-300 transition-all duration-300 ease-in-out hover:bg-tile-500"
						>
							{letter.isolated}
						</button>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="pt-4">
			<p class="text-xl text-text-300">
				Arabic is a cursive language, written from right to left..
			</p>
			<p class="mt-3 text-xl text-text-300">
				Each letter takes a different form depending on whether it has an independent, initial,
				medial, or final position in a word.
			</p>
			<p class="mt-3 text-xl text-text-300">
				Six letters (ا - ز ـ ر ـ ذ ـ د ـ و ) have only two forms, Independent and final.
			</p>
			<p class="text-md mt-3 text-text-200">Click on a letter to hear its name</p>
			<div class="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-6" dir="rtl">
				{#each letters as letter}
					<div class="flex !w-full shrink-0 flex-col items-center justify-center">
						<p class="text-sm text-text-200">{letter.name}</p>
						<button
							on:click={() => playAudio(letter.key)}
							value={letter.isolated}
							class={cn(
								'flex w-full cursor-pointer items-center justify-center rounded-md border-2 border-tile-500 bg-tile-400 text-3xl text-text-300 transition-all duration-300 ease-in-out hover:bg-tile-500',
								{
									'!border-green-100 !bg-green-100 hover:!bg-green-100':
										!letter.start || !letter.middle
								}
							)}
						>
							<div class="w-full p-3">
								<p class="text-3xl">
									{letter.isolated}
								</p>
								<div class="flex w-full flex-row items-center justify-between">
									<p class={cn('text-xl', { invisible: !letter.start })}>{letter.start}</p>
									<p class={cn('text-xl', { invisible: !letter.middle })}>{letter.middle}</p>
									<p class={cn('text-xl', { invisible: !letter.end })}>{letter.end}</p>
								</div>
							</div>
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</section>
