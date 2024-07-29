<script lang="ts">
	import { letters } from '../../../../constants/alphabet';
	import Button from '../../../../components/Button.svelte';
	import cn from 'classnames';
	import { hue, theme } from '../../../../store/store';
  import { onMount } from 'svelte';
  import { updateKeyboardStyle } from '../../../../helpers/update-keyboard-style';
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

<header class="flex w-2/4 flex-row gap-2 px-8 pt-8">
	{#if page > 0}
		<Button onClick={previousPage} type="button">Previous</Button>
	{/if}
	<Button onClick={nextPage} type="button">Next</Button>
</header>
{#if page === 0}
	<section class="px-8 py-4">
		<p class="text-xl text-text-300">The Arabic alphabet has 28 letters.</p>
		<p class="mt-3 text-xl text-text-300">
			Here they are arranged in order starting from top right and moving across to the left.
		</p>
		<p class="mt-3 text-md text-text-200">Click on a letter to hear its name</p>
		<div class="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-10" dir="rtl">
			{#each lettersToRender as letter}
        <div class="flex flex-col items-center justify-center !w-full shrink-0">
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
	</section>
{:else}
	<section class="p-8">
		<p class="text-xl text-text-300">Arabic is a cursive language, written from right to left..</p>
		<p class="mt-3 text-xl text-text-300">
			Each letter takes a different form depending on whether it has an independent, initial,
			medial, or final position in a word.
		</p>
		<p class="mt-3 text-xl text-text-300">
    Six letters (ا - ز ـ ر ـ ذ ـ د ـ و ) have only two forms, Independent and final.
		</p>
		<p class="mt-3 text-md text-text-200">Click on a letter to hear its name</p>
		<div class="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-6" dir="rtl">
			{#each letters as letter}
      <div class="flex flex-col items-center justify-center !w-full shrink-0">
        <p class="text-sm text-text-200">{letter.name}</p>
				<button
					on:click={() => playAudio(letter.key)}
					value={letter.isolated}
					class={cn(
            "flex cursor-pointer w-full items-center justify-center rounded-md border-2 border-tile-500 bg-tile-400 text-3xl text-text-300 transition-all duration-300 ease-in-out hover:bg-tile-500",
            {'!bg-green-100 !border-green-100 hover:!bg-green-100': !letter.start || !letter.middle}
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
	</section>
{/if}
