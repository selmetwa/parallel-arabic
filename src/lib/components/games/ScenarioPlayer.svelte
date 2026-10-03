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
	import { playClip, stopClip } from '$lib/games/room-hunt/audio';
	import type { Pose, RoomScene } from '$lib/games/room-hunt/scene';
	import type { ScenarioEntry } from '$lib/games/room-hunt/scenarios/index';
	import {
		createScenarioState,
		currentTurn,
		hintedLine,
		itemLine,
		lineFor,
		reply,
		scenarioDone,
		type Choice
	} from '$lib/games/room-hunt/scenarios/scenario';
	import { CHARACTER_SCALE, characterUrl } from '$lib/games/room-hunt/scenarios/stage';

	interface Props {
		scene: RoomScene;
		/** The scenario and its staging. Its setting must already be loaded in `scene`. */
		entry: ScenarioEntry;
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
		/** Where the camera goes when the conversation ends; the room's centre if unset. */
		restPose?: Pose;
		exitLabel?: string;
		onRestart: () => void;
		onExit: () => void;
	}

	let {
		scene,
		entry,
		dialect,
		level,
		translit,
		muted,
		signedIn,
		isSubscribed,
		accent,
		deep,
		progress = $bindable(''),
		restPose,
		exitLabel = 'Back to the room',
		onRestart,
		onExit
	}: Props = $props();

	const NPC = 'npc';
	const VEHICLE = 'vehicle';

	// Fixed for the life of this player: the parent re-keys it to change scenario.
	const scenario = untrack(() => entry.scenario);
	const stage = untrack(() => entry.stage);
	const sorryLine = Object.keys(scenario.lines).find(
		(id) => scenario.lines[id].speaker === 'npc' && id.endsWith('_sorry')
	)!;
	const role = scenario.npcRole;

	let talk = $state(createScenarioState());
	let step = $state<'arriving' | 'busy' | 'choosing' | 'done'>('arriving');
	/** The other person's line on show, as a caption at the top of the screen. */
	let bubble = $state<string | null>(null);
	/** The player's reply, as a subtitle while it plays. */
	let saying = $state<string | null>(null);
	let choices = $state<Choice[]>([]);
	let feedback = $state<{ kind: 'wrong' | 'hint'; line?: string; heard?: string } | null>(null);
	/** On Hard the other person's words show only after the reply. */
	let revealed = $state(false);
	let xpEarned = $state(0);
	let canSpeak = $state(true);
	let speakNote = $state('');
	let announcement = $state('');
	let cancelled = false;
	/** Where the player is now (the taxi moves them). */
	let pose: Pose = stage.pose;

	const turns = scenario.turns.length;
	const hinted = $derived(hintedLine(scenario, talk));
	const bubbleText = $derived(level !== 'hard' || revealed);
	const firstTry = $derived(Object.values(talk.outcomes).filter((o) => o === 'first').length);
	const phrases = $derived([...new Set(talk.said)].map((id) => lineFor(scenario, id, dialect)));
	const given = $derived(talk.given.map((id) => lineFor(scenario, itemLine(id), dialect)));

	$effect(() => {
		progress =
			step === 'done'
				? `${scenario.title} · done`
				: `${scenario.title} · ${Math.min(talk.turn + 1, turns)} of ${turns}`;
	});

	onMount(() => {
		setup();
		return () => {
			cancelled = true;
			stopClip();
			scene.followVehicle(null);
			scene.clearCharacters();
			scene.clearVehicles();
			scene.clearSpawned();
			scene.setHidden([]);
			if (restPose) scene.setPose(restPose);
			else scene.resetPose();
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
		const gender = scenario.npcGender[untrack(() => dialect)];
		if (stage.hide) scene.setHidden(stage.hide);
		scene.setPose(stage.pose);
		const npc = stage.npc;
		const vehicle = stage.vehicle;
		await Promise.all([
			npc &&
				scene.addCharacter(NPC, characterUrl(npc.model[gender]), {
					at: [npc.start[0], 0, npc.start[1]],
					scale: npc.scale ?? CHARACTER_SCALE
				}),
			vehicle &&
				scene.addVehicle(VEHICLE, vehicle.model, {
					at: [vehicle.start[0], 0, vehicle.start[1]],
					rot: vehicle.start[2],
					scale: vehicle.scale
				}),
			...(stage.extras ?? []).map(async (extra, i) => {
				await scene.addCharacter(`extra-${i}`, characterUrl(extra.model), {
					at: extra.at,
					rot: extra.rot,
					scale: CHARACTER_SCALE
				});
				scene.playAnimation(`extra-${i}`, extra.animation);
			})
		]);
		if (cancelled) return;
		if (vehicle) await scene.driveVehicle(VEHICLE, vehicle.arrive);
		if (npc) {
			await scene.walkTo(NPC, npc.route);
			if (cancelled) return;
			faceGuest();
			if (npc.idle) scene.playAnimation(NPC, npc.idle);
		}
		await npcSays(currentTurn(scenario, talk)!.npc);
		ask();
	}

	function faceGuest() {
		if (stage.npc) scene.faceCharacter(NPC, pose.at[0], pose.at[2]);
	}

	async function npcSays(id: string) {
		if (cancelled) return;
		bubble = id;
		revealed = false;
		const line = lineFor(scenario, id, dialect);
		announcement = level === 'hard' ? `The ${role.toLowerCase()} speaks.` : `${role}: ${line.arabic}. ${line.english}`;
		await speak(line.audioUrl);
	}

	function ask() {
		if (cancelled) return;
		choices = shuffle(currentTurn(scenario, talk)!.choices);
		step = 'choosing';
	}

	async function answer(line: string, heard?: string) {
		if (step !== 'choosing') return;
		step = 'busy';
		feedback = null;
		revealed = true;
		saying = line;
		const result = reply(scenario, talk, line);
		await speak(lineFor(scenario, line, dialect).audioUrl);
		saying = null;
		if (cancelled) return;

		if (result.result !== 'ok') {
			if (stage.npc) scene.playAnimation(NPC, 'emote-no', { once: true, then: 'idle' });
			feedback = { kind: result.result, line, heard };
			const question = bubble;
			await npcSays(sorryLine);
			// Back to the question, without saying it again: the replay button is there.
			bubble = question;
			revealed = true;
			step = 'choosing';
			return;
		}

		if (result.xp && signedIn) {
			awardGameXp();
			xpEarned++;
		}
		if (stage.npc) scene.playAnimation(NPC, 'emote-yes', { once: true, then: 'idle' });
		if (result.reply) await npcSays(result.reply);
		if (result.fetch) await handOver(result.fetch);
		if (result.drive) await drive(result.drive);
		if (cancelled) return;

		if (scenarioDone(scenario, talk)) {
			bubble = null;
			step = 'done';
			return;
		}
		await npcSays(currentTurn(scenario, talk)!.npc);
		ask();
	}

	/** Puts what was asked for in the scene: fetched by the other person, if there is one. */
	async function handOver(items: string[]) {
		bubble = null;
		const npc = stage.npc;
		const appear = () => {
			for (const item of items) {
				for (const prop of stage.give[item] ?? []) scene.spawn(prop.model, prop.placement);
			}
		};
		if (!npc?.fetch) return appear();

		const there = npc.fetch.route;
		const talkSpot = npc.route.at(-1) ?? npc.start;
		if (there.length) await scene.walkTo(NPC, there);
		if (cancelled) return;
		if (npc.fetch.disappear) {
			scene.setCharacterVisible(NPC, false);
			await wait(1200);
			if (cancelled) return;
			scene.setCharacterVisible(NPC, true);
		} else {
			await scene.playAnimation(NPC, 'pick-up', { once: true, then: 'idle' });
		}
		if (there.length) await scene.walkTo(NPC, [...there.slice(0, -1).reverse(), talkSpot]);
		if (cancelled) return;
		if (npc.handOver) scene.faceCharacter(NPC, ...npc.handOver);
		const reach = scene.playAnimation(NPC, 'interact-right', { once: true, then: 'idle' });
		await wait(350);
		appear();
		await reach;
		faceGuest();
	}

	/** Rides behind the vehicle along a route, then stands the player somewhere new. */
	async function drive(key: string) {
		const vehicle = stage.vehicle;
		const route = vehicle?.drives[key];
		if (!vehicle || !route) return;
		bubble = null;
		scene.followVehicle(VEHICLE, vehicle.follow);
		await scene.driveVehicle(VEHICLE, route.path);
		if (cancelled) return;
		await wait(400);
		scene.followVehicle(null);
		pose = route.then;
		scene.setPose(route.then);
		await wait(900);
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

{#if bubble && step !== 'done'}
	{@const line = lineFor(scenario, bubble, dialect)}
	<div class="caption">
		<div class="caption-head">
			<span class="who">{role}</span>
			{@render play(line.audioUrl, `Hear the ${role.toLowerCase()} again`)}
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
	{@const line = lineFor(scenario, saying, dialect)}
	<p class="saying" aria-hidden="true">
		<span class="you">You:</span>
		<span lang="ar" dir="rtl">{line.arabic}</span>
	</p>
{/if}

{#if step === 'choosing'}
	<div class="reply" style="--accent:{accent};">
		<div class="reply-head">
			<p class="reply-label">Your reply</p>
			{#if canSpeak}
				{#key talk.turn}
					<SpeakAnswer
						compact
						targets={choices.map((c) => lineFor(scenario, c.line, dialect).arabic)}
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
				{@const line = lineFor(scenario, choice.line, dialect)}
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
{:else if step === 'arriving'}
	<p class="status-chip">
		{stage.vehicle ? 'A taxi is pulling up…' : `The ${role.toLowerCase()} is coming over…`}
	</p>
{/if}

{#if step === 'done'}
	<div class="results-layer">
		<div class="results-inner">
			<GameResults
				heading={scenario.doneHeading}
				stats={[
					{ label: 'First try', value: `${firstTry}/${turns}` },
					{
						label: 'With a hint',
						value: Object.values(talk.outcomes).filter((o) => o === 'hinted').length
					}
				]}
				{xpEarned}
				{accent}
				{deep}
				onPlayAgain={onRestart}
				playAgainLabel="Again"
			>
				{#if given.length}
					<div class="receipt">
						<h3>What you got</h3>
						<ul>
							{#each given as item (item.id)}
								<li>
									<span lang="ar" dir="rtl">{item.arabic}</span>
									<span class="receipt-en">{item.english}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
				<div class="more">
					<PressButton quiet onclick={onExit}>{exitLabel}</PressButton>
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

	/* The Arabic on its own line, so a long reply wraps instead of overflowing. */
	.option {
		flex: 1;
		min-width: 0;
		display: grid;
		gap: 0;
		justify-items: center;
		padding: 0.3rem 0.7rem;
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

	/* Centred, and wrapping rather than cut off: the English is the part a beginner needs. */
	.option-ar {
		font-size: 1.1rem;
		font-weight: 600;
		line-height: 1.6;
		text-align: center;
	}

	.option-sub {
		min-width: 0;
		font-size: 0.75rem;
		line-height: 1.35;
		color: var(--text2);
		text-align: center;
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
		/* The game blocks touch scrolling; the results still need it. */
		touch-action: pan-y;
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
