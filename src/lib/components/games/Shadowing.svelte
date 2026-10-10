<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import GameResults from './GameResults.svelte';
	import PressButton from './PressButton.svelte';
	import SpeakAnswer from './SpeakAnswer.svelte';
	import { awardGameXp } from '$lib/games/game-xp';
	import { buildRound, rate, type Rating, type ShadowLine } from '$lib/games/shadowing';
	import type { GameDialect } from '$lib/games/themes';
	import { scorePronunciation } from '$lib/utils/pronunciation';

	interface Props {
		dialect: GameDialect;
		signedIn: boolean;
		accent: string;
		deep: string;
		onPlayAgain: () => void;
	}

	let { dialect, signedIn, accent, deep, onPlayAgain }: Props = $props();

	const RATING_LABEL: Record<Rating, string> = {
		great: 'Great',
		good: 'Good',
		again: 'Try once more'
	};

	let lines = $state<ShadowLine[]>(untrack(() => buildRound(dialect)));
	let index = $state(0);
	/** Best score per line id. */
	let best = $state<Record<string, number>>({});
	let last = $state<{ score: number; heard: string } | null>(null);
	let attempts = $state(0);
	let unavailable = $state('');
	let xpEarned = $state(0);
	let announcement = $state('');
	let audio: HTMLAudioElement | null = null;

	const line = $derived(lines[index]);
	const done = $derived(index >= lines.length);
	const scored = $derived(Object.values(best));
	const average = $derived(
		scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : 0
	);

	onDestroy(() => audio?.pause());

	function play(url: string) {
		audio?.pause();
		audio = new Audio(url);
		audio.play().catch(() => {});
	}

	onMount(() => play(lines[0].audioUrl));

	function onResult(_: number, heard: string) {
		const score = scorePronunciation(line.arabic, heard, dialect);
		const firstPass = (best[line.id] ?? 0) < 50 && score >= 50;
		best[line.id] = Math.max(best[line.id] ?? 0, score);
		last = { score, heard };
		attempts++;
		announcement = `${score} out of 100. ${RATING_LABEL[rate(score)]}.`;
		if (firstPass && signedIn) {
			awardGameXp();
			xpEarned++;
		}
	}

	function next() {
		index++;
		last = null;
		attempts = 0;
		announcement = '';
		if (index < lines.length) play(lines[index].audioUrl);
	}
</script>

<p class="sr-only" aria-live="polite">{announcement}</p>

{#if done}
	<GameResults
		heading={scored.length ? `Average score: ${average}` : 'Round finished'}
		stats={[
			{ label: 'Lines', value: lines.length },
			{ label: 'Average', value: scored.length ? average : '–' }
		]}
		{xpEarned}
		{accent}
		{deep}
		{onPlayAgain}
		playAgainLabel="New lines"
	>
		<ul class="list">
			{#each lines as l (l.id)}
				<li class="row">
					<button type="button" class="mini-play" onclick={() => play(l.audioUrl)} aria-label="Play">
						🔊
					</button>
					<span class="row-text">
						<span class="ar" lang="ar" dir="rtl">{l.arabic}</span>
						<span class="en">{l.english}</span>
					</span>
					<span class="row-score">{best[l.id] ?? '–'}</span>
				</li>
			{/each}
		</ul>
	</GameResults>
{:else}
	<div class="game" style="--accent:{accent}; --deep:{deep};">
		<p class="progress">Line {index + 1} of {lines.length} · from {line.source}</p>

		<div class="line">
			<button type="button" class="listen" onclick={() => play(line.audioUrl)}>
				🔊 Listen
			</button>
			<p class="ar" lang="ar" dir="rtl">{line.arabic}</p>
			<p class="tr">{line.transliteration}</p>
			<p class="en">{line.english}</p>
		</div>

		{#if unavailable}
			<p class="note" role="status">{unavailable} You can still listen and repeat along.</p>
		{:else}
			<p class="ask">Listen, then say it the same way.</p>
			{#key `${line.id}-${attempts}`}
				<SpeakAnswer
					targets={[line.arabic]}
					{dialect}
					{onResult}
					onUnavailable={(reason) => (unavailable = reason)}
				/>
			{/key}
		{/if}

		{#if last}
			<div class="score {rate(last.score)}">
				<span class="number">{last.score}</span>
				<span class="label">{RATING_LABEL[rate(last.score)]}</span>
				{#if last.heard}
					<span class="heard">We heard: <span lang="ar" dir="rtl">{last.heard}</span></span>
				{/if}
			</div>
		{/if}

		<div class="actions">
			<PressButton onclick={next} {accent} {deep} quiet={!last && !unavailable}>
				{index + 1 < lines.length ? (last || unavailable ? 'Next line' : 'Skip') : 'See results'}
			</PressButton>
		</div>
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

	.line {
		display: grid;
		justify-items: center;
		gap: 0.35rem;
		text-align: center;
		border-radius: 1.25rem;
		border: 2px solid color-mix(in srgb, var(--accent) 40%, var(--tile5));
		background: color-mix(in srgb, var(--accent) 6%, var(--tile2));
		padding: 1.1rem 1rem;
	}

	.listen {
		min-height: 2.6rem;
		padding: 0.4rem 1rem;
		border-radius: 100px;
		font-weight: 600;
		color: #fff;
		background: var(--accent);
		box-shadow: 0 3px 0 var(--deep);
		cursor: pointer;
	}

	.listen:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.line .ar {
		font-size: clamp(1.6rem, 6vw, 2.1rem);
		font-weight: 600;
		line-height: 1.5;
		color: var(--text1);
	}

	.tr {
		font-size: 0.9rem;
		font-style: italic;
		color: var(--text2);
	}

	.en {
		font-size: 0.95rem;
		color: var(--text1);
	}

	.ask {
		text-align: center;
		font-weight: 600;
		color: var(--text1);
	}

	.note {
		font-size: 0.9rem;
		color: var(--text2);
		text-align: center;
	}

	.score {
		display: grid;
		justify-items: center;
		gap: 0.15rem;
		border-radius: 1.1rem;
		border: 2px solid #f43f5e;
		background: color-mix(in srgb, #f43f5e 8%, var(--tile3));
		padding: 0.9rem;
	}

	.score.good {
		border-color: #f59e0b;
		background: color-mix(in srgb, #f59e0b 10%, var(--tile3));
	}

	.score.great {
		border-color: #10b981;
		background: color-mix(in srgb, #10b981 10%, var(--tile3));
	}

	.number {
		font-size: 2.2rem;
		font-weight: 700;
		color: var(--text1);
	}

	.label {
		font-weight: 600;
		color: var(--text1);
	}

	.heard {
		font-size: 0.85rem;
		color: var(--text2);
	}

	.actions {
		display: flex;
		justify-content: center;
	}

	.list {
		display: grid;
		gap: 0.45rem;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		border-radius: 0.9rem;
		background: var(--tile3);
		border: 2px solid var(--tile5);
		padding: 0.55rem 0.8rem;
	}

	.mini-play {
		cursor: pointer;
	}

	.row-text {
		display: grid;
		flex: 1;
		min-width: 0;
	}

	.row .ar {
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--text1);
	}

	.row .en {
		font-size: 0.82rem;
		color: var(--text2);
	}

	.row-score {
		font-weight: 700;
		color: var(--text1);
	}
</style>
