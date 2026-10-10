<script lang="ts">
	import { onMount } from 'svelte';
	import GameResults from './GameResults.svelte';
	import PressButton from './PressButton.svelte';
	import { awardGameXp } from '$lib/games/game-xp';
	import { PRONOUNS, type BlitzQuestion, type TenseChoice } from '$lib/games/verb-blitz';
	import type { GameDialect } from '$lib/games/themes';

	interface Props {
		dialect: GameDialect;
		tense: TenseChoice;
		signedIn: boolean;
		accent: string;
		deep: string;
		onPlayAgain: () => void;
		/** Called once, when the last answer has been moved past. */
		onFinish?: (score: number, total: number) => void;
	}

	let { dialect, tense, signedIn, accent, deep, onPlayAgain, onFinish }: Props = $props();

	const TENSE_LABEL = { past: 'Past', present: 'Present', future: 'Future' } as const;

	let questions = $state<BlitzQuestion[] | null>(null);
	let loadError = $state('');
	let index = $state(0);
	let picked = $state<number | null>(null);
	let missed = $state<BlitzQuestion[]>([]);
	let score = $state(0);
	let xpEarned = $state(0);
	let announcement = $state('');

	const question = $derived(questions?.[index]);
	const done = $derived(!!questions && index >= questions.length);

	onMount(async () => {
		try {
			const params = new URLSearchParams({ dialect, tense });
			const res = await fetch(`/api/games/verb-blitz?${params}`);
			if (!res.ok) throw new Error();
			questions = (await res.json()).items;
		} catch {
			loadError = "The verbs didn't load. Check your connection and try again.";
		}
	});

	function pick(i: number) {
		if (picked !== null || !question) return;
		picked = i;
		const right = i === question.answer;
		const form = question.options[question.answer].arabic;
		if (right) {
			score++;
			if (signedIn) {
				awardGameXp();
				xpEarned++;
			}
		} else {
			missed = [...missed, question];
		}
		announcement = right ? `Correct: ${form}, ${question.english}` : `It was ${form}, ${question.english}`;
	}

	function next() {
		index++;
		picked = null;
		announcement = '';
		if (questions && index === questions.length) onFinish?.(score, questions.length);
	}
</script>

<p class="sr-only" aria-live="polite">{announcement}</p>

