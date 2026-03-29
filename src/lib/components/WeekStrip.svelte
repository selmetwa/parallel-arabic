<script lang="ts">
  import Tooltip from './Tooltip.svelte';

  interface Props {
    weekActivityDates: number[];
    weekStartTimestamp: number;
  }

  let { weekActivityDates, weekStartTimestamp }: Props = $props();

  // Mon–Sun order, matching weekStartTimestamp which is always Monday midnight UTC
  // arabicNum: Eastern Arabic numeral (null for days without number-based names)
  const ARABIC_DAYS = [
    { arabic: 'الإثنين',   transliteration: 'al-ithnayn',     short: 'Mon', arabicNum: '٢' },
    { arabic: 'الثلاثاء', transliteration: 'ath-thalāthāʾ', short: 'Tue', arabicNum: '٣' },
    { arabic: 'الأربعاء', transliteration: 'al-arbiʿāʾ',     short: 'Wed', arabicNum: '٤' },
    { arabic: 'الخميس',   transliteration: 'al-khamīs',       short: 'Thu', arabicNum: '٥' },
    { arabic: 'الجمعة',   transliteration: 'al-jumuʿa',       short: 'Fri', arabicNum: null },
    { arabic: 'السبت',    transliteration: 'as-sabt',          short: 'Sat', arabicNum: null },
    { arabic: 'الأحد',    transliteration: 'al-aḥad',          short: 'Sun', arabicNum: '١' },
  ];

  const days = $derived.by(() => {
    const todayDate = new Date();
    const todayMidnight = Date.UTC(
      todayDate.getUTCFullYear(),
      todayDate.getUTCMonth(),
      todayDate.getUTCDate()
    );
    const activeSet = new Set(weekActivityDates);
    return ARABIC_DAYS.map((info, i) => {
      const ts = weekStartTimestamp + i * 86400000;
      return {
        ...info,
        isToday: ts === todayMidnight,
        hasActivity: activeSet.has(ts),
      };
    });
  });
</script>

<div class="flex justify-center items-center gap-3 sm:gap-4 py-1 mb-6">
  {#each days as day (day.short)}
    <Tooltip text="{day.arabic} · {day.transliteration} · {day.short}" position="bottom">
      <div class="flex flex-col items-center gap-1 cursor-default">
        <div
          class="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200
            {day.hasActivity
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md'
              : 'bg-tile-400 border border-tile-500'}
            {day.isToday ? 'ring-2 ring-offset-2 ring-offset-tile-200 ring-amber-400' : ''}"
        >
          {#if day.arabicNum}
            <span
              class="font-bold leading-none select-none
                {day.hasActivity ? 'text-white text-base' : 'text-text-200 text-base'}"
              style="font-family: 'Amiri', 'Noto Sans Arabic', serif;"
            >{day.arabicNum}</span>
          {:else}
            <span
              class="text-[10px] font-medium leading-none select-none
                {day.hasActivity ? 'text-white' : 'text-text-200'}"
            >{day.short}</span>
          {/if}
        </div>
      </div>
    </Tooltip>
  {/each}
</div>
