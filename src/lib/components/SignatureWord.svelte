<script lang="ts">
	interface Props {
		arabic: string;
		transliteration?: string;
		english?: string;
		/** Line above the word, e.g. "Your word from this lesson". */
		caption?: string;
	}

	let { arabic, transliteration = '', english = '', caption = '' }: Props = $props();
</script>

<!--
	The product's signature moment (Small Quirk): a word from what they just did
	writes itself out in Arabic, outline first and then ink. Kept to big moments,
	like finishing a lesson, so it stays special.
-->
<figure class="sig">
	{#if caption}<figcaption class="sig-caption">{caption}</figcaption>{/if}
	<svg
		class="sig-svg"
		viewBox="0 0 400 120"
		role="img"
		aria-label={english ? `${arabic}, ${english}` : arabic}
	>
		<text x="200" y="88" text-anchor="middle" lang="ar" class="sig-text">{arabic}</text>
	</svg>
	{#if transliteration || english}
		<p class="sig-gloss">
			{#if transliteration}<span class="sig-tr">{transliteration}</span>{/if}
			{#if transliteration && english}<span aria-hidden="true"> · </span>{/if}
			{#if english}<span>{english}</span>{/if}
		</p>
	{/if}
</figure>

<style>
	.sig {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		width: 100%;
	}

	.sig-caption {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text2);
	}

	.sig-svg {
		width: min(100%, 22rem);
		height: auto;
		overflow: visible;
	}

	.sig-text {
		font-size: 76px;
		font-weight: 600;
		fill: var(--accent, var(--brand));
		fill-opacity: 0;
		stroke: var(--accent, var(--brand));
		stroke-width: 1.4;
		stroke-linejoin: round;
		stroke-dasharray: 900;
		stroke-dashoffset: 900;
		animation:
			sig-draw 1.6s cubic-bezier(0.45, 0, 0.25, 1) 0.2s forwards,
			sig-ink 0.5s ease 1.6s forwards;
	}

	@keyframes sig-draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes sig-ink {
		to {
			fill-opacity: 1;
		}
	}

	.sig-gloss {
		font-size: 0.95rem;
		color: var(--text2);
		opacity: 0;
		animation: sig-ink 0.4s ease 1.9s forwards;
	}

	.sig-tr {
		font-style: italic;
	}

	@media (prefers-reduced-motion: reduce) {
		.sig-text {
			animation: none;
			fill-opacity: 1;
			stroke-dashoffset: 0;
		}
		.sig-gloss {
			animation: none;
			opacity: 1;
		}
	}
</style>
