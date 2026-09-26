<script lang="ts">
	import AudioButton from '$lib/components/AudioButton.svelte';
	import SaveButton from '$lib/components/SaveButton.svelte';
	import type { Dialect } from '$lib/types/index';
	import type { GameWord } from '$lib/games/word-pool';

	interface Props {
		words: GameWord[];
		dialect: Dialect;
		isSubscribed: boolean;
		signedIn: boolean;
		/** Marks each row right or wrong, keyed by word id. */
		outcomes?: Record<string, boolean>;
	}

	let { words, dialect, isSubscribed, signedIn, outcomes }: Props = $props();
</script>

<h3 class="title">The words</h3>
<ul class="list">
	{#each words as word (word.id)}
		<li class="row">
			{#if outcomes}
				<span class="mark" class:ok={outcomes[word.id]}>
					{outcomes[word.id] ? '✓' : '✗'}
					<span class="sr-only">{outcomes[word.id] ? 'Correct' : 'Missed'}</span>
				</span>
			{/if}
			<span class="words">
				<span class="arabic" lang="ar" dir="rtl">{word.arabic}</span>
				<span class="gloss">
					{#if word.transliteration}<span class="translit">{word.transliteration}</span> ·{/if}
					{word.english}
				</span>
			</span>
			<span class="tools">
				<!-- Recordings are free; text-to-speech for words without one is a Premium feature. -->
				{#if word.audioUrl || isSubscribed}
					<AudioButton text={word.arabic} {dialect} audioUrl={word.audioUrl ?? undefined} />
				{/if}
				{#if signedIn}
					<SaveButton
						className=""
						objectToSave={{
							arabic: word.arabic,
							english: word.english,
							transliterated: word.transliteration,
							dialect
						}}
					/>
				{/if}
			</span>
		</li>
	{/each}
</ul>

<style>
	.title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text1);
		margin-bottom: 0.6rem;
	}

	.list {
		display: grid;
		gap: 0.45rem;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		border-radius: 0.9rem;
		background: var(--tile3);
		border: 2px solid var(--tile5);
		padding: 0.55rem 0.8rem;
	}

	.mark {
		flex-shrink: 0;
		width: 1.5rem;
		font-weight: 700;
		color: #e11d48;
	}

	.mark.ok {
		color: #059669;
	}

	.words {
		display: flex;
		flex: 1;
		min-width: 0;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.2rem 0.8rem;
	}

	.arabic {
		font-size: 1.35rem;
		font-weight: 600;
		color: var(--text1);
	}

	.gloss {
		font-size: 0.85rem;
		color: var(--text2);
	}

	.translit {
		font-style: italic;
	}

	.tools {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.35rem;
	}
</style>
