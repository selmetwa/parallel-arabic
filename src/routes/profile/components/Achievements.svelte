<script lang="ts">
  import type { Achievement } from '$lib/config/achievements';
  import { TIER_META } from '$lib/config/achievements';
  import AchievementBadge from './AchievementBadge.svelte';

  let { achievements }: { achievements: Achievement[] } = $props();

  const earnedCount = $derived(achievements.filter(a => a.earned).length);

  let hoveredId = $state<string | null>(null);
</script>

<section>
  <h2 class="text-xl font-bold text-text-300 mb-4 flex items-center gap-2">
    <span class="text-2xl">🏆</span>
    Achievements
    <span class="text-sm font-normal text-text-200 ml-1">({earnedCount}/{achievements.length})</span>
  </h2>

  <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
    {#each achievements as achievement (achievement.id)}
      {@const tierMeta = TIER_META[achievement.tier]}
      {@const isHovered = hoveredId === achievement.id}

      <div
        class="relative rounded-xl p-3 text-center transition-all duration-150 cursor-default select-none"
        class:earned-card={achievement.earned}
        class:locked-card={!achievement.earned}
        style={achievement.earned
          ? `border: 2px solid ${tierMeta.ringColor}; background: color-mix(in srgb, ${tierMeta.circleFill[1]} 12%, var(--tile4));`
          : ''}
        onmouseenter={() => hoveredId = achievement.id}
        onmouseleave={() => hoveredId = null}
        onfocus={() => hoveredId = achievement.id}
        onblur={() => hoveredId = null}
        role="img"
        aria-label={achievement.description}
        tabindex="0"
      >
        <!-- Earned checkmark chip -->
        {#if achievement.earned}
          <div
            class="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold z-10 shadow"
            style="background-color: {tierMeta.ringColor};"
          >
            ✓
          </div>
        {/if}

        <div class="w-16 h-16 mx-auto" class:opacity-40={!achievement.earned}>
          <AchievementBadge
            category={achievement.category}
            tier={achievement.tier}
            earned={achievement.earned}
            name={achievement.name}
            description={achievement.description}
          />
        </div>

        <p class="text-xs font-bold mt-2 leading-tight {achievement.earned ? 'text-text-300' : 'text-text-200 opacity-50'}">
          {achievement.name}
        </p>

        <span
          class="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1"
          class:opacity-40={!achievement.earned}
          style="background-color: {tierMeta.ringColor}; color: {tierMeta.iconColor};"
        >
          {tierMeta.label}
        </span>

        <!-- Tooltip -->
        {#if isHovered}
          <div
            class="absolute z-50 bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-44 bg-tile-500 border border-tile-600 rounded-xl shadow-xl px-3 py-2.5 text-left pointer-events-none"
          >
            <!-- Arrow -->
            <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0" style="border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid var(--tile6);"></div>

            <p class="text-xs font-bold text-text-300 mb-1">{achievement.name}</p>
            <p class="text-xs text-text-200 leading-snug mb-2">
              {#if achievement.earned}✓ Unlocked · {/if}Reach <span class="text-text-300 font-semibold">{achievement.threshold.toLocaleString()}</span>
              {achievement.category === 'streak' ? 'day streak' : achievement.category}
            </p>
            <span
              class="inline-block text-xs font-semibold px-2 py-0.5 rounded-full"
              style="background-color: {tierMeta.ringColor}; color: {tierMeta.iconColor};"
            >
              {tierMeta.label}
            </span>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</section>

<style>
  .earned-card {
    box-shadow: 0 0 0 1px color-mix(in srgb, currentColor 10%, transparent);
  }

  .locked-card {
    background-color: var(--tile4);
    border: 2px solid var(--tile6);
  }
</style>
