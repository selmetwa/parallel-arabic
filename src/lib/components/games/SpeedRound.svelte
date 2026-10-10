<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import GameResults from './GameResults.svelte';
	import GameWordList from './GameWordList.svelte';
	import PressButton from './PressButton.svelte';
	import { awardGameXp } from '$lib/games/game-xp';
	import { missedNote, saveMissedWords } from '$lib/games/save-missed';
	import {
		MAX_XP_PER_ROUND,
		MIN_POOL,
		ROUND_SECONDS,
		bestKey,
		buildQuestions,
		pointsFor,
		type SpeedQuestion
	} from '$lib/games/speed-round';
	import type { GameWord } from '$lib/games/word-pool';
	import type { RoundGate } from '$lib/games/free-rounds.svelte';
	import type { GameDialect } from '$lib/games/themes';

	interface Props {
		pool: GameWord[];
		dialect: GameDialect;
		theme: string;
		gate: RoundGate;
		signedIn: boolean;
		isSubscribed: boolean;
		accent: string;
		deep: string;
		onStart?: () => void;
	}

	let { pool, dialect, theme, gate, signedIn, isSubscribed, accent, deep, onStart }: Props =
		$props();

	/** More than anyone answers in a minute. */
	const QUESTIONS = 150;

	let phase = $state<'ready' | 'playing' | 'done'>('ready');
	let questions = $state<SpeedQuestion[]>([]);
	let index = $state(0);
	let score = $state(0);
	let streak = $state(0);
	let bestStreak = $state(0);
	let correct = $state(0);
	let wrong = $state(0);
	let missed = $state<GameWord[]>([]);
	let msLeft = $state(ROUND_SECONDS * 1000);
	let flash = $state<'right' | 'wrong' | null>(null);
	let xpEarned = $state(0);
	let best = $state(untrack(() => readBest()));
	let newBest = $state(false);
	let savedMissed = $state(0);
	let interval: ReturnType<typeof setInterval> | undefined;
	let flashTimer: ReturnType<typeof setTimeout> | undefined;

	const question = $derived(questions[index]);
	const secondsLeft = $derived(Math.ceil(msLeft / 1000));
	const enough = $derived(pool.length >= MIN_POOL);

	onDestroy(() => {
		clearInterval(interval);
		clearTimeout(flashTimer);
	});

	function readBest(): number {
		try {
			return Number(localStorage.getItem(bestKey(dialect, theme))) || 0;
		} catch {
			return 0;
		}
	}

	function saveBest(value: number) {
		try {
			localStorage.setItem(bestKey(dialect, theme), String(value));
		} catch {
			// Private mode: the best score just isn't remembered.
		}
	}

	function start() {
		if (!gate.tryStartRound()) return;
		onStart?.();
		questions = buildQuestions(pool, QUESTIONS);
		index = 0;
		score = 0;
		streak = 0;
		bestStreak = 0;
		correct = 0;
		wrong = 0;
		missed = [];
		xpEarned = 0;
		newBest = false;
		savedMissed = 0;
		msLeft = ROUND_SECONDS * 1000;
		phase = 'playing';
		const endAt = Date.now() + msLeft;
		clearInterval(interval);
		interval = setInterval(() => {
			msLeft = Math.max(0, endAt - Date.now());
			if (msLeft === 0) finish();
		}, 100);
	}

	function finish() {
		clearInterval(interval);
		phase = 'done';
		if (signedIn && missed.length) saveMissedWords(missed, dialect).then((n) => (savedMissed = n));
		if (score > best) {
			best = score;
			newBest = true;
			saveBest(score);
		}
	}

	function answer(sayTrue: boolean) {
		if (phase !== 'playing' || !question) return;
		if (sayTrue === question.isTrue) {
			score += pointsFor(streak);
			streak++;
			bestStreak = Math.max(bestStreak, streak);
			correct++;
			flash = 'right';
			if (signedIn && xpEarned < MAX_XP_PER_ROUND) {
				awardGameXp();
				xpEarned++;
			}
		} else {
			streak = 0;
			wrong++;
			flash = 'wrong';
			if (!missed.some((w) => w.id === question.word.id)) missed = [...missed, question.word];
		}
		clearTimeout(flashTimer);
		flashTimer = setTimeout(() => (flash = null), 250);
		index++;
		if (index >= questions.length) finish();
	}

	function playAgain() {
		if (!gate.canStart()) {
			gate.block();
			return;
		}
		start();
	}

	function onkeydown(event: KeyboardEvent) {
		if (phase !== 'playing' || event.metaKey || event.ctrlKey || event.altKey) return;
		const key = event.key.toLowerCase();
		if (key === 'arrowright' || key === 'y') {
			event.preventDefault();
			answer(true);
		} else if (key === 'arrowleft' || key === 'n') {
			event.preventDefault();
			answer(false);
		}
	}
</script>

<svelte:window {onkeydown} />

