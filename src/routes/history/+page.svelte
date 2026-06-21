<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const hasHistory = $derived(data.days.length > 0);
</script>

<section class="min-h-screen">
	<header class="max-w-3xl mx-auto px-4 sm:px-8 pt-10 pb-8 border-b border-tile-500">
		<h1 class="text-4xl sm:text-5xl font-black text-text-300 tracking-tight leading-tight">
			History
		</h1>
		<p class="mt-3 text-text-200 text-base sm:text-lg max-w-lg leading-relaxed">
			Your activity from the last 30 days. Pick up where you left off.
		</p>
	</header>

	<div class="max-w-3xl mx-auto px-4 sm:px-8 py-8">
		{#if !hasHistory}
			<div class="flex flex-col items-center text-center bg-tile-400 border border-tile-500 rounded-2xl px-6 py-16">
				<div class="text-5xl mb-4">🕊️</div>
				<h2 class="text-xl font-bold text-text-300 mb-2">No activity yet</h2>
				<p class="text-text-200 max-w-sm leading-relaxed">
					Read a story, take a lesson, play a game, or chat with the tutor — it'll show up here, grouped by day.
				</p>
			</div>
		{:else}
			{#each data.days as day (day.dayKey)}
				<div class="mb-8">
					<h2 class="text-[11px] uppercase tracking-[0.2em] text-text-200 font-bold mb-3">
						{day.dayLabel}
					</h2>

					<div class="flex flex-col gap-2">
						{#each day.items as item (item.id)}
							<a
								href={item.href}
								class="group flex items-center gap-4 bg-tile-400 border border-tile-500 rounded-xl px-4 py-3 shadow-sm transition-all duration-200 hover:bg-tile-500 hover:shadow-md active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
							>
								<span
									class="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-tile-300 text-xl leading-none"
									aria-hidden="true"
								>
									{item.icon}
								</span>

								<div class="min-w-0 flex-1">
									<p class="text-sm sm:text-base font-semibold text-text-300 truncate">
										{item.title}
									</p>
									<p class="text-xs sm:text-sm text-text-200 truncate">
										{item.subtitle}
									</p>
								</div>

								<svg
									class="h-4 w-4 flex-shrink-0 text-text-200 transition-transform duration-200 group-hover:translate-x-0.5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
								</svg>
							</a>
						{/each}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</section>
