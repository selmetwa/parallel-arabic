<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import GameResults from './GameResults.svelte';
	import PressButton from './PressButton.svelte';
	import { awardGameXp } from '$lib/games/game-xp';
	import {
		POSITION_LABEL,
		audioUrl,
		buildRound,
		formOf,
		type Letter
	} from '$lib/games/letter-hunt';

	interface Props {
		signedIn: boolean;
		accent: string;
		deep: string;
		onPlayAgain: () => void;
		/** Called once, when the last answer has been moved past. */
		onFinish?: (score: number, total: number) => void;
	}

	let { signedIn, accent, deep, onPlayAgain, onFinish }: Props = $props();

	let questions = $state(untrack(() => buildRound()));
	let index = $state(0);
	let picked = $state<number | null>(null);
	let missed = $state<Letter[]>([]);
	let score = $state(0);
	let xpEarned = $state(0);
	let announcement = $state('');
	let audio: HTMLAudioElement | null = null;

	const question = $derived(questions[index]);
	const done = $derived(index >= questions.length);

	onDestroy(() => audio?.pause());

	function play(letter: Letter) {
		audio?.pause();
		audio = new Audio(audioUrl(letter));
		audio.play().catch(() => {});
	}

	/** Sound questions play as they appear. */
	function playIfSound() {
		if (question?.kind === 'sound-to-letter') play(question.letter);
	}

	onMount(playIfSound);

	function pick(i: number) {
		if (picked !== null) return;
		picked = i;
		const right = i === question.answer;
		const { letter } = question;
		if (right) {
			score++;
			if (signedIn) {
				awardGameXp();
				xpEarned++;
			}
		} else if (!missed.includes(letter)) {
			missed = [...missed, letter];
		}
		announcement = right ? `Correct: ${letter.name}` : `Not quite. It was ${letter.name}.`;
		play(letter);
	}

	function next() {
		index++;
		picked = null;
		announcement = '';
		if (index === questions.length) onFinish?.(score, questions.length);
		playIfSound();
	}
</script>

<p class="sr-only" aria-live="polite">{announcement}</p>

{#if done}
	<GameResults
		heading="{score} of {questions.length} letters"
		stats={[{ label: 'Right', value: `${score}/${questions.length}` }]}
		{xpEarned}
		{accent}
		{deep}
		{onPlayAgain}
		playAgainLabel="New round"
	>
		{#if missed.length}
			<h3 class="list-title">Letters to look at again</h3>
			<ul class="missed">
				{#each missed as letter (letter.key)}
					<li>
						<button type="button" class="missed-letter" onclick={() => play(letter)}>
							<span class="forms" lang="ar" dir="rtl">
								{letter.isolated}
								{#each ['start', 'middle', 'end'] as const as p (p)}
									{#if letter[p]}<span class="form">{letter[p]}</span>{/if}
								{/each}
							</span>
							<span class="name">{letter.name} 🔊</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</GameResults>
{:else}
	<div class="game" style="--accent:{accent}; --deep:{deep};">
		<p class="progress">Letter {index + 1} of {questions.length}</p>

		{#if question.kind === 'form-to-letter'}
			<p class="ask">Which letter is this, written {POSITION_LABEL[question.position]}?</p>
			<div class="prompt" lang="ar">{formOf(question.letter, question.position)}</div>
		{:else if question.kind === 'letter-to-form'}
			<p class="ask">
				How is <span lang="ar">{question.letter.isolated}</span> written {POSITION_LABEL[
					question.position
				]}?
			</p>
			<div class="prompt" lang="ar">{question.letter.isolated}</div>
		{:else}
			<p class="ask">Which letter do you hear?</p>
			<button type="button" class="prompt sound" onclick={() => play(question.letter)}>
				🔊 <span class="sr-only">Play the sound again</span>
			</button>
		{/if}

		<div class="options" dir="rtl">
			{#each question.options as option, i (i)}
				<button
					type="button"
					class="option"
					lang="ar"
					class:right={picked !== null && i === question.answer}
					class:wrong={picked === i && i !== question.answer}
					disabled={picked !== null}
					onclick={() => pick(i)}
				>
					{typeof option === 'string' ? option : option.isolated}
				</button>
			{/each}
		</div>

		{#if picked !== null}
			<div class="reveal" class:ok={picked === question.answer}>
				<p class="verdict">
					{picked === question.answer ? '✓ Correct!' : '✗ Not this time.'}
					It's <strong>{question.letter.name}</strong>:
					<span class="all-forms" lang="ar" dir="rtl">
						{question.letter.isolated}
						{#each ['start', 'middle', 'end'] as const as p (p)}
							{#if question.letter[p]}&nbsp;{question.letter[p]}{/if}
						{/each}
					</span>
				</p>
				<PressButton onclick={next} {accent} {deep}>
					{index + 1 < questions.length ? 'Next letter' : 'See results'}
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
		place-items: center;
		min-height: 8rem;
		border-radius: 1.25rem;
		border: 2px solid color-mix(in srgb, var(--accent) 40%, var(--tile5));
		background: color-mix(in srgb, var(--accent) 6%, var(--tile2));
		font-size: 4.5rem;
		line-height: 1;
		color: var(--text1);
	}

	.sound {
		font-size: 3rem;
		cursor: pointer;
	}

	.sound:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.options {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.6rem;
	}

	.option {
		min-height: 4.5rem;
		border-radius: 1.1rem;
		font-size: 2.2rem;
		color: var(--text1);
		border: 2px solid color-mix(in srgb, var(--accent) 40%, var(--tile5));
		background: var(--tile3);
		box-shadow: 0 4px 0 color-mix(in srgb, var(--deep) 55%, transparent);
		cursor: pointer;
		transition: transform 0.12s ease;
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

	.all-forms {
		font-size: 1.4rem;
	}

	.list-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text1);
		margin-bottom: 0.6rem;
	}

	.missed {
		display: grid;
		gap: 0.45rem;
	}

	.missed-letter {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		gap: 0.8rem;
		border-radius: 0.9rem;
		background: var(--tile3);
		border: 2px solid var(--tile5);
		padding: 0.55rem 0.8rem;
		cursor: pointer;
	}

	.forms {
		display: flex;
		gap: 0.7rem;
		font-size: 1.6rem;
		color: var(--text1);
	}

	.form {
		color: var(--text2);
	}

	.name {
		font-size: 0.85rem;
		font-weight: 600;
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
