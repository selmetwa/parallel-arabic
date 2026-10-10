<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import GameResults from './GameResults.svelte';
	import PressButton from './PressButton.svelte';
	import { awardGameXp } from '$lib/games/game-xp';
	import {
		buildRound,
		dialectLabel,
		type DialectItem,
		type DialectQuestion
	} from '$lib/games/dialect-match';
	import { DIALECT_OPTIONS, GAME_DIALECTS, type GameDialect } from '$lib/games/themes';

	interface Props {
		items: DialectItem[];
		signedIn: boolean;
		accent: string;
		deep: string;
		onPlayAgain: () => void;
	}

	let { items, signedIn, accent, deep, onPlayAgain }: Props = $props();

	let questions = $state<DialectQuestion[]>(untrack(() => buildRound(items)));
	let index = $state(0);
	/** The dialect picked: the answer to every kind of question is a dialect. */
	let picked = $state<GameDialect | null>(null);
	let score = $state(0);
	let xpEarned = $state(0);
	let announcement = $state('');
	let audio: HTMLAudioElement | null = null;

	const question = $derived(questions[index]);
	const done = $derived(index >= questions.length);
	const emoji = (d: GameDialect) => DIALECT_OPTIONS.find((o) => o.value === d)!.emoji;

	onDestroy(() => audio?.pause());

	function play(url: string | undefined) {
		if (!url) return;
		audio?.pause();
		audio = new Audio(url);
		audio.play().catch(() => {});
	}

	function playIfListen() {
		if (question?.kind === 'listen') play(question.item.forms[question.dialect].audioUrl);
	}

	onMount(playIfListen);

	function pick(dialect: GameDialect) {
		if (picked !== null) return;
		picked = dialect;
		const right = dialect === question.dialect;
		const form = question.item.forms[question.dialect];
		if (right) {
			score++;
			if (signedIn) {
				awardGameXp();
				xpEarned++;
			}
		}
		announcement = right
			? `Correct: ${form.arabic} is ${dialectLabel(question.dialect)}.`
			: `Not quite: ${form.arabic} is ${dialectLabel(question.dialect)}.`;
	}

	function next() {
		index++;
		picked = null;
		announcement = '';
		playIfListen();
	}
</script>

<p class="sr-only" aria-live="polite">{announcement}</p>

