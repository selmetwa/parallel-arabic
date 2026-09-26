<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import AudioButton from '$lib/components/AudioButton.svelte';
	import SaveButton from '$lib/components/SaveButton.svelte';
	import PressButton from './PressButton.svelte';
	import { KEYBOARD_LETTERS, keysForTyped, letterKey } from '$lib/games/arabic-letters';
	import { awardGameXp } from '$lib/games/game-xp';
	import { isSolved, MAX_MISSES, missCount, pickWord } from '$lib/games/word-guess';
	import type { GameWord } from '$lib/games/word-pool';
	import type { RoundGate } from '$lib/games/free-rounds.svelte';
	import type { GameDialect } from '$lib/games/themes';

	interface Props {
		pool: GameWord[];
		dialect: GameDialect;
		gate: RoundGate;
		signedIn: boolean;
		isSubscribed: boolean;
		accent: string;
		deep: string;
	}

	let { pool, dialect, gate, signedIn, isSubscribed, accent, deep }: Props = $props();

	// Re-mounted (via {#key}) when the theme changes, so the first pool is the one to use.
	let word = $state(untrack(() => pickWord(pool)));
	const guessed = new SvelteSet<string>();
	const played = new SvelteSet<string>();
	let started = $state(false);
	let solvedInARow = $state(0);
	let solvedTotal = $state(0);
	let xpEarned = $state(0);
	let latinTyped = $state(false);
	let announcement = $state('');

	const inWord = $derived(new Set([...word.plain].map(letterKey)));
	const misses = $derived(missCount(word.plain, guessed));
	const won = $derived(isSolved(word.plain, guessed));
	const lost = $derived(!won && misses >= MAX_MISSES);
	const over = $derived(won || lost);

	function guess(key: string) {
		if (over || guessed.has(key)) return;
		// Each word is one free round, spent on its first guess.
		if (!started) {
			if (!gate.tryStartRound()) return;
			started = true;
		}

		guessed.add(key);

		if (isSolved(word.plain, guessed)) {
			solvedInARow++;
			solvedTotal++;
			announcement = `Solved: ${word.arabic}, ${word.english}`;
			if (signedIn) {
				awardGameXp();
				xpEarned++;
			}
		} else if (missCount(word.plain, guessed) >= MAX_MISSES) {
			solvedInARow = 0;
			announcement = `Out of guesses. The word was ${word.plain}, ${word.english}`;
		} else {
			announcement = inWord.has(key) ? `${key} is in the word` : `No ${key}`;
		}
	}

	function nextWord() {
		if (!gate.canStart()) {
			gate.block();
			return;
		}
		played.add(word.id);
		word = pickWord(pool, { avoid: played });
		guessed.clear();
		started = false;
		announcement = '';
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
		const target = event.target as HTMLElement | null;
		if (target?.closest('input, textarea, [contenteditable], dialog')) return;

		if (over && event.key === 'Enter') {
			event.preventDefault();
			nextWord();
			return;
		}

		const keys = keysForTyped(event.key);
		if (keys.length) {
			latinTyped = false;
			keys.forEach(guess);
		} else if (/^[a-z]$/i.test(event.key)) {
			latinTyped = true;
		}
	}
</script>

<svelte:window {onkeydown} />

<p class="sr-only" aria-live="polite">{announcement}</p>

