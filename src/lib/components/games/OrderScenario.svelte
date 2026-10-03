<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import GameResults from './GameResults.svelte';
	import GameWordList from './GameWordList.svelte';
	import PressButton from './PressButton.svelte';
	import SpeakAnswer from './SpeakAnswer.svelte';
	import { awardGameXp } from '$lib/games/game-xp';
	import { shuffle } from '$lib/games/shuffle';
	import type { GameDialect } from '$lib/games/themes';
	import type { Level } from '$lib/games/room-hunt/round';
	import { wordFor } from '$lib/games/room-hunt/round';
	import { playClip, stopClip } from '$lib/games/room-hunt/audio';
	import type { RoomScene } from '$lib/games/room-hunt/scene';
	import {
		ORDER_TURNS,
		STAGE,
		WAITER,
		characterUrl,
		createOrder,
		currentTurn,
		hintedLine,
		lineFor,
		orderDone,
		reply,
		type Choice
	} from '$lib/games/room-hunt/order';

	interface Props {
		scene: RoomScene;
		dialect: GameDialect;
		level: Level;
		/** Show transliteration (the parent's level and toggle decide). */
		translit: boolean;
		muted: boolean;
		signedIn: boolean;
		isSubscribed: boolean;
		accent: string;
		deep: string;
		/** "Ordering · 3 of 7", for the parent's top bar. */
		progress?: string;
		onRestart: () => void;
		onExit: () => void;
	}

	let {
		scene,
		dialect,
		level,
		translit,
		muted,
		signedIn,
		isSubscribed,
		accent,
		deep,
		progress = $bindable(''),
		onRestart,
		onExit
	}: Props = $props();

	const WAITER_KEY = 'waiter';

	let order = $state(createOrder());
	let stage = $state<'arriving' | 'busy' | 'choosing' | 'done'>('arriving');
	/** The waiter's line on show, as a caption at the top of the screen. */
	let bubble = $state<string | null>(null);
	/** The player's reply, as a subtitle while it plays. */
	let saying = $state<string | null>(null);
	let choices = $state<Choice[]>([]);
	let feedback = $state<{ kind: 'wrong' | 'hint'; line?: string; heard?: string } | null>(null);
	/** On Hard the waiter's words show only after the reply. */
	let revealed = $state(false);
	let xpEarned = $state(0);
	let canSpeak = $state(true);
	let speakNote = $state('');
	let announcement = $state('');
	let cancelled = false;

	const hinted = $derived(hintedLine(order));
	const bubbleText = $derived(level !== 'hard' || revealed);
	const firstTry = $derived(Object.values(order.outcomes).filter((o) => o === 'first').length);
	const phrases = $derived([...new Set(order.said)].map((id) => lineFor(id, dialect)));

	$effect(() => {
		progress =
			stage === 'done'
				? 'Ordering · done'
				: `Ordering · ${Math.min(order.turn + 1, ORDER_TURNS.length)} of ${ORDER_TURNS.length}`;
	});

	onMount(() => {
		setup();
		return () => {
			cancelled = true;
			stopClip();
			scene.clearCharacters();
			scene.clearSpawned();
			scene.setHidden([]);
			scene.resetPose();
		};
	});

	const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	/** Plays a line and waits for it; when muted, pauses long enough to read it. */
	async function speak(url: string) {
		const minimum = wait(muted ? 1600 : 250);
		if (!muted) await playClip(url);
		await minimum;
	}

	async function setup() {
		const d = untrack(() => dialect);
		const [doorX, doorZ] = STAGE.door;
		scene.setHidden(STAGE.clearTable);
		scene.setPose(STAGE.seat);
		await Promise.all([
			scene.addCharacter(WAITER_KEY, characterUrl(WAITER[d].model), {
				at: [doorX, 0, doorZ],
				scale: STAGE.characterScale
			}),
			...STAGE.diners.map(async (diner, i) => {
				await scene.addCharacter(`diner-${i}`, characterUrl(diner.model), {
					at: diner.at,
					rot: diner.rot,
					scale: STAGE.characterScale
				});
				scene.playAnimation(`diner-${i}`, 'sit');
			})
		]);
		if (cancelled) return;
		await scene.walkTo(WAITER_KEY, STAGE.route);
		if (cancelled) return;
		faceGuest();
		await waiterSays(currentTurn(order)!.waiter);
		ask();
	}

	function faceGuest() {
		scene.faceCharacter(WAITER_KEY, STAGE.seat.at[0], STAGE.seat.at[2]);
	}

	async function waiterSays(id: string) {
		if (cancelled) return;
		bubble = id;
		revealed = false;
		const line = lineFor(id, dialect);
		announcement = level === 'hard' ? 'The waiter speaks.' : `Waiter: ${line.arabic}. ${line.english}`;
		await speak(line.audioUrl);
	}

	function ask() {
		if (cancelled) return;
		choices = shuffle(currentTurn(order)!.choices);
		stage = 'choosing';
	}

	async function answer(line: string, heard?: string) {
		if (stage !== 'choosing') return;
		stage = 'busy';
		feedback = null;
		revealed = true;
		saying = line;
		const result = reply(order, line);
		await speak(lineFor(line, dialect).audioUrl);
		saying = null;
		if (cancelled) return;

		if (result.result !== 'ok') {
			scene.playAnimation(WAITER_KEY, 'emote-no', { once: true, then: 'idle' });
			feedback = { kind: result.result, line, heard };
			const question = bubble;
			await waiterSays('w_sorry');
			// Back to the question, without saying it again: the replay button is there.
			bubble = question;
			revealed = true;
			stage = 'choosing';
			return;
		}

		if (result.xp && signedIn) {
			awardGameXp();
			xpEarned++;
		}
		scene.playAnimation(WAITER_KEY, 'emote-yes', { once: true, then: 'idle' });

		if (result.fetch) await fetchOrder(result.fetch);
		if (cancelled) return;

		if (orderDone(order)) {
			bubble = null;
			stage = 'done';
			return;
		}
		await waiterSays(currentTurn(order)!.waiter);
		ask();
	}

	/** Off to the kitchen and back with the dishes. */
	async function fetchOrder(dishes: string[]) {
		await waiterSays('w_coming');
		bubble = null;
		const back = [...STAGE.route].reverse().slice(1);
		await scene.walkTo(WAITER_KEY, [...back, STAGE.door]);
		if (cancelled) return;
		scene.setCharacterVisible(WAITER_KEY, false);
		await wait(1200);
		if (cancelled) return;
		scene.setCharacterVisible(WAITER_KEY, true);
		await scene.walkTo(WAITER_KEY, STAGE.route);
		if (cancelled) return;
		scene.faceCharacter(WAITER_KEY, 0.35, 1.45);
		const reach = scene.playAnimation(WAITER_KEY, 'interact-right', { once: true, then: 'idle' });
		await wait(350);
		for (const dish of dishes) scene.spawn(dish, STAGE.serve[dish]);
		await reach;
		faceGuest();
	}

	function spoken(index: number, heard: string) {
		if (index >= 0) answer(choices[index].line, heard);
		else feedback = { kind: 'wrong', heard: heard || '…' };
	}
