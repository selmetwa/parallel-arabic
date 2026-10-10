<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import DailyRoot from '$lib/components/games/DailyRoot.svelte';
	import DialectMatch from '$lib/components/games/DialectMatch.svelte';
	import LetterHunt from '$lib/components/games/LetterHunt.svelte';
	import VerbBlitz from '$lib/components/games/VerbBlitz.svelte';
	import { gameHref, getGame } from '$lib/constants/games';
	import { initialDialect } from '$lib/games/themes';

	let { data } = $props();

	const root = getGame('daily-root')!;
	const game = $derived(getGame(data.game)!);
	const dialect = $derived(initialDialect(null, data.targetDialect));

	// Each step is remembered per day on this device; the bonus is claimed on the server.
	const storageKey = $derived(`pa-today:${data.number}`);
	let rootDone = $state(false);
	let gameDone = $state(false);
	let gameScore = $state<{ score: number; total: number } | null>(null);
	let claim = $state<'idle' | 'sending' | 'done' | 'already' | 'failed'>('idle');
	let xpAwarded = $state(0);

	const allDone = $derived(rootDone && gameDone);

	onMount(() => {
		try {
			const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
			if (saved) {
				rootDone = !!saved.rootDone;
				gameDone = !!saved.gameDone;
				gameScore = saved.gameScore ?? null;
			}
		} catch {
			// A fresh start.
		}
		if (data.claimed) claim = 'already';
		maybeClaim();
	});

	function save() {
		try {
			localStorage.setItem(storageKey, JSON.stringify({ rootDone, gameDone, gameScore }));
		} catch {
			// Not remembered on this device; the server still knows about the claim.
		}
	}

	async function maybeClaim() {
		if (!rootDone || !gameDone || !data.user || claim !== 'idle') return;
		claim = 'sending';
		try {
			const res = await fetch('/api/daily-game-challenge', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ dialect })
			});
			const body = await res.json();
			if (!res.ok || !body.ok) throw new Error();
			xpAwarded = body.xpAwarded ?? 0;
			claim = body.alreadyDone ? 'already' : 'done';
		} catch {
			claim = 'failed';
		}
	}

	function onRootDone() {
		rootDone = true;
		save();
		maybeClaim();
	}

	function onGameFinish(score: number, total: number) {
		gameDone = true;
		gameScore = { score, total };
		save();
		maybeClaim();
	}

	// The game of the day's own "play again" goes to its full page.
	const playMore = () => (location.href = gameHref(data.game));
</script>

