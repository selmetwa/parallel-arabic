<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { DIALECTS } from '$lib/constants/dialects';
	import { trackEvent } from '$lib/analytics';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const dialects = DIALECTS.filter((d) => d.selectable);

	let mode = $state<'paste' | 'upload'>('paste');
	let text = $state('');
	let file = $state<File | null>(null);
	let dialect = $state(untrack(() => data.defaultDialect));
	let dragging = $state(false);
	let submitting = $state(false);
	let error = $state<string | null>(null);

	const MAX_BYTES = 4 * 1024 * 1024;
	const ready = $derived(mode === 'paste' ? text.trim().length > 0 : file !== null);

	function pick(f: File | undefined | null) {
		error = null;
		if (!f) return;
		const name = f.name.toLowerCase();
		if (name.endsWith('.doc')) {
			error = 'Old .doc files are not supported. Save it as .docx or PDF and upload again.';
		} else if (!name.endsWith('.docx') && !name.endsWith('.pdf')) {
			error = 'Upload a .docx or .pdf file.';
		} else if (f.size > MAX_BYTES) {
			error = 'That file is over 4 MB.';
		} else {
			file = f;
		}
	}

	async function submit() {
		if (!ready || submitting) return;
		submitting = true;
		error = null;
		trackEvent('tutor_notes_extract_started', { mode, dialect });
		try {
			let res: Response;
			if (mode === 'paste') {
				res = await fetch('/api/tutor-notes', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ text, dialect })
				});
			} else {
				const form = new FormData();
				form.append('file', file!);
				form.append('dialect', dialect);
				res = await fetch('/api/tutor-notes', { method: 'POST', body: form });
			}
			const result = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(result.error || 'Something went wrong reading your notes.');
			trackEvent('tutor_notes_extracted', { mode, dialect });
			await goto(resolve('/notes/[id]', { id: result.id }));
		} catch (e) {
			error = e instanceof Error ? e.message : 'Something went wrong reading your notes.';
			submitting = false;
		}
	}
</script>

<div class="page">
	<a class="back" href={resolve('/notes')}>← Tutor notes</a>
	<h1>Add notes from a lesson</h1>
	<p class="lede">Paste them as they are: tables, slashes, half sentences. We'll sort it out.</p>

	<div class="seg-wrap" role="tablist" aria-label="How to add notes">
		<button type="button" role="tab" aria-selected={mode === 'paste'} class="seg" class:is-on={mode === 'paste'} onclick={() => (mode = 'paste')}>
			Paste text
		</button>
		<button type="button" role="tab" aria-selected={mode === 'upload'} class="seg" class:is-on={mode === 'upload'} onclick={() => (mode = 'upload')}>
			Upload a file
		</button>
	</div>

	{#if mode === 'paste'}
		<textarea
			bind:value={text}
			rows="14"
			placeholder="Team | فريق&#10;Embassy | سفارة&#10;&#10;بعت to send&#10;إتبعت to be sent"
			aria-label="Your tutor notes"
		></textarea>
	{:else}
		<label
			class="drop"
			class:is-dragging={dragging}
			ondragover={(e) => {
				e.preventDefault();
				dragging = true;
			}}
			ondragleave={() => (dragging = false)}
			ondrop={(e) => {
				e.preventDefault();
				dragging = false;
				pick(e.dataTransfer?.files[0]);
			}}
		>
			<input type="file" accept=".docx,.pdf" class="sr-only" onchange={(e) => pick(e.currentTarget.files?.[0])} />
			{#if file}
				<span class="drop-file">{file.name}</span>
				<span class="drop-hint">Tap to choose a different file</span>
			{:else}
				<span class="drop-title">Drop your .docx or .pdf here</span>
				<span class="drop-hint">or tap to choose · up to 4 MB · Google Docs: File → Download → .docx</span>
			{/if}
		</label>
	{/if}

	<label class="field">
		<span>Dialect of these notes</span>
		<select bind:value={dialect}>
			{#each dialects as d (d.key)}
				<option value={d.key}>{d.flag} {d.name}</option>
			{/each}
		</select>
	</label>

	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}

	<button type="button" class="primary" disabled={!ready || submitting} onclick={submit}>
		{submitting ? 'Reading your notes…' : 'Find the words'}
	</button>
	{#if submitting}
		<p class="wait">This usually takes 20–40 seconds.</p>
	{/if}
</div>

<style>
	.page {
		max-width: 40rem;
		margin: 0 auto;
		padding: 2.5rem 1rem 4rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		color: var(--text1);
	}
	.back {
		font-size: 0.85rem;
		color: var(--text2);
	}
	.back:hover {
		color: var(--text1);
	}
	h1 {
		font-size: clamp(1.5rem, 4vw, 1.9rem);
		font-weight: 700;
	}
	.lede {
		margin-top: -0.5rem;
		color: var(--text2);
	}

	.seg-wrap {
		display: inline-flex;
		align-self: flex-start;
		padding: 0.2rem;
		border-radius: 100px;
		background: var(--tile3);
		border: 2px solid var(--tile5);
	}
	.seg {
		padding: 0.4rem 1rem;
		border-radius: 100px;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
	}
	.seg.is-on {
		background: var(--text1);
		color: var(--tile2);
	}

	textarea {
		width: 100%;
		padding: 1rem;
		border-radius: 1rem;
		border: 2px solid var(--tile5);
		background: var(--tile1);
		color: var(--text1);
		font-size: 1rem;
		line-height: 1.6;
		resize: vertical;
	}
	textarea:focus,
	select:focus {
		outline: none;
		border-color: var(--tile6);
	}

	.drop {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		min-height: 12rem;
		padding: 1.5rem;
		border-radius: 1rem;
		border: 2px dashed var(--tile6);
		background: var(--tile2);
		text-align: center;
		cursor: pointer;
		transition: background 0.15s ease, border-color 0.15s ease;
	}
	.drop:hover,
	.drop.is-dragging {
		background: var(--tile3);
		border-color: var(--text2);
	}
	.drop-title,
	.drop-file {
		font-weight: 600;
	}
	.drop-hint {
		font-size: 0.85rem;
		color: var(--text2);
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
	}
	select {
		padding: 0.7rem 0.9rem;
		border-radius: 0.8rem;
		border: 2px solid var(--tile5);
		background: var(--tile2);
		color: var(--text1);
		font-size: 1rem;
	}

	.error {
		padding: 0.75rem 1rem;
		border-radius: 0.8rem;
		border: 2px solid #d65745;
		color: #d65745;
		background: color-mix(in srgb, #d65745 10%, transparent);
	}

	.primary {
		padding: 0.95rem 1.2rem;
		border-radius: 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
		background: #22c55e;
		box-shadow: 0 4px 0 #15803d;
		transition: transform 0.14s ease, box-shadow 0.14s ease;
	}
	.primary:not(:disabled):active {
		transform: translateY(4px);
		box-shadow: 0 0 0 #15803d;
	}
	.primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.wait {
		text-align: center;
		font-size: 0.85rem;
		color: var(--text2);
	}
</style>
