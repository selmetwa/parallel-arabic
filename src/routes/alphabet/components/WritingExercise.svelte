<script lang="ts">
	import { onMount } from 'svelte';
	import cn from 'classnames';
	import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
	import { hue, theme } from '$lib/store/store';
	import { type Keyboard, type Dialect } from '$lib/types/index';
	import { normalizeArabicText, normalizeArabicTextLight } from '$lib/utils/arabic-normalization';
	import AudioButton from '$lib/components/AudioButton.svelte';
	import type { PracticeLetter, PracticeWord } from './practice-data';

	type Props = { letters: PracticeLetter[]; words: PracticeWord[]; dialect?: Dialect };
	let { letters, words, dialect = 'egyptian-arabic' }: Props = $props();

	type Attempt = { letter: string; correct: boolean };

	let phase = $state<'letters' | 'words'>('letters');
	let index = $state(0);
	let done = $state(false);

	let attempt = $state<Attempt[]>([]);
	let isCorrect = $state(false);
	let showAnswer = $state(false);

	let useVirtualKeyboard = $state(true);
	let keyboardContainer = $state<HTMLDivElement | null>(null);

	const letter = $derived(letters[index]);
	const word = $derived(words[index]);
	const target = $derived(phase === 'letters' ? letter?.isolated ?? '' : word?.arabic ?? '');
	const total = $derived(phase === 'letters' ? letters.length : words.length);

	function compareInput(value: string) {
		const trimmed = value.trim();
		const lightInput = normalizeArabicTextLight(trimmed);
		const lightTarget = normalizeArabicTextLight(target.trim());

		attempt =
			trimmed.length === 0
				? []
				: trimmed.split('').map((char, i) => ({
						letter: char,
						correct: (lightInput[i] ?? '') === (lightTarget[i] ?? '')
					}));

		isCorrect =
			normalizeArabicText(trimmed) === normalizeArabicText(target.trim()) && trimmed.length > 0;
	}

	function checkInput() {
		if (!useVirtualKeyboard || !keyboardContainer) return;
		const el = keyboardContainer.querySelector('arabic-keyboard') as Keyboard | null;
		const value = el?.getTextAreaValue?.();
		if (typeof value === 'string') compareInput(value);
	}

	function resetKeyboard() {
		const el = keyboardContainer?.querySelector('arabic-keyboard') as Keyboard | null;
		el?.resetValue?.();
		updateKeyboardStyle(el ?? undefined);
	}

	function resetForNewPrompt() {
		attempt = [];
		isCorrect = false;
		showAnswer = false;
		resetKeyboard();
	}

	function next() {
		if (phase === 'letters') {
			if (index < letters.length - 1) {
				index += 1;
			} else {
				phase = 'words';
				index = 0;
			}
		} else if (index < words.length - 1) {
			index += 1;
		} else {
			done = true;
			return;
		}
		resetForNewPrompt();
	}

	function restart() {
		phase = 'letters';
		index = 0;
		done = false;
		resetForNewPrompt();
	}

	function toggleKeyboard() {
		useVirtualKeyboard = !useVirtualKeyboard;
		setTimeout(() => updateKeyboardStyle(), 0);
	}

	function playLetter() {
		if (!letter) return;
		new Audio(`/letters/audios/${letter.key}.mp3`).play();
	}

	// Re-style the virtual keyboard when the theme or hue changes.
	$effect(() => {
		void $hue;
		void $theme;
		updateKeyboardStyle();
	});

	onMount(() => {
		if (typeof window !== 'undefined' && window.innerWidth < 768) {
			useVirtualKeyboard = false;
		}
		updateKeyboardStyle();

		document.addEventListener('keydown', checkInput);
		document.addEventListener('click', checkInput);
		const interval = setInterval(checkInput, 300);

		return () => {
			document.removeEventListener('keydown', checkInput);
			document.removeEventListener('click', checkInput);
			clearInterval(interval);
		};
	});
</script>