{#if done}
	<GameResults
		heading="{score} of {questions.length} dialects spotted"
		stats={[{ label: 'Right', value: `${score}/${questions.length}` }]}
		{xpEarned}
		{accent}
		{deep}
		{onPlayAgain}
		playAgainLabel="New round"
	/>
{:else}
	<div class="game" style="--accent:{accent}; --deep:{deep};">
		<p class="progress">Question {index + 1} of {questions.length}</p>

		{#if question.kind === 'find'}
			<p class="ask">
				How do you say <strong>“{question.item.english}”</strong> in
				{emoji(question.dialect)}
				{dialectLabel(question.dialect)}?
			</p>
			<div class="forms" dir="rtl">
				{#each question.options as d (d)}
					{@const form = question.item.forms[d]}
					<button
						type="button"
						class="option"
						class:right={picked !== null && d === question.dialect}
						class:wrong={picked === d && d !== question.dialect}
						disabled={picked !== null}
						onclick={() => pick(d)}
					>
						<span class="ar" lang="ar">{form.arabic}</span>
						<span class="tr" dir="ltr">{form.transliteration}</span>
					</button>
				{/each}
			</div>
		{:else}
			<p class="ask">
				{question.kind === 'listen' ? 'Which dialect did you hear?' : 'Which dialect is this?'}
			</p>
			<div class="prompt">
				{#if question.kind === 'listen'}
					<button
						type="button"
						class="play"
						onclick={() => play(question.item.forms[question.dialect].audioUrl)}
					>
						🔊 <span class="sr-only">Play again</span>
					</button>
					{#if picked !== null}
						<span class="ar" lang="ar" dir="rtl">{question.item.forms[question.dialect].arabic}</span>
					{/if}
				{:else}
					<span class="ar big" lang="ar" dir="rtl">{question.item.forms[question.dialect].arabic}</span>
					<span class="tr">{question.item.forms[question.dialect].transliteration}</span>
				{/if}
				<span class="meaning">“{question.item.english}”</span>
			</div>
			<div class="dialects">
				{#each DIALECT_OPTIONS as option (option.value)}
					<button
						type="button"
						class="option dialect"
						class:right={picked !== null && option.value === question.dialect}
						class:wrong={picked === option.value && option.value !== question.dialect}
						disabled={picked !== null}
						onclick={() => pick(option.value)}
					>
						<span aria-hidden="true">{option.emoji}</span>
						{option.label}
					</button>
				{/each}
			</div>
		{/if}

		{#if picked !== null}
			<div class="reveal" class:ok={picked === question.dialect}>
				<p class="verdict">
					{picked === question.dialect ? '✓ Correct!' : '✗ Not this time.'}
					“{question.item.english}” across the dialects:
				</p>
				<ul class="table">
					{#each GAME_DIALECTS as d (d)}
						{@const form = question.item.forms[d]}
						<li class:this={d === question.dialect}>
							<span class="who">{emoji(d)} {dialectLabel(d)}</span>
							<span class="ar" lang="ar" dir="rtl">{form.arabic}</span>
							<span class="tr">{form.transliteration}</span>
							{#if form.audioUrl}
								<button
									type="button"
									class="mini-play"
									onclick={() => play(form.audioUrl)}
									aria-label="Play the {dialectLabel(d)} recording">🔊</button
								>
							{/if}
						</li>
					{/each}
				</ul>
				<PressButton onclick={next} {accent} {deep}>
					{index + 1 < questions.length ? 'Next' : 'See results'}
				</PressButton>
			</div>
		{/if}
	</div>
{/if}

<style>
	.game {
		display: grid;
		gap: 0.9rem;
	}

	.progress {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
	}

	.ask {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text1);
	}

	.prompt {
		display: grid;
		justify-items: center;
		gap: 0.35rem;
		min-height: 9rem;
		align-content: center;
		border-radius: 1.25rem;
		border: 2px solid color-mix(in srgb, var(--accent) 40%, var(--tile5));
		background: color-mix(in srgb, var(--accent) 6%, var(--tile2));
		padding: 1rem;
	}

	.play {
		font-size: 2.6rem;
		cursor: pointer;
	}

	.ar {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text1);
	}

	.ar.big {
		font-size: clamp(2rem, 8vw, 2.6rem);
	}

	.tr {
		font-size: 0.85rem;
		font-style: italic;
		color: var(--text2);
	}

	.meaning {
		font-size: 0.95rem;
		color: var(--text1);
	}

	.forms,
	.dialects {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.6rem;
	}

	.option {
		display: grid;
		justify-items: center;
		align-content: center;
		gap: 0.2rem;
		min-height: 4.5rem;
		padding: 0.6rem;
		border-radius: 1.1rem;
		color: var(--text1);
		border: 2px solid color-mix(in srgb, var(--accent) 40%, var(--tile5));
		background: var(--tile3);
		box-shadow: 0 4px 0 color-mix(in srgb, var(--deep) 55%, transparent);
		cursor: pointer;
		transition: transform 0.12s ease;
	}

	.dialect {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.45rem;
		min-height: 3.5rem;
		font-size: 1rem;
		font-weight: 600;
	}

	.option:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	.option:disabled {
		cursor: default;
		box-shadow: none;
	}

	.option:focus-visible,
	.play:focus-visible {
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
		gap: 0.7rem;
		justify-items: start;
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
		font-weight: 600;
		color: var(--text1);
	}

	.table {
		display: grid;
		gap: 0.35rem;
		width: 100%;
	}

	.table li {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.2rem 0.7rem;
		border-radius: 0.8rem;
		background: var(--tile3);
		border: 2px solid var(--tile5);
		padding: 0.45rem 0.7rem;
	}

	.table li.this {
		border-color: var(--accent);
	}

	.who {
		min-width: 7rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
	}

	.table .ar {
		font-size: 1.2rem;
	}

	.mini-play {
		margin-left: auto;
		cursor: pointer;
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