{#if loadError}
	<p class="error" role="alert">{loadError}</p>
{:else if !questions}
	<div class="waiting" role="status">Loading the verbs…</div>
{:else if done}
	<GameResults
		heading="{score} of {questions.length} verbs right"
		stats={[{ label: 'Right', value: `${score}/${questions.length}` }]}
		{xpEarned}
		{accent}
		{deep}
		{onPlayAgain}
		playAgainLabel="New round"
	>
		{#if missed.length}
			<h3 class="list-title">The ones to go over</h3>
			<ul class="list">
				{#each missed as q, i (i)}
					<li class="row">
						<span class="ar" lang="ar" dir="rtl">{q.options[q.answer].arabic}</span>
						<span class="en">{q.english} · {q.options[q.answer].transliteration}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</GameResults>
{:else if question}
	{@const pronoun = PRONOUNS[dialect][question.person]}
	<div class="game" style="--accent:{accent}; --deep:{deep};">
		<p class="progress">Verb {index + 1} of {questions.length}</p>

		<div class="prompt">
			<p class="verb">
				<span class="ar" lang="ar" dir="rtl">{question.verb.arabic}</span>
				<span class="en">{question.verb.english}</span>
			</p>
			<p class="ask">
				<span class="chip">
					<span lang="ar">{pronoun[0]}</span>
					<span class="tr">{pronoun[1]}</span>
				</span>
				<span class="chip">{TENSE_LABEL[question.tense]}</span>
				{#if question.negative}<span class="chip neg">Negative</span>{/if}
			</p>
		</div>

		<div class="options" dir="rtl">
			{#each question.options as option, i (i)}
				<button
					type="button"
					class="option"
					class:right={picked !== null && i === question.answer}
					class:wrong={picked === i && i !== question.answer}
					disabled={picked !== null}
					onclick={() => pick(i)}
				>
					<span class="ar" lang="ar">{option.arabic}</span>
					{#if picked !== null}<span class="tr" dir="ltr">{option.transliteration}</span>{/if}
				</button>
			{/each}
		</div>

		{#if picked !== null}
			<div class="reveal" class:ok={picked === question.answer}>
				<p class="verdict">
					{picked === question.answer ? '✓ Correct!' : '✗ Not this time.'}
					<span lang="ar" dir="rtl">{question.options[question.answer].arabic}</span>
					means “{question.english}”.
				</p>
				<PressButton onclick={next} {accent} {deep}>
					{index + 1 < questions.length ? 'Next verb' : 'See results'}
				</PressButton>
			</div>
		{/if}
	</div>
{/if}

<style>
	.waiting {
		margin-top: 1.5rem;
		text-align: center;
		color: var(--text2);
	}

	.error {
		border-radius: 0.9rem;
		padding: 0.8rem 1rem;
		font-size: 0.9rem;
		color: var(--text1);
		background: color-mix(in srgb, #f43f5e 16%, var(--tile3));
	}

	.game {
		display: grid;
		gap: 0.9rem;
	}

	.progress {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
	}

	.prompt {
		display: grid;
		justify-items: center;
		gap: 0.7rem;
		border-radius: 1.25rem;
		border: 2px solid color-mix(in srgb, var(--accent) 40%, var(--tile5));
		background: color-mix(in srgb, var(--accent) 6%, var(--tile2));
		padding: 1.1rem 1rem;
		text-align: center;
	}

	.verb {
		display: grid;
		gap: 0.15rem;
	}

	.verb .ar {
		font-size: clamp(1.8rem, 7vw, 2.4rem);
		font-weight: 600;
		color: var(--text1);
	}

	.verb .en {
		font-size: 0.9rem;
		color: var(--text2);
	}

	.ask {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.4rem;
	}

	.chip {
		display: inline-flex;
		align-items: baseline;
		gap: 0.35rem;
		border-radius: 100px;
		padding: 0.3rem 0.8rem;
		font-weight: 600;
		color: var(--text1);
		background: var(--tile3);
		border: 2px solid var(--tile5);
	}

	.chip [lang='ar'] {
		font-size: 1.15rem;
	}

	.chip.neg {
		border-color: #f43f5e;
	}

	.tr {
		font-size: 0.8rem;
		font-style: italic;
		font-weight: 400;
		color: var(--text2);
	}

	.options {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.6rem;
	}

	.option {
		display: grid;
		justify-items: center;
		align-content: center;
		gap: 0.2rem;
		min-height: 4.2rem;
		padding: 0.5rem;
		border-radius: 1.1rem;
		color: var(--text1);
		border: 2px solid color-mix(in srgb, var(--accent) 40%, var(--tile5));
		background: var(--tile3);
		box-shadow: 0 4px 0 color-mix(in srgb, var(--deep) 55%, transparent);
		cursor: pointer;
		transition: transform 0.12s ease;
	}

	.option .ar {
		font-size: clamp(1.25rem, 5vw, 1.55rem);
		font-weight: 600;
	}

	.option:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	.option:disabled {
		cursor: default;
		box-shadow: none;
	}

	.option:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.option.right {
		border-color: #10b981;
		background: color-mix(in srgb, #10b981 18%, var(--tile3));
	}

	.option.wrong {
		border-color: #f43f5e;
		background: color-mix(in srgb, #f43f5e 16%, var(--tile3));
	}

	.reveal {
		display: grid;
		justify-items: start;
		gap: 0.6rem;
		border-radius: 1.1rem;
		border: 2px solid #f43f5e;
		background: color-mix(in srgb, #f43f5e 8%, var(--tile3));
		padding: 1rem 1.1rem;
	}

	.reveal.ok {
		border-color: #10b981;
		background: color-mix(in srgb, #10b981 10%, var(--tile3));
	}

	.verdict {
		color: var(--text1);
	}

	.list-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text1);
		margin-bottom: 0.6rem;
	}

	.list {
		display: grid;
		gap: 0.45rem;
	}

	.row {
		display: grid;
		gap: 0.2rem;
		border-radius: 0.9rem;
		background: var(--tile3);
		border: 2px solid var(--tile5);
		padding: 0.6rem 0.8rem;
	}

	.row .ar {
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--text1);
	}

	.row .en {
		font-size: 0.84rem;
		color: var(--text2);
	}

	@media (prefers-reduced-motion: reduce) {
		.option {
			transition: none;
		}
		.option:hover:not(:disabled) {
			transform: none;
		}
	}
</style>
