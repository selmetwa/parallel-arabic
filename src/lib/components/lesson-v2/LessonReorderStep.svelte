<script lang="ts">
	import { type Dialect } from '$lib/types/index';
	import AudioButton from '$lib/components/AudioButton.svelte';
	import { normalizeArabicText } from '$lib/utils/arabic-normalization';
	import { userXp, userLevel } from '$lib/store/xp-store';
	import { showXpToast } from '$lib/helpers/toast-helpers';
	import { LEVEL_TIERS } from '$lib/helpers/xp-levels';
	import { trackEvent } from '$lib/analytics';

	interface Props {
		sentence: {
			arabic: string;
			arabicTashkeel?: string;
			english: string;
			transliteration: string;
		};
		dialect: Dialect;
		onContinue: () => void;
	}

	let { sentence, dialect, onContinue }: Props = $props();

	// Tiles carry an id so a word that appears twice stays two separate tiles.
	type Tile = { id: number; word: string };

	function shuffled(): Tile[] {
		const words = sentence.arabic.split(' ').filter((w) => w.trim());
		const tiles = words.map((word, id) => ({ id, word }));
		if (tiles.length < 2) return tiles;
		let out = tiles;
		// Never hand back the answer already in order.
		while (out.every((t, i) => t.id === i)) {
			out = [...tiles];
			for (let i = out.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[out[i], out[j]] = [out[j], out[i]];
			}
		}
		return out;
	}

	let pool = $state<Tile[]>(shuffled());
	let placed = $state<Tile[]>([]);
	let checked = $state(false);
	let correct = $state(false);
	let showHint = $state(false);
	let showAnswer = $state(false);

	function place(tile: Tile) {
		if (checked) return;
		pool = pool.filter((t) => t.id !== tile.id);
		placed = [...placed, tile];
	}

	function unplace(tile: Tile) {
		if (checked) return;
		placed = placed.filter((t) => t.id !== tile.id);
		pool = [...pool, tile];
	}

	function check() {
		correct =
			normalizeArabicText(placed.map((t) => t.word).join(' ')) ===
			normalizeArabicText(sentence.arabic);
		checked = true;
		trackEvent('sentences_reorder_submitted', { correct, dialect });
		if (correct) awardXp();
	}

	function tryAgain() {
		trackEvent('sentences_reorder_retry', { dialect });
		pool = shuffled();
		placed = [];
		checked = false;
		correct = false;
	}

	// Same award as SentenceBlock gives for a correct sentence.
	function awardXp() {
		fetch('/api/award-xp', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ eventType: 'sentence_correct' })
		})
			.then((r) => r.json())
			.then((data) => {
				if (!data.success) return;
				userXp.set(data.newTotalXp);
				if (data.leveledUp) userLevel.set(data.newLevel);
				const title = LEVEL_TIERS.find((t) => t.level === data.newLevel)?.title;
				showXpToast(data.xpAwarded, data.leveledUp, data.newLevel, title);
			})
			.catch(() => {});
	}
</script>

