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
	.mcq {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.eyebrow {
		font-size: 0.7rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		color: var(--brand);
	}
	.ask {
		color: var(--text1);
		font-weight: 600;
	}
	.ask.big {
		font-size: 1.3rem;
		letter-spacing: -0.01em;
		line-height: 1.3;
		margin-top: -0.3rem;
	}
	.prompt-ar {
		font-size: 2.1rem;
		font-weight: 600;
		color: var(--text1);
		text-align: center;
		line-height: 1.35;
	}
	.prompt-tr {
		text-align: center;
		color: var(--brand);
		font-weight: 600;
	}
	.prompt-audio {
		display: flex;
		justify-content: center;
	}
	.ask {
		text-align: center;
	}

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
		text-align: left;
		background: var(--tile1);
		border: 1.5px solid var(--tile4);
		border-radius: 1rem;
		padding: 0.9rem 1rem;
		cursor: pointer;
		transition:
			transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1),
			border-color 0.16s ease,
			background 0.16s ease,
			opacity 0.2s ease;
		animation: optIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: calc(var(--i, 0) * 55ms + 60ms);
	}
	@keyframes optIn {
		from {
			opacity: 0;
			transform: translateX(-10px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	.opt:not(:disabled):hover {
		transform: translateY(-2px);
		border-color: color-mix(in srgb, var(--brand) 55%, var(--tile4));
	}
	.opt:disabled {
		cursor: default;
	}
	.badge {
		flex-shrink: 0;
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--tile3);
		color: var(--text2);
		font-weight: 800;
		font-size: 0.85rem;
		transition: all 0.16s ease;
	}
	.opt-body {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}
	.opt-text {
		font-size: 1.25rem;
		color: var(--text1);
		line-height: 1.3;
	}
	.opt-sub {
		font-size: 0.85rem;
		color: var(--text3);
	}
	.opt.selected {
		border-color: var(--brand);
		background: color-mix(in srgb, var(--brand) 8%, var(--tile1));
	}
	.opt.selected .badge {
		background: var(--brand);
		color: #fff;
	}
	.opt.correct {
		border-color: #2e9e5b;
		background: color-mix(in srgb, #2e9e5b 14%, var(--tile1));
	}
	.opt.correct .badge {
		background: #2e9e5b;
		color: #fff;
	}
	.opt.wrong {
		border-color: #d65745;
		background: color-mix(in srgb, #d65745 14%, var(--tile1));
	}
	.opt.wrong .badge {
		background: #d65745;
		color: #fff;
	}
	.opt.dim {
		opacity: 0.5;
	}
	.feedback {
		font-weight: 700;
		text-align: center;
	}
	.feedback.good {
		color: #2e9e5b;
	}
	.feedback.bad {
		color: #d65745;
	}
	.primary {
		align-self: stretch;
		background: var(--brand);
		color: #fff;
		border: none;
		border-radius: 1rem;
		padding: 0.95rem 1.2rem;
		font-weight: 700;
		font-size: 1rem;
		cursor: pointer;
		box-shadow: 0 10px 24px -10px var(--brand);
		transition:
			transform 0.16s ease,
			box-shadow 0.16s ease,
			filter 0.16s ease;
	}
	.primary:not(:disabled):hover {
		transform: translateY(-2px);
		box-shadow: 0 16px 30px -12px var(--brand);
		filter: brightness(1.06);
	}
	.primary:disabled {
		opacity: 0.45;
		cursor: default;
	}
	@media (prefers-reduced-motion: reduce) {
		.opt {
			animation: none;
			transition: none;
		}
	}
</style>
