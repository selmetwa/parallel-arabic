<script lang="ts">
	import { letters } from '../../../constants/alphabet';
	import Button from '../../../components/Button.svelte';
	import cn from 'classnames';
	console.log(letters);
	import { hue, theme } from '../../../store/store';
  import { onMount } from 'svelte';

  type Keyboard = {
		getTextAreaValue: () => string | undefined;
		resetValue: () => void;
		style: {
			setProperty: (key: string, value: string) => void;
		};
	};

	$: page = 0;

	function playAudio(event: Event) {
		console.log({ event });
		const value = (event.target as HTMLButtonElement).value;
		const audio = new Audio(`/letters/audios/${value}.mp3`);
		audio.play();
	}

  function updateKeyboardStyle() {
		if (typeof document === 'undefined') return;

		const keyboard = document.querySelector('arabic-keyboard') as Keyboard | null;

		const tile1 = getComputedStyle(document.body).getPropertyValue('--tile1');
		const tile3 = getComputedStyle(document.body).getPropertyValue('--tile3');
		const tile4 = getComputedStyle(document.body).getPropertyValue('--tile4');
		const tile5 = getComputedStyle(document.body).getPropertyValue('--tile5');
		const tile6 = getComputedStyle(document.body).getPropertyValue('--tile6');
		const text1 = getComputedStyle(document.body).getPropertyValue('--text1');
		const text3 = getComputedStyle(document.body).getPropertyValue('--text3');

		if (keyboard) {
			keyboard.style.setProperty('--button-background-color', tile4);
			keyboard.style.setProperty('--button-active-background-color', tile5);
			keyboard.style.setProperty('--button-active-border', `1px solid ${tile6}`);
			keyboard.style.setProperty('--button-hover-background-color', tile3);
			keyboard.style.setProperty('--textarea-background-color', tile1);
			keyboard.style.setProperty('--textarea-input-color', text1);
			keyboard.style.setProperty('--max-keyboard-width', '900px');
			keyboard.style.setProperty('--button-color', text1);
			keyboard.style.setProperty('--button-eng-color', text3);
			keyboard.style.setProperty('--button-shifted-color', text3);
		}
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
</script>

<header class="flex w-2/4 flex-row gap-2 px-8 pt-8">
	{#if page > 0}
		<Button onClick={() => (page -= 1)} type="button">Previous</Button>
	{/if}
	<Button onClick={() => (page += 1)} type="button">Next</Button>
</header>
{#if page === 0}
	<section class="px-8 py-4">
		<p class="text-xl text-text-300">The Arabic alphabet has 28 letters.</p>
		<p class="mt-3 text-xl text-text-300">
			Here they are arranged in order starting from top right and moving across to the left.
		</p>
		<p class="mt-3 text-lg text-text-200">Click on a letter to hear its name</p>
		<div class="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-10" dir="rtl">
			{#each letters as letter}
        <div class="flex flex-col justify-center w-full">
          <p class="text-sm text-text-200">{letter.name}</p>
          <button
            on:click={playAudio}
            value={letter.key}
            class="flex cursor-pointer items-center justify-center rounded-md border-2 border-tile-500 bg-tile-400 p-2 text-3xl text-text-300 transition-all duration-300 ease-in-out hover:bg-tile-500"
          >
            {letter.isolated}
          </button>
        </div>
			{/each}
		</div>
	</section>
{:else if page === 1}
	<section class="p-8">
		<p class="text-xl text-text-300">Arabic is a cursive language, written from right to left..</p>
		<p class="mt-3 text-xl text-text-300">
			Each letter takes a different form depending on whether it has an independent, initial,
			medial, or final position in a word.
		</p>
		<p class="mt-3 text-xl text-text-300">
			Six letters ( ز ـ ر ـ ذ ـ د ـ و ـ أ ) have only two forms, Independent and final.
		</p>
		<p class="mt-3 text-lg text-text-200">Click on a letter to hear its name</p>
		<div class="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-6" dir="rtl">
			{#each letters as letter}
				<button
					on:click={playAudio}
					value={letter.key}
					class="flex cursor-pointer items-center justify-center rounded-md border-2 border-tile-500 bg-tile-400 text-3xl text-text-300 transition-all duration-300 ease-in-out hover:bg-tile-500"
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
			{/each}
		</div>

    <div class="mt-4 px-2">
      <p>Practice typing to see how the letters interact with eachother</p>
			<arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
		</div>
	</section>
{:else if page === 2}
	3
{/if}