<div class="game" style="--accent:{accent}; --deep:{deep};">
	<div class="bar">
		<span>Solved <strong>{solvedTotal}</strong></span>
		<span>In a row <strong>{solvedInARow}</strong></span>
		{#if xpEarned > 0}<span>XP <strong>+{xpEarned}</strong></span>{/if}
	</div>

	<div class="clue">
		<span class="clue-label">Meaning</span>
		<span class="clue-text">{word.english}</span>
	</div>

	<div
		class="slots"
		dir="rtl"
		lang="ar"
		aria-label="The hidden word, {[...word.plain].length} letters"
	>
		{#each [...word.plain] as ch, i (i)}
			{@const shown = guessed.has(letterKey(ch))}
			<span class="slot" class:shown class:missed={lost && !shown}>
				{shown || lost ? ch : ''}
			</span>
		{/each}
	</div>

	<div class="misses" aria-label="{misses} of {MAX_MISSES} misses">
		{#each Array.from({ length: MAX_MISSES }, (_, i) => i) as i (i)}
			<span class="pip" class:used={i < misses}></span>
		{/each}
		<span class="misses-text">{MAX_MISSES - misses} misses left</span>
	</div>

	{#if over}
		<div class="reveal" class:won>
			<p class="verdict">{won ? 'You got it!' : 'Out of guesses.'}</p>
			<p class="word" lang="ar" dir="rtl">{word.arabic}</p>
			<p class="gloss">
				{#if word.transliteration}<span class="translit">{word.transliteration}</span> ·{/if}
				{word.english}
			</p>
			<div class="tools">
				{#if word.audioUrl || isSubscribed}
					<AudioButton text={word.arabic} {dialect} audioUrl={word.audioUrl ?? undefined} />
				{/if}
				{#if signedIn}
					<SaveButton
						className=""
						objectToSave={{
							arabic: word.arabic,
							english: word.english,
							transliterated: word.transliteration,
							dialect
						}}
					/>
				{/if}
			</div>
			<PressButton onclick={nextWord} {accent} {deep}>Next word</PressButton>
		</div>
	{:else}
		<div class="keyboard" dir="rtl" role="group" aria-label="Arabic letters">
			{#each KEYBOARD_LETTERS as key (key)}
				{@const used = guessed.has(key)}
				<button
					type="button"
					class="key"
					class:hit={used && inWord.has(key)}
					class:miss={used && !inWord.has(key)}
					lang="ar"
					disabled={used}
					aria-label={key === 'ه' ? 'ه (also ة)' : key === 'ي' ? 'ي (also ى)' : key}
					onclick={() => guess(key)}
				>
					{key}
					{#if key === 'ه'}<small aria-hidden="true">ة</small>{/if}
					{#if key === 'ي'}<small aria-hidden="true">ى</small>{/if}
				</button>
			{/each}
		</div>
		<p class="keys-note">ا also covers أ إ آ · ه covers ة · ي covers ى · ء covers ئ ؤ</p>
		{#if latinTyped}
			<p class="keys-note" role="status">
				Tap the letters above, or switch your keyboard to Arabic.
			</p>
		{/if}
	{/if}
</div>

<style>
	.game {
		display: grid;
		gap: 1rem;
	}

	.bar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.1rem;
		font-size: 0.85rem;
		color: var(--text2);
	}

	.bar strong {
		color: var(--text1);
	}

	.clue {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem 0.8rem;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.8rem 1rem;
	}

	.clue-label {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text2);
	}

	.clue-text {
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--text1);
	}

	.slots {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem 0;
	}

	.slot {
		display: grid;
		place-items: center;
		width: 3.1rem;
		height: 3.6rem;
		border-bottom: 4px solid var(--tile6);
		font-size: 2rem;
		font-weight: 600;
		color: var(--text1);
	}

	.slot.shown {
		border-color: var(--accent);
	}

	.slot.missed {
		color: #e11d48;
	}

	.misses {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
	}

	.pip {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		background: color-mix(in srgb, #10b981 55%, var(--tile5));
	}

	.pip.used {
		background: var(--tile5);
	}

	.misses-text {
		margin-left: 0.5rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
	}

	.keyboard {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(2.75rem, 1fr));
		gap: 0.4rem;
	}

	.key {
		position: relative;
		display: grid;
		place-items: center;
		height: 2.9rem;
		border-radius: 0.7rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		box-shadow: 0 3px 0 var(--tile5);
		font-size: 1.35rem;
		font-weight: 600;
		color: var(--text1);
		cursor: pointer;
		transition: transform 0.1s ease;
	}

	.key small {
		position: absolute;
		top: 0.1rem;
		left: 0.3rem;
		font-size: 0.7rem;
		color: var(--text2);
	}

	.key:active:not(:disabled) {
		transform: translateY(3px);
		box-shadow: none;
	}

	.key:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.key:disabled {
		cursor: default;
		box-shadow: none;
	}

	.key.hit {
		border-color: #10b981;
		background: color-mix(in srgb, #10b981 22%, var(--tile3));
	}

	.key.miss {
		opacity: 0.4;
	}

	.keys-note {
		text-align: center;
		font-size: 0.78rem;
		color: var(--text2);
	}

	.reveal {
		display: grid;
		justify-items: center;
		gap: 0.55rem;
		border-radius: 1.25rem;
		border: 2px solid var(--tile6);
		background: var(--tile3);
		padding: 1.2rem 1rem;
	}

	.reveal.won {
		border-color: #10b981;
		background: color-mix(in srgb, #10b981 12%, var(--tile3));
	}

	.verdict {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text1);
	}

	.word {
		font-size: 2.4rem;
		font-weight: 600;
		color: var(--text1);
	}

	.gloss {
		font-size: 0.95rem;
		color: var(--text2);
	}

	.translit {
		font-style: italic;
	}

	.tools {
		display: flex;
		gap: 0.4rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.key {
			transition: none;
		}
	}
</style>
