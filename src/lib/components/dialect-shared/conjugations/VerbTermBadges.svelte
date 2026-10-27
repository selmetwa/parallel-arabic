<script lang="ts">
	import { FORMS, classEntry, type DerivedForm, type GlossaryEntry } from '$lib/data/verb-conjugations/glossary';

	// The verb's form and class as badges; tapping one explains the term.
	interface Props {
		form?: string;
		verbClass: string;
	}

	let { form, verbClass }: Props = $props();

	const formInfo = $derived(form ? FORMS[form as DerivedForm] : undefined);
	const classInfo = $derived(classEntry(verbClass));

	let open = $state<'form' | 'class' | null>(null);
	const shown = $derived<GlossaryEntry | undefined>(
		open === 'form' ? formInfo : open === 'class' ? classInfo : undefined
	);

	function toggle(which: 'form' | 'class') {
		open = open === which ? null : which;
	}
</script>

<div class="mt-2 flex flex-wrap justify-center gap-2">
	{#if formInfo}
		<button
			type="button"
			onclick={() => toggle('form')}
			aria-expanded={open === 'form'}
			class="rounded border border-tile-600 bg-tile-500 px-2 py-0.5 text-xs font-semibold text-text-200 hover:text-text-300"
		>
			{formInfo.label} ⓘ
		</button>
	{/if}
	{#if classInfo}
		<button
			type="button"
			onclick={() => toggle('class')}
			aria-expanded={open === 'class'}
			class="rounded border border-tile-600 bg-tile-500 px-2 py-0.5 text-xs font-semibold text-text-200 hover:text-text-300"
		>
			{classInfo.label} ⓘ
		</button>
	{:else}
		<span class="rounded border border-tile-600 bg-tile-500 px-2 py-0.5 text-xs font-semibold text-text-200">
			{verbClass}
		</span>
	{/if}
</div>

{#if shown}
	<div class="mx-auto mt-3 max-w-md rounded-lg border border-tile-500 bg-tile-200 p-3 text-left text-sm text-text-200" role="note">
		<p class="font-semibold text-text-300">
			{shown.label}
			{#if shown.pattern}<span class="ml-1 font-normal" dir="auto">{shown.pattern}</span>{/if}
		</p>
		<p class="mt-1">{shown.summary}</p>
		<p class="mt-1 text-xs" dir="auto">{shown.examples.join(' · ')}</p>
	</div>
{/if}
