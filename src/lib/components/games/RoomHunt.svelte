<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import GameResults from './GameResults.svelte';
	import GameWordList from './GameWordList.svelte';
	import PressButton from './PressButton.svelte';
	import SpeakAnswer from './SpeakAnswer.svelte';
	import OrderScenario from './OrderScenario.svelte';
	import { awardGameXp } from '$lib/games/game-xp';
	import { shuffle } from '$lib/games/shuffle';
	import type { RoundGate } from '$lib/games/free-rounds.svelte';
	import type { GameDialect } from '$lib/games/themes';
	import type { Room } from '$lib/games/room-hunt/rooms';
	import {
		BATCH_SIZE,
		answer,
		createRound,
		currentPrompt,
		isDone,
		learnedCount,
		missed,
		nameChoices,
		planSession,
		tally,
		wordFor,
		type Level,
		type Mode,
		type Session
	} from '$lib/games/room-hunt/round';
	import { playClip, stopClip } from '$lib/games/room-hunt/audio';
	import type { PickEvent, RoomScene } from '$lib/games/room-hunt/scene';

	interface Props {
		room: Room;
		dialect: GameDialect;
		level: Level;
		mode: Mode;
		/** Words already learned in this room and dialect. */
		learned: ReadonlySet<string>;
		onLearned: (ids: string[]) => void;
		gate: RoundGate;
		signedIn: boolean;
		isSubscribed: boolean;
		accent: string;
		deep: string;
		/** Offered on the results screen once this room is learned. */
		onNextRoom?: () => void;
	}

	let {
		room,
		dialect,
		level,
		mode,
		learned,
		onLearned,
		gate,
		signedIn,
		isSubscribed,
		accent,
		deep,
		onNextRoom
	}: Props = $props();

	/** Not a real object id: a spoken answer that didn't match. */
	const NO_MATCH = '';

	let container = $state<HTMLDivElement>();
	let canvas = $state<HTMLCanvasElement>();
	// $state.raw: reactive, but three.js objects must not be deep-proxied.
	let scene = $state.raw<RoomScene | null>(null);
	let progress = $state(0);
	let loading = $state(true);
	let failed = $state(false);

	let phase = $state<'lobby' | 'learn' | 'play' | 'done' | 'order'>('lobby');
	/** Bumped for each "Order a meal", so a replay starts the scene fresh. */
	let orderRun = $state(0);
	let orderProgress = $state('');
	/** Fullscreen, first-person. Leaving it mid-round pauses the round. */
	let immersive = $state(false);
	let session = $state<Session | null>(null);
	let learnIndex = $state(0);
	let choices = $state<string[]>([]);
	let wrongChoices = $state<string[]>([]);
	let feedback = $state<{ kind: 'wrong' | 'hint'; id?: string; heard?: string } | null>(null);
	/** On Hard, the prompt's text shows only after it's answered or hinted. */
	let revealed = $state(false);
	let busy = $state(false);
	let banner = $state('');
	let xpEarned = $state(0);
	let startedAt = 0;
	let seconds = $state(0);
	let canSpeak = $state(true);
	let speakNote = $state('');

	let muted = $state(false);
	let showTranslit = $state(true);
	let showAllLabels = $state(false);
	let explored = $state<string | null>(null);

	let label = $state<{ id: string; placement: number; tone: 'plain' | 'correct' | 'wrong' } | null>(
		null
	);
	let labelPos = $state<{ x: number; y: number } | null>(null);
	let allLabels = $state<{ id: string; x: number; y: number }[]>([]);
	let arrow = $state<{ x: number; y: number; angle: number } | null>(null);
	let labelTimer: ReturnType<typeof setTimeout> | undefined;
	let bannerTimer: ReturnType<typeof setTimeout> | undefined;
	let announcement = $state('');

	const round = $derived(session?.round ?? null);
	const prompt = $derived(round ? currentPrompt(round) : undefined);
	const learnId = $derived(phase === 'learn' && session ? session.learn[learnIndex] : undefined);
	const focusId = $derived(phase === 'learn' ? learnId : phase === 'play' ? prompt : undefined);
	const total = $derived(room.objects.length);
	const learnedHere = $derived(learnedCount(room, learned));
	const roomDone = $derived(learnedHere >= total);
	const paused = $derived(!immersive && (phase === 'learn' || phase === 'play'));
	const verb = $derived(mode === 'name' ? 'Name' : 'Find');
	const counts = $derived(round ? tally(round) : { asked: 0, first: 0, retry: 0, hinted: 0 });
	const askedWords = $derived(
		round ? Object.keys(round.outcomes).map((id) => wordFor(id, dialect)) : []
	);
	const outcomes = $derived(
		round ? Object.fromEntries(Object.entries(round.outcomes).map(([id, o]) => [id, o === 'first'])) : {}
	);
	const missedIds = $derived(round ? missed(round) : []);
	/** The prompt or lesson word shows its text (Hard hides it until answered). */
	const promptText = $derived(level !== 'hard' || revealed);
	const translit = $derived(level === 'easy' || (level === 'normal' && showTranslit));

	onMount(() => {
		let disposed = false;
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		try {
			muted = localStorage.getItem('pa-room-hunt-muted') === '1';
		} catch {
			// Sound stays on.
		}

		import('$lib/games/room-hunt/scene')
			.then(({ createRoomScene }) => createRoomScene(canvas!, { reducedMotion }))
			.then(async (created) => {
				if (disposed) return created.dispose();
				scene = created;
				scene.onPick = pick;
				scene.onRender = updateOverlays;
				await scene.loadRoom(
					untrack(() => room),
					(f) => (progress = f)
				);
				loading = false;
			})
			.catch(() => {
				failed = true;
				loading = false;
			});

		function onFullscreenChange() {
			if (!document.fullscreenElement && immersive) exitImmersive();
		}
		document.addEventListener('fullscreenchange', onFullscreenChange);

		return () => {
			disposed = true;
			document.removeEventListener('fullscreenchange', onFullscreenChange);
			clearTimeout(labelTimer);
			clearTimeout(bannerTimer);
			stopClip();
			scene?.dispose();
			scene = null;
		};
	});

	// Only the game scrolls while it's fullscreen.
	$effect(() => {
		if (!immersive) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	});

	// --- overlays ------------------------------------------------------------

	function updateOverlays() {
		if (!scene || !canvas) return;
		labelPos = label ? scene.labelPosition(label.id, label.placement) : null;

		allLabels =
			showAllLabels && phase === 'lobby'
				? room.objects.flatMap((o) => {
						const at = scene!.labelPosition(o.id);
						return at ? [{ id: o.id, ...at }] : [];
					})
				: [];

		const wantArrow =
			focusId &&
			(phase === 'learn' || mode === 'name' || level === 'easy' || round?.hinted);
		const angle = wantArrow ? scene.directionTo(focusId) : null;
		if (angle === null) {
			arrow = null;
		} else {
			const w = canvas.clientWidth;
			const h = canvas.clientHeight;
			arrow = {
				x: w / 2 + Math.cos(angle) * (w / 2 - 44),
				y: h / 2 + Math.sin(angle) * (h / 2 - 44),
				angle
			};
		}
	}

	function showLabel(event: PickEvent, tone: 'plain' | 'correct' | 'wrong', ms?: number) {
		clearTimeout(labelTimer);
		label = { ...event, tone };
		scene?.refresh();
		if (ms) {
			labelTimer = setTimeout(() => {
				label = null;
				scene?.refresh();
			}, ms);
		}
	}

	function hideLabel() {
		clearTimeout(labelTimer);
		label = null;
		scene?.refresh();
	}

	function flashBanner(text: string) {
		clearTimeout(bannerTimer);
		banner = text;
		bannerTimer = setTimeout(() => (banner = ''), 1600);
	}

	function play(url: string) {
		if (!muted) playClip(url);
	}

	function toggleMute() {
		muted = !muted;
		if (muted) stopClip();
		try {
			localStorage.setItem('pa-room-hunt-muted', muted ? '1' : '0');
		} catch {
			// Only the preference is lost.
		}
	}

	// --- fullscreen ----------------------------------------------------------

	function enterImmersive() {
		immersive = true;
		// Real fullscreen where the browser allows it (not iPhone Safari); the
		// fixed overlay covers the page either way.
		container?.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => {});
		requestAnimationFrame(() => container?.querySelector<HTMLElement>('.viewport')?.focus());
		scene?.refresh();
	}

	function exitImmersive() {
		immersive = false;
		if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
		stopClip();
		// The conversation doesn't pause: leaving ends it (and the scene tidies up).
		if (phase === 'done' || phase === 'order') phase = 'lobby';
		scene?.refresh();
	}

	/** "Order a meal" with the restaurant's waiter. */
	function startOrder() {
		if (!gate.canStart()) {
			exitImmersive();
			gate.block();
			return;
		}
		if (!gate.tryStartRound()) return;
		explored = null;
		showAllLabels = false;
		hideLabel();
		phase = 'order';
		orderRun++;
		enterImmersive();
	}

	function restartOrder() {
		phase = 'lobby';
		startOrder();
	}

	// --- flow ----------------------------------------------------------------

	/** A lesson (or a practice round once the room is learned), or a replay of `practice`. */
	function start(practice?: string[]) {
		if (!gate.canStart()) {
			// The sign-up / paywall modal lives on the page under the overlay.
			exitImmersive();
			gate.block();
			return;
		}
		if (!gate.tryStartRound()) return;

		session = practice
			? { learn: [], round: createRound(shuffle(practice)) }
			: planSession(room, learned);
		xpEarned = 0;
		startedAt = performance.now();
		explored = null;
		showAllLabels = false;
		hideLabel();
		enterImmersive();

		if (session.learn.length) {
			phase = 'learn';
			learnIndex = 0;
			flashBanner(`${session.learn.length} new words`);
			teach();
		} else {
			phase = 'play';
			flashBanner(practice ? 'The ones you missed' : `${verb} them all`);
			beginPrompt();
		}
	}

	function teach() {
		const id = session!.learn[learnIndex];
		const word = wordFor(id, dialect);
		scene?.hint(id, 'focus');
		label = { id, placement: 0, tone: 'plain' };
		play(word.audioUrl);
		announcement = `New word: ${word.arabic}, ${word.transliteration}, ${word.english}. Tap it to continue.`;
		scene?.refresh();
	}

	function nextLearn() {
		if (!session || phase !== 'learn') return;
		scene?.flash(session.learn[learnIndex], 'correct');
		learnIndex++;
		if (learnIndex < session.learn.length) {
			teach();
			return;
		}
		scene?.clearHint();
		hideLabel();
		phase = 'play';
		flashBanner(mode === 'name' ? 'Now name them' : 'Now find them');
		busy = true;
		setTimeout(() => {
			busy = false;
			beginPrompt();
		}, 900);
	}

	function beginPrompt(withAudio = true) {
		const target = prompt;
		if (!target) return;
		feedback = null;
		wrongChoices = [];
		revealed = false;
		if (mode === 'name') {
			choices = nameChoices(room, target);
			scene?.hint(target, 'focus');
			announcement = 'What is the glowing object called?';
		} else {
			choices = [];
			if (!round?.hinted) scene?.clearHint();
			if (withAudio) play(wordFor(target, dialect).questionAudioUrl);
			const word = wordFor(target, dialect);
			announcement = level === 'hard' ? 'Listen, then find it.' : `${word.question} ${word.questionTransliteration}`;
		}
		scene?.refresh();
	}

	function resume() {
		enterImmersive();
		if (phase === 'learn') teach();
		else beginPrompt(false);
	}

	function quit() {
		session = null;
		phase = 'lobby';
		scene?.clearHint();
		hideLabel();
	}

	function pick(event: PickEvent) {
		if (phase === 'lobby' || phase === 'order') {
			explored = event.id;
			showLabel(event, 'plain');
			const word = wordFor(event.id, dialect);
			play(word.audioUrl);
			announcement = `${word.arabic}, ${word.transliteration}, ${word.english}`;
			return;
		}
		if (!immersive || busy) return;

		if (phase === 'learn') {
			if (event.id === learnId) nextLearn();
			else {
				// Other objects still say their names: exploring is never wrong.
				showLabel(event, 'plain', 1300);
				play(wordFor(event.id, dialect).audioUrl);
				scene?.refresh();
			}
			return;
		}
		// In "Name it" the object is chosen for you; the answer is a name.
		if (phase === 'play' && mode === 'find') submit(event.id, event);
	}

	function submit(id: string, event?: PickEvent, heard?: string) {
		if (!round || busy || phase !== 'play') return;
		const target = prompt!;
		const { result, xp } = answer(round, id);

		if (result === 'correct') {
			if (xp && signedIn) {
				awardGameXp();
				xpEarned++;
			}
			const word = wordFor(target, dialect);
			scene?.clearHint();
			scene?.flash(target, 'correct');
			showLabel(event ?? { id: target, placement: 0 }, 'correct', 1300);
			play(word.audioUrl);
			revealed = true;
			feedback = null;
			announcement = `Correct: ${word.arabic}, ${word.english}`;
			busy = true;
			scene?.setPickEnabled(false);
			setTimeout(() => {
				busy = false;
				scene?.setPickEnabled(true);
				if (round && isDone(round)) finish();
				else beginPrompt();
			}, 1300);
			return;
		}

		if (id !== NO_MATCH) {
			const tapped = wordFor(id, dialect);
			if (mode === 'find' && event) {
				scene?.flash(id, 'wrong');
				showLabel(event, 'wrong', 1600);
				play(tapped.audioUrl);
			} else {
				wrongChoices = [...wrongChoices, id];
			}
			announcement = `That's ${tapped.arabic}, ${tapped.english}.`;
		}
		feedback = { kind: result, id: id || undefined, heard };
		if (result === 'hint') {
			revealed = true;
			if (mode === 'find') scene?.hint(target, 'hint');
			announcement += mode === 'find' ? ' The right one is glowing.' : ' The right name is marked.';
		}
		scene?.refresh();
	}

	function spoken(index: number, heard: string) {
		if (index === 0) submit(prompt!);
		else submit(NO_MATCH, undefined, heard || '…');
	}

	function finish() {
		seconds = Math.round((performance.now() - startedAt) / 1000);
		if (session?.learn.length) onLearned(session.learn);
		phase = 'done';
		scene?.clearHint();
		hideLabel();
	}

	// --- input ---------------------------------------------------------------

	function onkeydown(event: KeyboardEvent) {
		// Keys typed on the HUD's own buttons belong to them.
		if ((event.target as HTMLElement).closest('button, input, a')) return;
		const step = 0.12;
		const turns: Record<string, [number, number]> = {
			ArrowLeft: [step, 0],
			ArrowRight: [-step, 0],
			ArrowUp: [0, step],
			ArrowDown: [0, -step],
			a: [step, 0],
			d: [-step, 0],
			w: [0, step],
			s: [0, -step]
		};
		const turn = turns[event.key];
		if (turn) {
			event.preventDefault();
			scene?.turn(...turn);
			return;
		}
		if (phase === 'play' && mode === 'name' && /^[1-4]$/.test(event.key)) {
			const id = choices[Number(event.key) - 1];
			if (id && !wrongChoices.includes(id)) submit(id);
		}
		if (phase === 'learn' && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();
			nextLearn();
		}
	}

	function onWindowKeydown(event: KeyboardEvent) {
		// Without real fullscreen (iPhone, or refused), Escape still leaves.
		if (event.key === 'Escape' && immersive && !document.fullscreenElement) exitImmersive();
	}

	function formatTime(total: number) {
		const m = Math.floor(total / 60);
		const s = total % 60;
		return m ? `${m}m ${s}s` : `${s}s`;
	}

	const genderLabel = (g: 'm' | 'f') => (g === 'm' ? 'masculine' : 'feminine');
