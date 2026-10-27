<script lang="ts">
	import { CLASSES, FORMS, ROOTS_INTRO, type DerivedForm } from '$lib/data/verb-conjugations/glossary';

	interface Props {
		/** Grammar article links, when the dialect has them. */
		grammarHref?: string;
	}

	let { grammarHref }: Props = $props();

	// The forms the tables actually use, in order; IX is listed for completeness.
	const formKeys: DerivedForm[] = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'Q'];
	const classKeys = ['sound', 'hollow', 'defective', 'doubled', 'hamzated', 'irregular'];
</script>

<details class="group mb-6 rounded-xl border border-tile-500 bg-tile-300">
	<summary
		class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold text-text-300"
	>
		<span>What do "Form III" and "hollow" mean?</span>
		<svg
			class="h-4 w-4 flex-shrink-0 text-text-200 transition-transform duration-200 group-open:rotate-180"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path>
		</svg>
	</summary>

	<div class="space-y-6 border-t border-tile-500 px-4 py-4 text-sm leading-relaxed text-text-200">
		<p>{ROOTS_INTRO}</p>

		<section>
			<h3 class="mb-2 text-base font-bold text-text-300">Verb forms</h3>
			<dl class="grid gap-3 sm:grid-cols-2">
				{#each formKeys as key (key)}
					{@const f = FORMS[key]}
					<div id="form-{key}" class="rounded-lg border border-tile-500 bg-tile-200 p-3">
						<dt class="font-semibold text-text-300">
							{f.label}
							{#if f.pattern}<span class="ml-1 font-normal text-text-200" dir="auto">{f.pattern}</span>{/if}
						</dt>
						<dd class="mt-1">{f.summary}</dd>
						<dd class="mt-1 text-xs" dir="auto">{f.examples.join(' · ')}</dd>
					</div>
				{/each}
			</dl>
		</section>

		<section>
			<h3 class="mb-2 text-base font-bold text-text-300">Verb classes</h3>
			<p class="mb-2">
				The class says which root letters are "weak" (w, y or a hamza), because those are the letters that
				change shape when the verb conjugates.
			</p>
			<dl class="grid gap-3 sm:grid-cols-2">
				{#each classKeys as key (key)}
					{@const c = CLASSES[key]}
					<div id="class-{key}" class="rounded-lg border border-tile-500 bg-tile-200 p-3">
						<dt class="font-semibold text-text-300">{c.label}</dt>
						<dd class="mt-1">{c.summary}</dd>
						<dd class="mt-1 text-xs" dir="auto">{c.examples.join(' · ')}</dd>
					</div>
				{/each}
			</dl>
		</section>

		{#if grammarHref}
			<p>
				More in the grammar guide:
				<a class="font-semibold text-text-300 underline" href="{grammarHref}/verb-forms">verb forms</a>
				and
				<a class="font-semibold text-text-300 underline" href="{grammarHref}/verb-classes">verb classes</a>.
			</p>
		{/if}
	</div>
</details>