</script>

<p class="sr-only" aria-live="polite">{announcement}</p>

{#snippet play(url: string, label: string)}
	<button
		type="button"
		class="play"
		onclick={(event) => {
			event.stopPropagation();
			playClip(url);
		}}
		aria-label={label}
	>
		<svg viewBox="0 0 24 24" aria-hidden="true"
			><path
				d="M3 10v4a1 1 0 0 0 1 1h3l4 4a1 1 0 0 0 1.7-.7V5.7A1 1 0 0 0 11 5L7 9H4a1 1 0 0 0-1 1zm13.5 2A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"
			/></svg
		>
	</button>
{/snippet}

{#if bubble && stage !== 'done'}
	{@const line = lineFor(bubble, dialect)}
	<div class="caption">
		<div class="caption-head">
			<span class="who">Waiter</span>
			{@render play(line.audioUrl, 'Hear the waiter again')}
		</div>
		{#if bubbleText}
			<p class="caption-ar" lang="ar" dir="rtl">{line.arabic}</p>
			{#if translit}<p class="caption-tr">{line.transliteration}</p>{/if}
			<p class="caption-en">{line.english}</p>
		{:else}
			<p class="caption-listen">🎧 Listen, then reply. The words show after.</p>
		{/if}
	</div>
{/if}

{#if saying}
	{@const line = lineFor(saying, dialect)}
	<p class="saying" aria-hidden="true">
		<span class="you">You:</span>
		<span lang="ar" dir="rtl">{line.arabic}</span>
	</p>
{/if}

{#if stage === 'choosing'}
	<div class="reply" style="--accent:{accent};">
		<div class="reply-head">
			<p class="reply-label">Your reply</p>
			{#if canSpeak}
				{#key order.turn}
					<SpeakAnswer
						compact
						targets={choices.map((c) => lineFor(c.line, dialect).arabic)}
						{dialect}
						onResult={spoken}
						onUnavailable={(reason) => {
							canSpeak = false;
							speakNote = reason;
						}}
					/>
				{/key}
			{/if}
		</div>
		<div class="options">
			{#each choices as choice (choice.line)}
				{@const line = lineFor(choice.line, dialect)}
				<div class="option-wrap">
					{@render play(line.audioUrl, `Hear "${line.english}"`)}
					<button
						type="button"
						class="option"
						class:hinted={hinted === choice.line}
						onclick={() => answer(choice.line)}
					>
						<span class="option-ar" lang="ar" dir="rtl">{line.arabic}</span>
						{#if translit || level === 'easy'}
							<span class="option-sub">
								{#if translit}<i>{line.transliteration}</i>{/if}
								{#if translit && level === 'easy'}·{/if}
								{#if level === 'easy'}{line.english}{/if}
							</span>
						{/if}
					</button>
				</div>
			{/each}
		</div>
		{#if speakNote}<p class="note">{speakNote}</p>{/if}
		{#if feedback}
			<p class="feedback" class:hint={feedback.kind === 'hint'} role="status">
				{#if feedback.heard}We heard <span lang="ar" dir="rtl">{feedback.heard}</span>.{/if}
				{#if feedback.line}That doesn't fit here.{/if}
				{#if feedback.kind === 'hint'}A good reply is marked.{:else if !feedback.line}Try again, or tap a reply.{/if}
			</p>
		{/if}
	</div>
{:else if stage === 'arriving'}
	<p class="status-chip">The waiter is coming over…</p>
{/if}

{#if stage === 'done'}
	<div class="results-layer">
		<div class="results-inner">
			<GameResults
				heading="Dinner ordered in Arabic!"
				stats={[
					{ label: 'First try', value: `${firstTry}/${ORDER_TURNS.length}` },
					{
						label: 'With a hint',
						value: Object.values(order.outcomes).filter((o) => o === 'hinted').length
					}
				]}
				{xpEarned}
				{accent}
				{deep}
				onPlayAgain={onRestart}
				playAgainLabel="Order again"
			>
				<div class="receipt">
					<h3>Your order</h3>
					<ul>
						{#each order.served as id (id)}
							{@const word = wordFor(id, dialect)}
							<li>
								<span lang="ar" dir="rtl">{word.arabic}</span>
								<span class="receipt-en">{word.english}</span>
							</li>
						{/each}
					</ul>
				</div>
				<div class="more">
					<PressButton quiet onclick={onExit}>Back to the room</PressButton>
				</div>
				<GameWordList words={phrases} {dialect} {isSubscribed} {signedIn} />
			</GameResults>
		</div>
	</div>
{/if}

<style>
	.caption {
		position: absolute;
		top: calc(max(0.75rem, env(safe-area-inset-top)) + 3.1rem);
		left: 50%;
		transform: translateX(-50%);
		width: min(30rem, calc(100% - 1.5rem));
		padding: 0.55rem 0.9rem 0.65rem;
		border-radius: 1rem;
		background: rgb(255 255 255 / 0.95);
		color: #1f2937;
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.2);
		text-align: center;
		animation: rise 0.2s ease-out both;
	}

	.caption-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.who {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #6b7280;
	}

	.caption-ar {
		margin-top: -0.4rem;
		font-size: 1.35rem;
		font-weight: 600;
		line-height: 1.5;
	}

	.caption-tr {
		font-size: 0.82rem;
		font-style: italic;
		color: #4b5563;
	}

	.caption-en {
		font-size: 0.85rem;
		color: #374151;
	}

	.caption-listen {
		font-weight: 600;
	}

	.play {
		display: inline-grid;
		place-items: center;
		flex-shrink: 0;
		width: 1.8rem;
		height: 1.8rem;
		border-radius: 50%;
		color: inherit;
		background: rgb(0 0 0 / 0.06);
		cursor: pointer;
	}

	.play svg {
		width: 0.95rem;
		height: 0.95rem;
		fill: currentColor;
	}

	.saying {
		position: absolute;
		left: 50%;
		bottom: max(1.2rem, env(safe-area-inset-bottom));
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 100px;
		font-size: 1.15rem;
		font-weight: 600;
		color: #fff;
		background: rgb(0 0 0 / 0.6);
		white-space: nowrap;
	}

	.you {
		font-size: 0.8rem;
		opacity: 0.8;
	}

	.reply {
		position: absolute;
		left: 50%;
		bottom: max(0.75rem, env(safe-area-inset-bottom));
		transform: translateX(-50%);
		width: min(28rem, calc(100% - 1.5rem));
		display: grid;
		gap: 0.4rem;
		padding: 0.55rem 0.7rem 0.65rem;
		border-radius: 1.1rem;
		background: color-mix(in srgb, var(--tile3) 93%, transparent);
		border: 2px solid var(--tile5);
		box-shadow: 0 10px 30px rgb(0 0 0 / 0.25);
		backdrop-filter: blur(8px);
	}

	.reply-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.reply-label {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--accent);
	}

	.options {
		display: grid;
		gap: 0.3rem;
	}

	.option-wrap {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		color: var(--text1);
	}

	.option {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: row-reverse;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.6rem;
		padding: 0.25rem 0.7rem;
		border-radius: 0.75rem;
		color: var(--text1);
		background: var(--tile2, var(--tile3));
		border: 2px solid var(--tile5);
		cursor: pointer;
		transition: border-color 0.15s ease;
	}

	.option:hover {
		border-color: var(--accent);
	}

	.option.hinted {
		border-color: #f59e0b;
		box-shadow: 0 0 0 3px rgb(245 158 11 / 0.35);
	}

	.option-ar {
		flex-shrink: 0;
		font-size: 1.1rem;
		font-weight: 600;
		line-height: 1.6;
	}

	.option-sub {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.75rem;
		color: var(--text2);
		text-align: left;
	}

	.note {
		font-size: 0.8rem;
		color: var(--text2);
	}

	.feedback {
		border-radius: 0.8rem;
		padding: 0.45rem 0.75rem;
		font-size: 0.88rem;
		color: var(--text1);
		background: color-mix(in srgb, #f43f5e 14%, var(--tile3));
	}

	.feedback.hint {
		background: color-mix(in srgb, #f59e0b 18%, var(--tile3));
	}

	.status-chip {
		position: absolute;
		left: 50%;
		bottom: max(1.2rem, env(safe-area-inset-bottom));
		transform: translateX(-50%);
		padding: 0.45rem 1rem;
		border-radius: 100px;
		font-size: 0.9rem;
		font-weight: 600;
		color: #fff;
		background: rgb(0 0 0 / 0.5);
		white-space: nowrap;
	}

	.results-layer {
		position: absolute;
		inset: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 4.5rem 0.75rem max(1.5rem, env(safe-area-inset-bottom));
		background: rgb(0 0 0 / 0.45);
	}

	.results-inner {
		max-width: 40rem;
		margin: 0 auto;
		background: var(--tile2, var(--tile3));
		border-radius: 1.4rem;
	}

	.receipt {
		margin-bottom: 1.1rem;
		padding: 0.8rem 1rem;
		border-radius: 0.9rem;
		border: 2px dashed var(--tile5);
		background: var(--tile3);
	}

	.receipt h3 {
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text2);
		margin-bottom: 0.4rem;
	}

	.receipt li {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.2rem 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text1);
	}

	.receipt-en {
		font-size: 0.85rem;
		font-weight: 400;
		color: var(--text2);
	}

	.more {
		margin-bottom: 1.2rem;
	}

	/* Wide screens: the waiter's words top left, your reply bottom right, the
	   table and the waiter in between. */
	@media (min-width: 760px) {
		.caption {
			left: 1rem;
			transform: none;
			width: min(26rem, 40%);
			text-align: left;
		}

		.caption-ar {
			text-align: right;
		}

		.reply {
			left: auto;
			right: 1rem;
			transform: none;
			width: min(26rem, 42%);
		}
	}

	@keyframes rise {
		from {
			opacity: 0;
			translate: 0 4px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.caption {
			animation: none;
		}
	}
</style>