</script>

<svelte:window onkeydown={onWindowKeydown} />

<p class="sr-only" aria-live="polite">{announcement}</p>

{#snippet replay(url: string, labelText: string)}
	<button type="button" class="icon-btn" onclick={() => playClip(url)} aria-label={labelText}>
		<svg viewBox="0 0 24 24" aria-hidden="true"
			><path
				d="M3 10v4a1 1 0 0 0 1 1h3l4 4a1 1 0 0 0 1.7-.7V5.7A1 1 0 0 0 11 5L7 9H4a1 1 0 0 0-1 1zm13.5 2A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"
			/></svg
		>
	</button>
{/snippet}

{#snippet wordCard(id: string, tag: string)}
	{@const word = wordFor(id, dialect)}
	<div class="word-card">
		<span class="tag">{tag}</span>
		<div class="word-row">
			<span class="word-ar" lang="ar" dir="rtl">{word.arabic}</span>
			{@render replay(word.audioUrl, `Play ${word.english}`)}
		</div>
		<p class="gloss">
			{#if translit}<span class="translit">{word.transliteration}</span> ·{/if}
			{word.english}
			<span class="gender" title="Grammatical gender">{genderLabel(word.gender)}</span>
		</p>
	</div>
{/snippet}

<div
	class="hunt"
	class:immersive
	bind:this={container}
	style="--accent:{accent}; --deep:{deep};"
>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<div
		class="viewport"
		tabindex="0"
		role="application"
		aria-label="{room.label}. Drag or use the arrow keys to look around; tap an object to choose it."
		{onkeydown}
	>
		<canvas bind:this={canvas}></canvas>

		{#each allLabels as item (item.id)}
			{@const word = wordFor(item.id, dialect)}
			<div class="label small" style="left:{item.x}px; top:{item.y}px;" aria-hidden="true">
				<span class="label-ar" lang="ar" dir="rtl">{word.arabic}</span>
			</div>
		{/each}

		{#if label && labelPos}
			{@const word = wordFor(label.id, dialect)}
			<div
				class="label tone-{label.tone}"
				style="left:{labelPos.x}px; top:{labelPos.y}px;"
				aria-hidden="true"
			>
				<span class="label-ar" lang="ar" dir="rtl">{word.arabic}</span>
				{#if translit}<span class="label-tr">{word.transliteration}</span>{/if}
			</div>
		{/if}

		{#if arrow && immersive}
			<div
				class="arrow"
				style="left:{arrow.x}px; top:{arrow.y}px; transform:translate(-50%,-50%) rotate({arrow.angle}rad);"
				aria-hidden="true"
			>
				➜
			</div>
		{/if}

		{#if banner && immersive}
			<p class="banner" aria-hidden="true">{banner}</p>
		{/if}

		{#if loading}
			<div class="overlay">
				<p>Setting up the {room.label.toLowerCase()}…</p>
				<div class="bar" role="progressbar" aria-valuenow={Math.round(progress * 100)}>
					<span style="width:{progress * 100}%"></span>
				</div>
			</div>
		{:else if failed}
			<div class="overlay" role="alert">
				<p>The room couldn't load. Your browser may not support 3D graphics (WebGL).</p>
			</div>
		{:else if !immersive}
			<p class="drag-tip" aria-hidden="true">Drag to look around · tap anything</p>
		{/if}

		{#if immersive}
			<div class="hud-top">
				<button type="button" class="icon-btn hud-btn" onclick={exitImmersive} aria-label="Exit">
					✕
				</button>
				<span class="pill">
					{room.emoji}
					{#if phase === 'learn' && session}
						New word {learnIndex + 1} of {session.learn.length}
					{:else if phase === 'play' && round}
						{verb} {Math.min(round.index + 1, round.prompts.length)} of {round.prompts.length}
					{:else if phase === 'order'}
						{orderProgress}
					{:else}
						{room.label}
					{/if}
				</span>
				<div class="hud-right">
					{#if level === 'normal'}
						<button
							type="button"
							class="icon-btn hud-btn text"
							aria-pressed={showTranslit}
							onclick={() => (showTranslit = !showTranslit)}
							title="Transliteration">abc</button
						>
					{/if}
					<button
						type="button"
						class="icon-btn hud-btn"
						aria-pressed={!muted}
						onclick={toggleMute}
						aria-label={muted ? 'Turn sound on' : 'Turn sound off'}>{muted ? '🔇' : '🔊'}</button
					>
				</div>
			</div>

			{#if phase === 'learn' && learnId}
				<div class="hud-card">
					{@render wordCard(learnId, 'New word')}
					<div class="card-foot">
						<p class="instruction">Tap the glowing {wordFor(learnId, dialect).english} to continue</p>
						<button type="button" class="link" onclick={nextLearn}>Next</button>
					</div>
				</div>
			{:else if phase === 'play' && prompt}
				{@const word = wordFor(prompt, dialect)}
				<div class="hud-card">
					{#if mode === 'find'}
						<div class="word-row">
							{#if promptText}
								<span class="word-ar" lang="ar" dir="rtl">{word.question}</span>
							{:else}
								<span class="listen">🎧 Listen, then find it</span>
							{/if}
							{@render replay(word.questionAudioUrl, 'Play the question again')}
						</div>
						{#if promptText && translit}
							<p class="gloss"><span class="translit">{word.questionTransliteration}</span></p>
						{/if}
						{#if level === 'easy'}
							<p class="gloss">{word.questionEnglish}</p>
						{/if}
					{:else}
						<p class="instruction">
							What's the glowing thing called?{#if level === 'easy'}
								<span class="gloss">({word.english})</span>{/if}
						</p>
						<div class="choices">
							{#each choices as id, i (id)}
								{@const option = wordFor(id, dialect)}
								<button
									type="button"
									class="choice"
									class:wrong={wrongChoices.includes(id)}
									class:hinted={round?.hinted && id === prompt}
									disabled={wrongChoices.includes(id) || busy}
									onclick={() => submit(id)}
								>
									<span class="key" aria-hidden="true">{i + 1}</span>
									<span class="choice-ar" lang="ar" dir="rtl">{option.arabic}</span>
									{#if translit}<span class="choice-tr">{option.transliteration}</span>{/if}
								</button>
							{/each}
						</div>
						{#if canSpeak}
							{#key prompt}
								<SpeakAnswer
									targets={[word.arabic]}
									{dialect}
									onResult={spoken}
									onUnavailable={(reason) => {
										canSpeak = false;
										speakNote = reason;
									}}
								/>
							{/key}
						{:else if speakNote}
							<p class="gloss">{speakNote}</p>
						{/if}
					{/if}

					{#if feedback}
						{@const tapped = feedback.id ? wordFor(feedback.id, dialect) : null}
						<p class="feedback" class:hint={feedback.kind === 'hint'} role="status">
							{#if feedback.heard}
								We heard <span lang="ar" dir="rtl">{feedback.heard}</span>.
							{:else if tapped}
								That's <span lang="ar" dir="rtl">{tapped.arabic}</span>
								({tapped.english}).
							{/if}
							{#if feedback.kind === 'hint'}
								{mode === 'find' ? 'Follow the glow.' : 'The right name is marked.'}
							{:else}
								Try again.
							{/if}
						</p>
					{/if}
				</div>
			{/if}

			{#if phase === 'order' && scene && !loading}
				{#key orderRun}
					<OrderScenario
						{scene}
						{dialect}
						{level}
						{translit}
						{muted}
						{signedIn}
						{isSubscribed}
						{accent}
						{deep}
						bind:progress={orderProgress}
						onRestart={restartOrder}
						onExit={exitImmersive}
					/>
				{/key}
			{/if}

			{#if phase === 'done' && round}
				<div class="results-layer">
					<div class="results-inner">
						<GameResults
							heading={session?.learn.length
								? `Lesson done: ${session.learn.length} new words`
								: `${counts.first} of ${counts.asked} on the first try`}
							stats={[
								{ label: 'First try', value: counts.first },
								{ label: 'Second try', value: counts.retry },
								{ label: 'With a hint', value: counts.hinted },
								{ label: 'Time', value: formatTime(seconds) }
							]}
							note="{learnedHere} of {total} words learned in the {room.label.toLowerCase()}"
							{xpEarned}
							{accent}
							{deep}
							onPlayAgain={() => start()}
							playAgainLabel={roomDone ? 'Practice again' : 'Next lesson'}
						>
							<div class="more-actions">
								{#if missedIds.length}
									<PressButton quiet onclick={() => start(missedIds)}>
										Practice the {missedIds.length} I missed
									</PressButton>
								{/if}
								{#if roomDone && onNextRoom}
									<PressButton quiet onclick={onNextRoom}>Next room →</PressButton>
								{/if}
								<PressButton quiet onclick={exitImmersive}>Back to the room</PressButton>
							</div>
							<GameWordList words={askedWords} {dialect} {isSubscribed} {signedIn} {outcomes} />
						</GameResults>
					</div>
				</div>
			{/if}
		{/if}
	</div>

	{#if !immersive}
		<div class="card">
			{#if paused}
				<p class="lead">Round paused.</p>
				<div class="actions">
					<PressButton onclick={resume} {accent} {deep}>Resume</PressButton>
					<PressButton quiet onclick={quit}>Quit round</PressButton>
				</div>
			{:else}
				<div class="room-progress">
					<span>{learnedHere} of {total} words learned</span>
					<div class="bar small" aria-hidden="true">
						<span style="width:{(learnedHere / total) * 100}%"></span>
					</div>
				</div>

				{#if explored}
					{@render wordCard(explored, 'You tapped')}
				{:else}
					<p class="lead">
						Look around and tap anything to hear its name. Each lesson teaches {BATCH_SIZE} words,
						then asks you to {mode === 'name' ? 'name' : 'find'} them.
					</p>
				{/if}

				<div class="actions">
					<PressButton onclick={() => start()} {accent} {deep} disabled={loading || failed}>
						{#if roomDone}
							Practice the {room.label.toLowerCase()}
						{:else if learnedHere === 0}
							Start the first lesson
						{:else}
							Start lesson {Math.floor(learnedHere / BATCH_SIZE) + 1}
						{/if}
					</PressButton>
				</div>

				{#if room.id === 'restaurant'}
					<div class="scenario">
						<span class="scenario-emoji" aria-hidden="true">🧑‍🍳</span>
						<div class="scenario-text">
							<strong>Order a meal</strong>
							<span>Sit down, talk to the waiter in Arabic, and get your dinner.</span>
						</div>
						<PressButton quiet onclick={startOrder} disabled={loading || failed}>Order</PressButton>
					</div>
				{/if}

				<div class="toggles">
					<label>
						<input
							type="checkbox"
							bind:checked={showAllLabels}
							onchange={() => scene?.refresh()}
						/> Label everything
					</label>
					{#if level === 'normal'}
						<label><input type="checkbox" bind:checked={showTranslit} /> Transliteration</label>
					{/if}
					<label>
						<input type="checkbox" checked={!muted} onchange={toggleMute} /> Sound
					</label>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.hunt {
		display: grid;
		gap: 0.75rem;
	}

	.hunt.immersive {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: block;
		background: #000;
	}

	.viewport {
		position: relative;
		height: min(62dvh, 520px);
		min-height: 300px;
		border-radius: 1.25rem;
		overflow: hidden;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		outline: none;
		user-select: none;
		-webkit-user-select: none;
	}

	.viewport:focus-visible {
		border-color: var(--accent);
	}

	.immersive .viewport {
		position: absolute;
		inset: 0;
		height: auto;
		min-height: 0;
		border: 0;
		border-radius: 0;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: none;
		cursor: grab;
	}

	canvas:active {
		cursor: grabbing;
	}

	/* --- labels, arrow, banner --- */

	.label {
		position: absolute;
		transform: translate(-50%, calc(-100% - 8px));
		display: grid;
		justify-items: center;
		padding: 0.3rem 0.7rem;
		border-radius: 0.8rem;
		background: rgb(255 255 255 / 0.94);
		color: #1f2937;
		box-shadow: 0 6px 18px rgb(0 0 0 / 0.18);
		pointer-events: none;
		white-space: nowrap;
		animation: rise 0.2s ease-out both;
	}

	.label.small {
		padding: 0.1rem 0.5rem;
		border-radius: 0.6rem;
		animation: none;
		opacity: 0.92;
	}

	.label.small .label-ar {
		font-size: 0.95rem;
	}

	.label.tone-correct {
		background: #dcfce7;
		color: #14532d;
	}

	.label.tone-wrong {
		background: #fee2e2;
		color: #7f1d1d;
	}

	.label-ar {
		font-size: 1.3rem;
		font-weight: 600;
		line-height: 1.5;
	}

	.label-tr {
		font-size: 0.75rem;
		font-style: italic;
	}

	.arrow {
		position: absolute;
		display: grid;
		place-items: center;
		width: 2.6rem;
		height: 2.6rem;
		border-radius: 50%;
		font-size: 1.35rem;
		color: #fff;
		background: color-mix(in srgb, var(--accent) 85%, black);
		box-shadow: 0 4px 14px rgb(0 0 0 / 0.3);
		pointer-events: none;
	}

	.banner {
		position: absolute;
		top: 30%;
		left: 50%;
		transform: translateX(-50%);
		padding: 0.55rem 1.3rem;
		border-radius: 100px;
		font-size: 1.15rem;
		font-weight: 700;
		color: #fff;
		background: rgb(0 0 0 / 0.55);
		pointer-events: none;
		animation: rise 0.25s ease-out both;
	}

	/* --- loading and tips --- */

	.overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		gap: 0.75rem;
		padding: 1.5rem;
		text-align: center;
		font-weight: 600;
		color: var(--text1);
		background: var(--tile3);
	}

	.bar {
		width: min(16rem, 70vw);
		height: 0.5rem;
		border-radius: 100px;
		background: var(--tile5);
		overflow: hidden;
	}

	.bar.small {
		width: 100%;
		height: 0.4rem;
	}

	.bar span {
		display: block;
		height: 100%;
		background: var(--accent);
		transition: width 0.3s ease;
	}

	.drag-tip {
		position: absolute;
		left: 50%;
		bottom: 0.75rem;
		transform: translateX(-50%);
		padding: 0.3rem 0.8rem;
		border-radius: 100px;
		font-size: 0.8rem;
		font-weight: 600;
		color: #fff;
		white-space: nowrap;
		background: rgb(0 0 0 / 0.45);
		pointer-events: none;
	}

	/* --- HUD --- */

	.hud-top {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: max(0.75rem, env(safe-area-inset-top)) 0.75rem 0.75rem;
		pointer-events: none;
	}

	.hud-top > * {
		pointer-events: auto;
	}

	.hud-right {
		display: flex;
		gap: 0.4rem;
		margin-left: auto;
	}

	.pill {
		margin: 0 auto;
		padding: 0.4rem 0.95rem;
		border-radius: 100px;
		font-size: 0.85rem;
		font-weight: 700;
		color: #fff;
		background: rgb(0 0 0 / 0.5);
		backdrop-filter: blur(6px);
		white-space: nowrap;
	}

	.icon-btn {
		display: inline-grid;
		place-items: center;
		flex-shrink: 0;
		width: 2.4rem;
		height: 2.4rem;
		border-radius: 50%;
		color: var(--text1);
		background: var(--tile4, var(--tile3));
		border: 2px solid var(--tile5);
		cursor: pointer;
	}

	.icon-btn svg {
		width: 1.1rem;
		height: 1.1rem;
		fill: currentColor;
	}

	.hud-btn {
		color: #fff;
		background: rgb(0 0 0 / 0.5);
		border-color: rgb(255 255 255 / 0.2);
		backdrop-filter: blur(6px);
	}

	.hud-btn.text {
		font-size: 0.75rem;
		font-weight: 700;
	}

	.hud-btn[aria-pressed='false'].text {
		opacity: 0.55;
	}

	.hud-card {
		position: absolute;
		left: 50%;
		bottom: max(0.9rem, env(safe-area-inset-bottom));
		transform: translateX(-50%);
		width: min(34rem, calc(100% - 1.5rem));
		display: grid;
		gap: 0.5rem;
		padding: 0.9rem 1.1rem;
		border-radius: 1.25rem;
		background: color-mix(in srgb, var(--tile3) 92%, transparent);
		border: 2px solid var(--tile5);
		box-shadow: 0 10px 30px rgb(0 0 0 / 0.25);
		backdrop-filter: blur(8px);
	}

	.card-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.instruction {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text1);
	}

	.link {
		flex-shrink: 0;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}

	.listen {
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--text1);
	}

	.choices {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.choice {
		position: relative;
		display: grid;
		justify-items: center;
		padding: 0.45rem 0.6rem;
		border-radius: 0.9rem;
		color: var(--text1);
		background: var(--tile2, var(--tile3));
		border: 2px solid var(--tile5);
		cursor: pointer;
		transition: border-color 0.15s ease;
	}

	.choice:hover:not(:disabled) {
		border-color: var(--accent);
	}

	.choice.wrong {
		opacity: 0.45;
		border-color: #f43f5e;
		text-decoration: line-through;
	}

	.choice.hinted {
		border-color: #f59e0b;
		box-shadow: 0 0 0 3px rgb(245 158 11 / 0.35);
	}

	.key {
		position: absolute;
		top: 0.3rem;
		left: 0.5rem;
		font-size: 0.65rem;
		font-weight: 700;
		color: var(--text2);
	}

	.choice-ar {
		font-size: 1.3rem;
		font-weight: 600;
		line-height: 1.5;
	}

	.choice-tr {
		font-size: 0.75rem;
		font-style: italic;
		color: var(--text2);
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

	.more-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-bottom: 1.2rem;
	}

	/* --- shared word card --- */

	.word-card {
		display: grid;
		gap: 0.2rem;
	}

	.tag {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--accent);
	}

	.word-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.word-ar {
		font-size: 1.9rem;
		font-weight: 600;
		line-height: 1.45;
		color: var(--text1);
	}

	.gloss {
		font-size: 0.9rem;
		color: var(--text2);
	}

	.translit {
		font-style: italic;
	}

	.gender {
		margin-left: 0.35rem;
		padding: 0.05rem 0.45rem;
		border-radius: 100px;
		font-size: 0.7rem;
		font-weight: 600;
		background: var(--tile5);
		color: var(--text1);
	}

	.feedback {
		border-radius: 0.8rem;
		padding: 0.5rem 0.75rem;
		font-size: 0.9rem;
		color: var(--text1);
		background: color-mix(in srgb, #f43f5e 14%, var(--tile3));
	}

	.feedback.hint {
		background: color-mix(in srgb, #f59e0b 18%, var(--tile3));
	}

	/* --- lobby card --- */

	.card {
		display: grid;
		gap: 0.75rem;
		border-radius: 1.25rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.9rem 1.1rem;
	}

	.room-progress {
		display: grid;
		gap: 0.35rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
	}

	.lead {
		font-weight: 600;
		color: var(--text1);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.scenario {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.7rem 0.85rem;
		border-radius: 1rem;
		background: color-mix(in srgb, var(--accent) 10%, var(--tile3));
		border: 2px solid color-mix(in srgb, var(--accent) 35%, var(--tile5));
	}

	.scenario-emoji {
		font-size: 1.6rem;
	}

	.scenario-text {
		display: grid;
		flex: 1;
		min-width: 0;
		font-size: 0.85rem;
		color: var(--text2);
	}

	.scenario-text strong {
		font-size: 0.95rem;
		color: var(--text1);
	}

	.toggles {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: 0.82rem;
		color: var(--text2);
	}

	.toggles label {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		cursor: pointer;
	}

	.toggles input {
		accent-color: var(--accent);
	}

	@keyframes rise {
		from {
			opacity: 0;
			translate: 0 4px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.label,
		.banner {
			animation: none;
		}
		.bar span {
			transition: none;
		}
	}
</style>