{#if phase === 'done'}
	<GameResults
		heading="{score} points in {ROUND_SECONDS} seconds"
		stats={[
			{ label: 'Score', value: score },
			{ label: 'Right', value: correct },
			{ label: 'Wrong', value: wrong },
			{ label: 'Best streak', value: bestStreak }
		]}
		note={[
			newBest ? 'A new best for this theme.' : best ? `Your best here: ${best}.` : '',
			missedNote(savedMissed) ?? ''
		]
			.filter(Boolean)
			.join(' ') || undefined}
		{xpEarned}
		{accent}
		{deep}
		onPlayAgain={playAgain}
		playAgainLabel="Go again"
	>
		{#if missed.length}
			<GameWordList words={missed} {dialect} {isSubscribed} {signedIn} />
		{/if}
	</GameResults>
{:else if phase === 'ready'}
	<div class="ready" style="--accent:{accent}; --deep:{deep};">
		{#if enough}
			<p class="pitch">
				{ROUND_SECONDS} seconds. An Arabic word and a meaning: right or wrong? Every five in a row
				is worth more.
			</p>
			{#if best}
				<p class="best">Your best here: {best}</p>
			{/if}
			<PressButton onclick={start} {accent} {deep}>Start the clock</PressButton>
		{:else}
			<p class="pitch">This theme doesn't have enough words yet. Pick another one.</p>
		{/if}
	</div>
{:else if question}
	<div class="game" style="--accent:{accent}; --deep:{deep};">
		<div class="top">
			<span class="clock" class:low={secondsLeft <= 10} aria-live="off">{secondsLeft}s</span>
			<span class="score">{score} pts</span>
			{#if streak >= 5}
				<span class="streak">×{pointsFor(streak)}</span>
			{/if}
		</div>
		<div class="bar" aria-hidden="true">
			<span style="width:{(msLeft / (ROUND_SECONDS * 1000)) * 100}%"></span>
		</div>

		<div class="card" class:right={flash === 'right'} class:wrong={flash === 'wrong'}>
			<span class="ar" lang="ar" dir="rtl">{question.word.arabic}</span>
			<span class="eq" aria-hidden="true">=</span>
			<span class="en">{question.shown}</span>
		</div>
		<p class="sr-only">Does {question.word.arabic} mean {question.shown}?</p>

		<div class="answers">
			<button type="button" class="ans no" onclick={() => answer(false)}>✗ Wrong</button>
			<button type="button" class="ans yes" onclick={() => answer(true)}>✓ Right</button>
		</div>
		<p class="keys">Keyboard: ← or N for wrong, → or Y for right</p>
	</div>
{/if}

<style>
	.ready {
		display: grid;
		justify-items: center;
		gap: 0.8rem;
		margin-top: 1.5rem;
		text-align: center;
	}

	.pitch {
		max-width: 34ch;
		font-size: 0.95rem;
		line-height: 1.55;
		color: var(--text2);
	}

	.best {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text1);
	}

	.game {
		display: grid;
		gap: 0.9rem;
	}

	.top {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		font-weight: 600;
		color: var(--text1);
	}

	.clock {
		font-size: 1.4rem;
		font-variant-numeric: tabular-nums;
	}

	.clock.low {
		color: #e11d48;
	}

	.score {
		margin-left: auto;
		font-variant-numeric: tabular-nums;
	}

	.streak {
		font-size: 0.8rem;
		border-radius: 100px;
		padding: 0.15rem 0.55rem;
		color: #fff;
		background: var(--accent);
	}

	.bar {
		height: 0.4rem;
		border-radius: 100px;
		background: var(--tile4);
		overflow: hidden;
	}

	.bar span {
		display: block;
		height: 100%;
		background: var(--accent);
	}

	.card {
		display: grid;
		justify-items: center;
		gap: 0.35rem;
		min-height: 11rem;
		align-content: center;
		border-radius: 1.25rem;
		border: 2px solid color-mix(in srgb, var(--accent) 40%, var(--tile5));
		background: var(--tile3);
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
	}

	.card.right {
		border-color: #10b981;
		background: color-mix(in srgb, #10b981 16%, var(--tile3));
	}

	.card.wrong {
		border-color: #f43f5e;
		background: color-mix(in srgb, #f43f5e 14%, var(--tile3));
	}

	.ar {
		font-size: clamp(2rem, 8vw, 2.8rem);
		font-weight: 600;
		color: var(--text1);
	}

	.eq {
		font-size: 1rem;
		color: var(--text2);
	}

	.en {
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--text1);
	}

	.answers {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.7rem;
	}

	.ans {
		min-height: 3.5rem;
		border-radius: 1rem;
		font-size: 1.05rem;
		font-weight: 600;
		color: #fff;
		cursor: pointer;
		transition: transform 0.1s ease;
	}

	.ans:active {
		transform: translateY(3px);
	}

	.ans:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.no {
		background: #f43f5e;
		box-shadow: 0 4px 0 #9f1239;
	}

	.yes {
		background: #10b981;
		box-shadow: 0 4px 0 #047857;
	}

	.keys {
		font-size: 0.75rem;
		text-align: center;
		color: var(--text2);
	}

	@media (prefers-reduced-motion: reduce) {
		.card,
		.ans {
			transition: none;
		}
	}
</style>
