<script lang="ts">
	import { type Dialect } from '$lib/types/index';
	import type { SentenceItem } from '$lib/schemas/lesson-v2-schema';
	import AudioButton from '$lib/components/AudioButton.svelte';

	type McqOption = SentenceItem & { isCorrect: boolean };

	interface Props {
		mode: 'multiple-choice' | 'translate';
		prompt?: string;
		sentence?: SentenceItem;
		options: McqOption[];
		correctIndex: number;
		dialect: Dialect;
		showTransliteration: boolean;
		onContinue: () => void;
	}

	let { mode, prompt, sentence, options, correctIndex, dialect, showTransliteration, onContinue }: Props =
		$props();

	let selectedIndex = $state<number | null>(null);
	let isChecked = $state(false);
	let isRight = $derived(isChecked && selectedIndex === correctIndex);

	const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

	function pickOption(i: number) {
		if (isChecked) return;
		selectedIndex = i;
	}
	function checkAnswer() {
		if (selectedIndex === null) return;
		isChecked = true;
	}
</script>

<div class="mcq">
	{#if mode === 'translate' && sentence}
		<div class="eyebrow">Translate</div>
		<div class="prompt-ar" dir="rtl">{sentence.arabicTashkeel || sentence.arabic}</div>
		{#if showTransliteration}<div class="prompt-tr">{sentence.transliteration}</div>{/if}
		<div class="prompt-audio"><AudioButton text={sentence.arabic} {dialect} /></div>
		<p class="ask">What does it mean?</p>
	{:else}
		<div class="eyebrow">Quiz</div>
		<h2 class="ask big">{prompt}</h2>
	{/if}

	<div class="options">
		{#each options as opt, i (i)}
			<button
				class="opt"
				class:selected={selectedIndex === i}
				class:correct={isChecked && i === correctIndex}
				class:wrong={isChecked && selectedIndex === i && i !== correctIndex}
				class:dim={isChecked && i !== correctIndex && selectedIndex !== i}
				style="--i:{i}"
				disabled={isChecked}
				onclick={() => pickOption(i)}
			>
				<span class="badge">
					{#if isChecked && i === correctIndex}✓
					{:else if isChecked && selectedIndex === i}✕
					{:else}{LETTERS[i]}{/if}
				</span>
				<span class="opt-body">
					{#if mode === 'translate'}
						<span class="opt-text">{opt.english}</span>
					{:else}
						<span class="opt-text" dir="rtl">{opt.arabicTashkeel || opt.arabic}</span>
						{#if showTransliteration}<span class="opt-sub">{opt.transliteration}</span>{/if}
					{/if}
				</span>
			</button>
		{/each}
	</div>

	{#if isChecked}
		<p class="feedback {isRight ? 'good' : 'bad'}">
			{isRight ? '✓ Correct!' : '✕ Not quite — the right answer is highlighted.'}
		</p>
		<button class="primary" onclick={onContinue}>Continue</button>
	{:else}
		<button class="primary" disabled={selectedIndex === null} onclick={checkAnswer}>Check</button>
	{/if}
</div>

<style>
	/* --accent/--deep and --go/--go-deep come from LessonPlayerV2. */
	.mcq {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.eyebrow {
		align-self: flex-start;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text1);
		background: color-mix(in srgb, var(--accent, var(--brand)) 16%, var(--tile3));
		border-radius: 100px;
		padding: 0.22rem 0.65rem;
	}
	.ask {
		font-weight: 600;
		text-align: center;
		color: var(--text1);
	}
	.ask.big {
		margin-top: -0.3rem;
		font-size: 1.3rem;
		line-height: 1.3;
		letter-spacing: -0.01em;
	}
	.prompt-ar {
		font-size: 2.1rem;
		font-weight: 600;
		line-height: 1.35;
		text-align: center;
		color: var(--text1);
	}
	.prompt-tr {
		font-weight: 600;
		text-align: center;
		color: var(--text2);
	}
	.prompt-audio {
		display: flex;
		justify-content: center;
	}

	/* Options: pick cards, as on /speak */
	.options {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		margin-top: 0.2rem;
	}
	.opt {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 0.9rem 1rem;
		text-align: left;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile2);
		box-shadow: 0 3px 0 var(--tile5);
		cursor: pointer;
		transition:
			transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1),
			border-color 0.16s ease,
			background 0.16s ease,
			box-shadow 0.16s ease,
			opacity 0.2s ease;
		animation: optIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: calc(var(--i, 0) * 55ms + 60ms);
	}
	@keyframes optIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	.opt:not(:disabled):hover {
		transform: translateY(-2px);
		border-color: var(--accent, var(--brand));
		box-shadow: 0 5px 0 var(--deep, var(--tile6));
	}
	.opt:not(:disabled):active {
		transform: translateY(2px);
		box-shadow: 0 1px 0 var(--deep, var(--tile6));
	}
	.opt:disabled {
		cursor: default;
	}
	.opt:focus-visible,
	.primary:focus-visible {
		outline: 2px solid var(--text1);
		outline-offset: 3px;
	}
	.badge {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
		background: var(--tile4);
		transition:
			background 0.16s ease,
			color 0.16s ease;
	}
	.opt-body {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}
	.opt-text {
		font-size: 1.25rem;
		line-height: 1.3;
		color: var(--text1);
	}
	.opt-sub {
		font-size: 0.85rem;
		color: var(--text2);
	}
	.opt.selected {
		border-color: var(--accent, var(--brand));
		background: color-mix(in srgb, var(--accent, var(--brand)) 12%, var(--tile2));
		box-shadow: 0 3px 0 var(--deep, var(--tile6));
	}
	.opt.selected .badge {
		background: var(--accent, var(--brand));
		color: #fff;
	}
	.opt.correct {
		border-color: #2e9e5b;
		background: color-mix(in srgb, #2e9e5b 14%, var(--tile2));
		box-shadow: 0 3px 0 #1f7a44;
	}
	.opt.correct .badge {
		background: #2e9e5b;
		color: #fff;
	}
	.opt.wrong {
		border-color: #d65745;
		background: color-mix(in srgb, #d65745 14%, var(--tile2));
		box-shadow: 0 3px 0 #a8402f;
	}
	.opt.wrong .badge {
		background: #d65745;
		color: #fff;
	}
	.opt.dim {
		opacity: 0.5;
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

	@media (prefers-reduced-motion: reduce) {
		.opt {
			animation: none;
			transition: none;
		}
		.opt:not(:disabled):hover,
		.opt:not(:disabled):active {
			transform: none;
		}
	}
</style>
