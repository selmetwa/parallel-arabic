<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { DIALECTS, getDialectInfo } from '$lib/constants/dialects';
	import { resolveVariety, varietiesFor } from '$lib/constants/varieties';
	import type { Dialect } from '$lib/types/index';

	interface Props {
		dialect: string;
		/** Show the "Learning X" label next to the flag. */
		showLabel?: boolean;
		/** Which way the menu opens. */
		align?: 'left' | 'right';
	}

	let { dialect, showLabel = false, align = 'right' }: Props = $props();

	let open = $state(false);
	let saving = $state(false);
	let error = $state('');

	const current = $derived(getDialectInfo(dialect) ?? DIALECTS[0]);
	// The learner's own variety only counts on their own dialect.
	const currentVariety = $derived(
		resolveVariety(dialect, {
			target_dialect: page.data.targetDialect,
			target_variety: page.data.targetVariety
		})
	);

	// A dialect with varieties is listed as its varieties: Syrian, Lebanese, ...
	type Option = { id: string; dialect: Dialect; variety?: string; flag: string; name: string };
	const options: Option[] = DIALECTS.filter((d) => d.selectable).flatMap((d): Option[] => {
		const varieties = varietiesFor(d.key);
		if (!varieties.length) return [{ id: d.key, dialect: d.key, flag: d.flag, name: d.name }];
		return varieties.map((v) => ({ id: `${d.key}:${v.key}`, dialect: d.key, variety: v.key, flag: v.flag, name: v.name }));
	});

	// Pages that carry the dialect in their URL follow the switch.
	function urlFor(next: Dialect): string | null {
		const url = new URL(page.url);
		let changed = false;
		const segments = url.pathname.split('/').map((s) => {
			if (s === dialect) {
				changed = true;
				return next;
			}
			return s;
		});
		url.pathname = segments.join('/');
		if (url.searchParams.has('dialect')) {
			url.searchParams.set('dialect', next);
			changed = true;
		}
		// A lesson link points at the old path's lesson.
		url.searchParams.delete('lessonId');
		url.searchParams.delete('step');
		return changed ? url.pathname + url.search : null;
	}

	function isCurrent(next: Dialect, variety?: string) {
		return next === dialect && variety === currentVariety?.key;
	}

	async function choose(next: Dialect, variety?: string) {
		if (isCurrent(next, variety)) {
			open = false;
			return;
		}
		saving = true;
		error = '';
		try {
			const res = await fetch('/api/user-preferences/dialect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ dialect: next, variety })
			});
			if (!res.ok) throw new Error('Failed');
			open = false;
			const target = next === dialect ? null : urlFor(next);
			if (target) await goto(target, { invalidateAll: true });
			else await invalidateAll();
		} catch {
			error = "Couldn't switch dialect. Try again.";
		} finally {
			saving = false;
		}
	}

	function onWindowClick(e: MouseEvent) {
		if (!open) return;
		const target = e.target as HTMLElement | null;
		if (!target?.closest('[data-dialect-switcher]')) open = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') open = false;
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onKeydown} />

<div class="relative" data-dialect-switcher>
	<button
		type="button"
		onclick={() => (open = !open)}
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-label="Switch dialect (currently {currentVariety?.name ?? current.name})"
		class="flex items-center gap-2 rounded-full border border-tile-500/50 bg-tile-400/50 px-3 py-1.5 transition-colors duration-200 hover:bg-tile-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-text-300"
	>
		<span class="text-xl leading-none sm:text-2xl">{currentVariety?.flag ?? current.flag}</span>
		{#if showLabel}
			<span class="truncate text-xs text-text-200 sm:text-sm">Learning {currentVariety?.shortName ?? current.shortName}</span>
		{/if}
		<svg class="h-3 w-3 text-text-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path>
		</svg>
	</button>

	{#if open}
		<div
			class="absolute top-full z-[80] mt-2 max-h-[70vh] w-56 overflow-y-auto rounded-xl border border-tile-600 bg-tile-300 p-2 shadow-xl {align === 'right' ? 'right-0' : 'left-0'}"
		>
			<p class="px-2 pb-2 pt-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-text-200">I'm learning</p>
			<ul role="listbox" aria-label="Dialect">
				{#each options as d (d.id)}
					{@const selected = isCurrent(d.dialect, d.variety)}
					<li role="option" aria-selected={selected}>
						<button
							type="button"
							disabled={saving}
							onclick={() => choose(d.dialect, d.variety)}
							class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors duration-150 disabled:opacity-60 {selected
								? 'bg-tile-500 font-semibold text-text-300'
								: 'text-text-200 hover:bg-tile-400 hover:text-text-300'}"
						>
							<span class="text-xl leading-none">{d.flag}</span>
							<span class="flex-1">{d.name}</span>
							{#if selected}
								<span aria-hidden="true">✓</span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
			{#if error}
				<p class="px-2 pt-2 text-xs text-red-500" role="alert">{error}</p>
			{/if}
		</div>
	{/if}
</div>
