<script lang="ts">
  import { TIER_META } from '$lib/config/achievements';
  import type { AchievementCategory, AchievementTier } from '$lib/config/achievements';

  let {
    category,
    tier,
    earned,
    name,
    description
  }: {
    category: AchievementCategory;
    tier: AchievementTier;
    earned: boolean;
    name: string;
    description: string;
  } = $props();

  const meta = TIER_META[tier];
  const gradId = `grad-${category}-${tier}`;
</script>

<div title={description} style={earned ? '' : 'filter: grayscale(1); opacity: 0.35'}>
  <svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-label={name}>
    <defs>
      <radialGradient id={gradId} cx="40%" cy="35%" r="65%">
        <stop offset="0%" stop-color={meta.circleFill[0]} />
        <stop offset="100%" stop-color={meta.circleFill[1]} />
      </radialGradient>
    </defs>

    <!-- Outer ring -->
    <circle cx="48" cy="48" r="47" fill={meta.ringColor} />
    <!-- Main circle -->
    <circle cx="48" cy="48" r="43" fill="url(#{gradId})" />

    <!-- Category icon -->
    {#if category === 'sentences'}
      <!-- Three horizontal text lines -->
      <rect x="26" y="30" width="44" height="6" rx="3" fill={meta.iconColor} />
      <rect x="26" y="44" width="36" height="6" rx="3" fill={meta.iconColor} />
      <rect x="26" y="58" width="28" height="6" rx="3" fill={meta.iconColor} />

    {:else if category === 'stories'}
      <!-- Open book: two pages with a spine -->
      <path
        d="M48 34 L20 40 L20 68 L48 62 Z"
        fill="none"
        stroke={meta.iconColor}
        stroke-width="3"
        stroke-linejoin="round"
      />
      <path
        d="M48 34 L76 40 L76 68 L48 62 Z"
        fill="none"
        stroke={meta.iconColor}
        stroke-width="3"
        stroke-linejoin="round"
      />
      <line x1="48" y1="34" x2="48" y2="62" stroke={meta.iconColor} stroke-width="3" />

    {:else if category === 'lessons'}
      <!-- Mortarboard: flat board + head + tassel -->
      <!-- Head/cap base -->
      <ellipse cx="48" cy="52" rx="18" ry="10" fill={meta.iconColor} />
      <!-- Top flat board -->
      <polygon points="48,28 72,40 48,46 24,40" fill={meta.iconColor} />
      <!-- Tassel string -->
      <line x1="66" y1="40" x2="66" y2="58" stroke={meta.iconColor} stroke-width="2.5" />
      <circle cx="66" cy="60" r="3" fill={meta.iconColor} />

    {:else if category === 'reviews'}
      <!-- Two circular arrows (refresh symbol) -->
      <!-- Top arc → right -->
      <path
        d="M34 36 A18 18 0 0 1 62 36"
        fill="none"
        stroke={meta.iconColor}
        stroke-width="5"
        stroke-linecap="round"
      />
      <!-- Arrowhead top-right -->
      <polygon points="62,28 62,44 72,36" fill={meta.iconColor} />
      <!-- Bottom arc ← left -->
      <path
        d="M62 60 A18 18 0 0 1 34 60"
        fill="none"
        stroke={meta.iconColor}
        stroke-width="5"
        stroke-linecap="round"
      />
      <!-- Arrowhead bottom-left -->
      <polygon points="34,52 34,68 24,60" fill={meta.iconColor} />

    {:else if category === 'games'}
      <!-- Game controller outline -->
      <!-- Body -->
      <rect x="18" y="36" width="60" height="32" rx="12" fill="none" stroke={meta.iconColor} stroke-width="4" />
      <!-- D-pad left/right -->
      <rect x="24" y="48" width="16" height="6" rx="2" fill={meta.iconColor} />
      <!-- D-pad up/down -->
      <rect x="29" y="43" width="6" height="16" rx="2" fill={meta.iconColor} />
      <!-- Buttons -->
      <circle cx="64" cy="46" r="4" fill={meta.iconColor} />
      <circle cx="72" cy="52" r="4" fill={meta.iconColor} />
      <circle cx="56" cy="52" r="4" fill={meta.iconColor} />
      <circle cx="64" cy="58" r="4" fill={meta.iconColor} />

    {:else if category === 'streak'}
      <!-- Flame silhouette -->
      <path
        d="M48 20
           C48 20 60 30 60 42
           C60 36 54 34 54 34
           C56 44 52 48 52 48
           C54 42 50 40 50 40
           C50 52 44 54 44 54
           C38 54 34 50 34 44
           C34 36 42 28 48 20Z"
        fill={meta.iconColor}
      />
      <!-- Inner flame -->
      <path
        d="M48 38
           C48 38 54 44 52 52
           C50 58 44 60 44 60
           C42 60 38 56 38 52
           C38 46 44 40 48 38Z"
        fill={meta.circleFill[1]}
        opacity="0.5"
      />
    {/if}
  </svg>
</div>