{#if done}
	<div class="rounded-xl border border-green-600/50 bg-green-500/10 p-6 text-center">
		<p class="mb-2 text-2xl font-bold text-text-300">🎉 Nicely done!</p>
		<p class="mb-4 text-sm text-text-200">
			You wrote every letter and all {words.length} practice words.
		</p>
		<button
			onclick={restart}
			class="rounded-full border border-tile-600 bg-tile-600 px-5 py-2.5 font-semibold text-white transition-all hover:bg-tile-700 active:scale-95"
		>
			Practice again
		</button>
	</div>
{:else}
	<div class="space-y-4">
		<!-- Prompt -->
		<div class="flex items-center justify-between gap-3">
			<span
				class="rounded-full border border-tile-500 bg-tile-400 px-3 py-1 text-xs font-semibold text-text-200"
			>
				{phase === 'letters' ? 'Letters' : 'Words'} · {index + 1} of {total}
			</span>
			{#if phase === 'letters'}
				<button
					onclick={playLetter}
					aria-label="Play letter sound"
					class="flex items-center gap-2 rounded-full border border-tile-500 bg-tile-400 px-4 py-2 text-sm font-semibold text-text-300 transition-colors hover:bg-tile-500 active:scale-95"
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path
							d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 00-2.5-4.03v8.05A4.5 4.5 0 0016.5 12z"
						/>
					</svg>
					<span>Hear it</span>
				</button>
			{:else}
				<AudioButton text={word.arabic} {dialect} />
			{/if}
		</div>

		<div class="rounded-xl border border-tile-500 bg-tile-300 p-4 text-center">
			{#if phase === 'letters'}
				<p class="text-sm text-text-200">Type this letter</p>
				<p class="text-2xl font-bold text-text-300">{letter.letterName}</p>
				<p class="text-sm text-text-200">
					sounds like <span class="font-semibold">{letter.englishSound}</span>
				</p>
			{:else}
				<p class="text-sm text-text-200">Type this word</p>
				<p class="text-2xl font-bold text-text-300">{word.meaning}</p>
				<p class="text-sm italic text-text-200">{word.franco}</p>
			{/if}
		</div>

		<!-- Live feedback / answer -->
		<div
			class={cn(
				'flex min-h-20 items-center justify-center rounded-xl border-2 p-4 transition-colors',
				isCorrect ? 'border-green-600 bg-green-500/10' : 'border-tile-500 bg-tile-200'
			)}
			dir="rtl"
		>
			{#if attempt.length > 0}
				<p class="font-arabic text-5xl">
					{#each attempt as { letter: char, correct }, i (i)}
						<span class={cn(correct ? 'text-green-600' : 'text-red-500')}>{char}</span>
					{/each}
				</p>
			{:else if showAnswer}
				<p class="font-arabic text-5xl text-text-300">{target}</p>
			{:else}
				<p class="text-sm text-text-200" dir="ltr">Your answer appears here…</p>
			{/if}
		</div>

		<!-- Controls -->
		<div class="flex flex-wrap items-center justify-center gap-2">
			<button
				onclick={() => (showAnswer = !showAnswer)}
				class={cn(
					'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
					showAnswer
						? 'bg-amber-600 text-white shadow-md'
						: 'border border-tile-600 bg-tile-500 text-text-300 hover:bg-tile-600'
				)}
			>
				{showAnswer ? 'Hide' : 'Show'} Answer
			</button>
			{#if isCorrect}
				<button
					onclick={next}
					class="rounded-lg border border-green-600 bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 active:scale-95"
				>
					Next →
				</button>
			{:else}
				<button
					onclick={next}
					class="rounded-lg border border-tile-600 bg-tile-400 px-4 py-2 text-sm font-semibold text-text-300 transition-colors hover:bg-tile-500"
				>
					Skip →
				</button>
			{/if}
		</div>

		<!-- Keyboard -->
		<div bind:this={keyboardContainer}>
			<div class="mb-2 flex justify-end">
				<button
					onclick={toggleKeyboard}
					class="rounded-lg border border-tile-500 bg-tile-400 px-3 py-1.5 text-sm text-text-300 transition-colors hover:bg-tile-500"
				>
					{useVirtualKeyboard ? '📱 Use native keyboard' : '⌨️ Use virtual keyboard'}
				</button>
			</div>

			<div class={cn('block', { hidden: !useVirtualKeyboard })}>
				<arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
			</div>

			<textarea
				oninput={(e) => compareInput((e.target as HTMLTextAreaElement).value)}
				class={cn(
					'font-arabic focus:ring-tile-600/50 block min-h-32 w-full rounded-xl border-2 border-tile-500 bg-tile-200 p-4 text-2xl text-text-300 transition-all placeholder:text-text-100 focus:border-tile-700 focus:outline-none focus:ring-2 sm:text-3xl',
					{ hidden: useVirtualKeyboard }
				)}
				dir="rtl"
				placeholder="اكتب هنا..."
			></textarea>
		</div>
	</div>
{/if}
