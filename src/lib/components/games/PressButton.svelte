<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		onclick?: () => void;
		accent?: string;
		deep?: string;
		disabled?: boolean;
		/** A quieter, tile-coloured variant for secondary actions. */
		quiet?: boolean;
		type?: 'button' | 'submit';
		children: Snippet;
	}

	let {
		onclick,
		accent = '#22c55e',
		deep = '#15803d',
		disabled = false,
		quiet = false,
		type = 'button',
		children
	}: Props = $props();
</script>

<button
	{type}
	{onclick}
	{disabled}
	class="press"
	class:quiet
	style="--accent:{accent}; --deep:{deep};"
>
	{@render children()}
</button>

<style>
	.press {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		min-height: 2.75rem;
		padding: 0.65rem 1.25rem;
		border-radius: 1rem;
		font-size: 0.95rem;
		font-weight: 600;
		color: #fff;
		background: var(--accent);
		box-shadow: 0 4px 0 var(--deep);
		cursor: pointer;
		transition:
			transform 0.14s ease,
			box-shadow 0.14s ease,
			filter 0.2s ease;
	}

	.press:hover:not(:disabled) {
		filter: brightness(1.06);
	}

	.press:active:not(:disabled) {
		transform: translateY(4px);
		box-shadow: 0 0 0 var(--deep);
	}

	.press:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.press.quiet {
		color: var(--text1);
		background: var(--tile3);
		border: 2px solid var(--tile5);
		box-shadow: 0 4px 0 var(--tile5);
	}

	.press.quiet:active:not(:disabled) {
		box-shadow: 0 0 0 var(--tile5);
	}

	@media (prefers-reduced-motion: reduce) {
		.press {
			transition: none;
		}
		.press:active:not(:disabled) {
			transform: none;
		}
	}
</style>