<div class="reorder">
	<p class="english">{sentence.english}</p>

	<div class="answer" class:is-right={checked && correct} class:is-wrong={checked && !correct} dir="rtl">
		{#each placed as tile (tile.id)}
			<button type="button" class="tile tile--placed" disabled={checked} onclick={() => unplace(tile)}>
				{tile.word}
			</button>
		{:else}
			<span class="placeholder" dir="ltr">Tap the words in order</span>
		{/each}
	</div>

	{#if !checked}
		<div class="pool" dir="rtl">
			{#each pool as tile (tile.id)}
				<button type="button" class="tile" onclick={() => place(tile)}>{tile.word}</button>
			{/each}
		</div>
	{/if}

	{#if checked && !correct}
		<p class="feedback bad">Not quite. The right order is:</p>
		<p class="solution" dir="rtl">{sentence.arabicTashkeel || sentence.arabic}</p>
	{:else if checked}
		<p class="feedback good">✓ Correct!</p>
	{/if}

	{#if showHint || showAnswer}
		<div class="reveal">
			{#if showAnswer}
				<p class="reveal-ar" dir="rtl">{sentence.arabicTashkeel || sentence.arabic}</p>
			{/if}
			{#if showHint}
				<p class="reveal-tr">{sentence.transliteration}</p>
			{/if}
		</div>
	{/if}

	<div class="tools">
		<button type="button" class="tool" class:on={showHint} onclick={() => (showHint = !showHint)}>Hint</button>
		<button type="button" class="tool" class:on={showAnswer} onclick={() => (showAnswer = !showAnswer)}>
			Show answer
		</button>
		<AudioButton text={sentence.arabic} {dialect} />
	</div>

	{#if !checked}
		<button type="button" class="primary" disabled={pool.length > 0} onclick={check}>Check</button>
	{:else if correct}
		<button type="button" class="primary" onclick={onContinue}>Continue</button>
	{:else}
		<button type="button" class="primary" onclick={tryAgain}>Try again</button>
	{/if}
</div>

<style>
	/* --accent/--deep and --go/--go-deep come from LessonPlayerV2. */
	.reorder {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.english {
		font-size: 1.3rem;
		font-weight: 600;
		line-height: 1.35;
		text-align: center;
		color: var(--text1);
	}

	.answer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 4.5rem;
		padding: 0.75rem;
		border-radius: 1.1rem;
		border: 2px dashed var(--tile5);
		transition:
			border-color 0.2s ease,
			background 0.2s ease;
	}
	.answer.is-right {
		border-style: solid;
		border-color: #2e9e5b;
		background: color-mix(in srgb, #2e9e5b 12%, transparent);
	}
	.answer.is-wrong {
		border-style: solid;
		border-color: #d65745;
		background: color-mix(in srgb, #d65745 12%, transparent);
	}
	.placeholder {
		font-size: 0.9rem;
		color: var(--text2);
	}

	.pool {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
	}

	/* Word tiles: pressable, like the game tiles */
	.tile {
		padding: 0.5rem 1rem;
		border-radius: 0.9rem;
		border: 2px solid var(--tile5);
		background: var(--tile2);
		box-shadow: 0 3px 0 var(--tile5);
		font-size: 1.4rem;
		font-weight: 600;
		color: var(--text1);
		cursor: pointer;
		transition:
			transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1),
			border-color 0.16s ease,
			box-shadow 0.16s ease;
		animation: tileIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}
	.tile:not(:disabled):hover {
		transform: translateY(-2px);
		border-color: var(--accent, var(--brand));
		box-shadow: 0 5px 0 var(--deep, var(--tile6));
	}
	.tile:not(:disabled):active {
		transform: translateY(2px);
		box-shadow: 0 1px 0 var(--deep, var(--tile6));
	}
	.tile--placed {
		border-color: var(--accent, var(--brand));
		background: color-mix(in srgb, var(--accent, var(--brand)) 14%, var(--tile2));
		box-shadow: 0 3px 0 var(--deep, var(--tile6));
	}
	.tile:disabled {
		cursor: default;
		box-shadow: none;
		border-color: transparent;
		background: transparent;
	}
	@keyframes tileIn {
		from {
			opacity: 0;
			transform: scale(0.85);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.feedback {
		font-weight: 600;
		text-align: center;
	}
	.feedback.good {
		color: #2e9e5b;
	}
	.feedback.bad {
		color: #d65745;
	}
	.solution {
		margin-top: -0.6rem;
		font-size: 1.4rem;
		font-weight: 600;
		text-align: center;
		color: var(--text1);
	}

	.reveal {
		text-align: center;
	}
	.reveal-ar {
		font-size: 1.4rem;
		color: var(--text1);
	}
	.reveal-tr {
		color: var(--text2);
	}

	/* Quiet helpers */
	.tools {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}
	.tool {
		padding: 0.3rem 0.85rem;
		border-radius: 100px;
		border: 2px solid var(--tile5);
		background: var(--tile2);
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
		cursor: pointer;
		transition:
			color 0.15s ease,
			border-color 0.15s ease,
			background 0.15s ease;
	}
	.tool:hover {
		border-color: var(--tile6);
		color: var(--text1);
	}
	.tool.on {
		background: var(--accent, var(--brand));
		border-color: var(--deep, var(--brand));
		color: #fff;
	}

	/* Main action: the green press button */
	.primary {
		align-self: stretch;
		padding: 0.95rem 1.2rem;
		border-radius: 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
		background: var(--go, #22c55e);
		box-shadow: 0 4px 0 var(--go-deep, #15803d);
		cursor: pointer;
		transition:
			transform 0.14s ease,
			box-shadow 0.14s ease,
			filter 0.2s ease;
	}
	.primary:not(:disabled):hover {
		filter: brightness(1.06);
	}
	.primary:not(:disabled):active {
		transform: translateY(4px);
		box-shadow: 0 0 0 var(--go-deep, #15803d);
	}
	.primary:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	button:focus-visible {
		outline: 2px solid var(--text1);
		outline-offset: 3px;
	}

	@media (prefers-reduced-motion: reduce) {
		.tile {
			animation: none;
			transition: none;
		}
		.tile:not(:disabled):hover,
		.tile:not(:disabled):active {
			transform: none;
		}
	}
</style>