<section class="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-5">
	<a href={resolve('/learn/game')} class="back">← All games</a>

	<header class="head">
		<p class="kicker">Today’s challenge · #{data.number}</p>
		<h1>Two short games, every day</h1>
		<p class="intro">
			Today’s Daily Root, then a round of {game.name}. About three minutes. Finish both to keep your
			streak going{data.user ? ' and earn bonus XP' : ''}.
		</p>
		{#if !data.user}
			<p class="signin">
				<a href={resolve('/signup')}>Create a free account</a> to keep a streak and earn XP. You can
				play either way.
			</p>
		{/if}
	</header>

	<ol class="steps">
		<li class="step" class:done={rootDone}>
			<div class="step-head">
				<span class="step-num">{rootDone ? '✓' : '1'}</span>
				<h2>{root.emoji} {root.name}</h2>
			</div>
			<div class="step-body" style="--accent:{root.accent}; --deep:{root.deep};">
				<DailyRoot
					signedIn={!!data.user}
					accent={root.accent}
					deep={root.deep}
					onDone={onRootDone}
				/>
			</div>
		</li>

		<li class="step" class:done={gameDone}>
			<div class="step-head">
				<span class="step-num">{gameDone ? '✓' : '2'}</span>
				<h2>{game.emoji} {game.name}</h2>
				{#if gameScore}
					<span class="score">{gameScore.score}/{gameScore.total}</span>
				{/if}
			</div>
			<div class="step-body">
				{#if gameDone}
					<p class="step-note">
						Done for today. <a href={resolve(gameHref(data.game))}>Play more {game.name}</a>
					</p>
				{:else if rootDone}
					{#if data.game === 'dialect-match'}
						<DialectMatch
							items={data.items}
							signedIn={!!data.user}
							accent={game.accent}
							deep={game.deep}
							onPlayAgain={playMore}
							onFinish={onGameFinish}
						/>
					{:else if data.game === 'letter-hunt'}
						<LetterHunt
							signedIn={!!data.user}
							accent={game.accent}
							deep={game.deep}
							onPlayAgain={playMore}
							onFinish={onGameFinish}
						/>
					{:else}
						<VerbBlitz
							{dialect}
							tense="mixed"
							signedIn={!!data.user}
							accent={game.accent}
							deep={game.deep}
							onPlayAgain={playMore}
							onFinish={onGameFinish}
						/>
					{/if}
				{:else}
					<p class="step-note">Finish the Daily Root first. {game.tagline}</p>
				{/if}
			</div>
		</li>
	</ol>

	{#if allDone}
		<div class="finished" role="status">
			<p class="finished-title">Today’s challenge is done 🎉</p>
			{#if claim === 'done'}
				<p>+{xpAwarded} bonus XP, and your streak is safe for today.</p>
			{:else if claim === 'already'}
				<p>Your bonus for today is already in. Come back tomorrow for a new root.</p>
			{:else if claim === 'sending'}
				<p>Adding your bonus…</p>
			{:else if claim === 'failed'}
				<p>We couldn’t add your bonus. Refresh the page to try again.</p>
			{:else if !data.user}
				<p><a href={resolve('/signup')}>Sign up</a> to keep a streak and earn XP for days like this.</p>
			{/if}
			<p class="tomorrow">A new challenge every day at midnight UTC.</p>
		</div>
	{/if}
</section>

<style>
	.back {
		display: inline-block;
		margin-bottom: 0.9rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
	}

	.back:hover {
		color: var(--brand);
	}

	.kicker {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
	}

	h1 {
		margin-top: 0.2rem;
		font-size: clamp(1.9rem, 6vw, 2.6rem);
		font-weight: 600;
		line-height: 1.1;
		letter-spacing: -0.03em;
		color: var(--text1);
	}

	.intro {
		margin-top: 0.7rem;
		max-width: 60ch;
		line-height: 1.55;
		color: var(--text2);
	}

	.signin {
		margin-top: 0.6rem;
		font-size: 0.9rem;
		color: var(--text2);
	}

	.signin a,
	.step-note a,
	.finished a {
		font-weight: 600;
		color: var(--text1);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.steps {
		display: grid;
		gap: 1.25rem;
		margin-top: 1.75rem;
	}

	.step {
		border-radius: 1.25rem;
		border: 2px solid var(--tile5);
		background: var(--tile2);
		padding: 1rem;
	}

	.step.done {
		border-color: #10b981;
	}

	.step-head {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.9rem;
	}

	.step-num {
		display: grid;
		place-items: center;
		width: 1.8rem;
		height: 1.8rem;
		border-radius: 50%;
		font-size: 0.85rem;
		font-weight: 700;
		color: #fff;
		background: var(--text2);
	}

	.step.done .step-num {
		background: #10b981;
	}

	h2 {
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--text1);
	}

	.score {
		margin-left: auto;
		font-weight: 600;
		color: var(--text1);
	}

	.step-note {
		font-size: 0.92rem;
		color: var(--text2);
	}

	.finished {
		display: grid;
		gap: 0.35rem;
		margin-top: 1.5rem;
		border-radius: 1.25rem;
		border: 2px solid #10b981;
		background: color-mix(in srgb, #10b981 10%, var(--tile3));
		padding: 1.1rem 1.2rem;
		color: var(--text1);
	}

	.finished-title {
		font-size: 1.2rem;
		font-weight: 600;
	}

	.tomorrow {
		font-size: 0.85rem;
		color: var(--text2);
	}
</style>
