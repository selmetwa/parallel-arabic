<script lang="ts">
	import { resolve } from '$app/paths';
	import SubscribeButton from '$lib/components/SubscribeButton.svelte';
	import { getDialectInfo } from '$lib/constants/dialects';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const statusLabel: Record<string, string> = {
		extracted: 'Pick your words',
		building: 'Building…',
		ready: 'Ready',
		failed: "Didn't finish"
	};

	function formatDate(ms: number) {
		return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	}

	// ~13 s per step, from the lesson player's typical pace.
	const minutes = (steps: number | null) => (steps ? Math.max(5, Math.round((steps * 13) / 60)) : null);
</script>

<div class="page">
	<header class="head">
		<p class="eyebrow">Tutor notes</p>
		<h1>Practise what you covered with your tutor</h1>
		<p class="lede">
			Paste the notes from a lesson, or upload the doc. We pull out every word and grammar point, you pick what to
			keep, and get a practice lesson built from them. Every word also joins your review deck.
		</p>
		{#if data.isSubscribed}
			<a class="primary" href={resolve('/notes/new')}>New from notes</a>
		{/if}
	</header>

	{#if !data.isSubscribed}
		<section class="card paywall">
			<p class="paywall-ar" dir="rtl">مِن دَرسَك</p>
			<h2>Tutor notes come with a subscription</h2>
			<p>Turn messy lesson docs into a lesson with recognition, writing, sentence building, speaking and a roleplay.</p>
			<SubscribeButton />
		</section>
	{:else if data.lessons.length === 0}
		<section class="card empty">
			<h2>No notes yet</h2>
			<p>After your next session, paste your tutor's notes here. Tables, loose sentences and grammar notes all work.</p>
		</section>
	{:else}
		<ul class="list">
			{#each data.lessons as lesson (lesson.id)}
				{@const info = getDialectInfo(lesson.dialect)}
				<li>
					<a class="row" href={resolve('/notes/[id]', { id: lesson.id })}>
						<div class="row-main">
							<p class="row-title">{lesson.title}</p>
							<p class="row-meta">
								{info?.shortName ?? lesson.dialect} · {formatDate(lesson.created_at)}
								{#if lesson.status === 'ready' && lesson.word_count}
									· {lesson.word_count} words · ~{minutes(lesson.step_count)} min
								{/if}
							</p>
						</div>
						<span class="status status-{lesson.status}">{statusLabel[lesson.status] ?? lesson.status}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.page {
		max-width: 46rem;
		margin: 0 auto;
		padding: 2.5rem 1rem 4rem;
		color: var(--text1);
	}

	.head {
		margin-bottom: 2rem;
	}
	.eyebrow {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text2);
	}
	h1 {
		margin-top: 0.35rem;
		font-size: clamp(1.6rem, 4vw, 2.1rem);
		font-weight: 700;
		line-height: 1.2;
	}
	.lede {
		margin-top: 0.75rem;
		max-width: 38rem;
		color: var(--text2);
		line-height: 1.55;
	}

	.primary {
		display: inline-block;
		margin-top: 1.25rem;
		padding: 0.8rem 1.3rem;
		border-radius: 0.9rem;
		font-weight: 600;
		color: #fff;
		background: #22c55e;
		box-shadow: 0 4px 0 #15803d;
		transition: transform 0.14s ease, box-shadow 0.14s ease;
	}
	.primary:active {
		transform: translateY(4px);
		box-shadow: 0 0 0 #15803d;
	}

	.card {
		padding: 2rem 1.5rem;
		border-radius: 1.25rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		text-align: center;
	}
	.card h2 {
		font-size: 1.15rem;
		font-weight: 700;
	}
	.card p {
		margin: 0.5rem auto 0;
		max-width: 30rem;
		color: var(--text2);
		line-height: 1.5;
	}
	.paywall-ar {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem !important;
		color: var(--text1) !important;
	}
	.paywall :global(button),
	.paywall :global(a) {
		margin-top: 1.25rem;
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.1rem;
		border-radius: 1rem;
		border: 2px solid var(--tile5);
		border-bottom-width: 4px;
		background: var(--tile3);
		transition: transform 0.15s ease, border-color 0.15s ease;
	}
	.row:hover {
		transform: translateY(-2px);
		border-color: var(--tile6);
	}
	.row-main {
		flex: 1;
		min-width: 0;
	}
	.row-title {
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.row-meta {
		margin-top: 0.15rem;
		font-size: 0.85rem;
		color: var(--text2);
	}
	.status {
		flex-shrink: 0;
		padding: 0.25rem 0.7rem;
		border-radius: 100px;
		font-size: 0.75rem;
		font-weight: 600;
		border: 2px solid var(--tile5);
		color: var(--text2);
	}
	.status-ready {
		border-color: #2e9e5b;
		color: #2e9e5b;
	}
	.status-extracted {
		border-color: var(--text2);
		color: var(--text1);
	}
	.status-failed {
		border-color: #d65745;
		color: #d65745;
	}
</style>
