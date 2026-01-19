<script lang="ts">
  import { currentDialect } from '$lib/store/store';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  type DialectKey = 'egyptian-arabic' | 'fusha' | 'levantine' | 'darija';

  // Update dialect based on current route
  onMount(() => {
    const unsubscribe = page.subscribe(($page) => {
      const path = $page.url.pathname;
      if (path.startsWith('/egyptian-arabic')) {
        currentDialect.set('egyptian-arabic');
      } else if (path.startsWith('/fusha')) {
        currentDialect.set('fusha');
      } else if (path.startsWith('/levantine')) {
        currentDialect.set('levantine');
      } else if (path.startsWith('/darija')) {
        currentDialect.set('darija');
      } else if (path.startsWith('/iraqi')) {
        currentDialect.set('iraqi');
      } else if (path.startsWith('/khaleeji')) {
        currentDialect.set('khaleeji');
      } else {
        currentDialect.set('');
      }
    });

    return unsubscribe;
  });

  // Define features for each dialect
  const dialectFeatures: Record<DialectKey, Array<{ href: string; label: string; disabled?: boolean }>> = {
    'egyptian-arabic': [
      // { href: '/egyptian-arabic/stories', label: 'Stories' },
      // { href: '/egyptian-arabic/speak', label: 'Speaking' },
      // { href: '/egyptian-arabic/sentences', label: 'Sentences' },
      { href: '/egyptian-arabic/grammar', label: 'Grammar' },
      { href: '/egyptian-arabic/write', label: 'Writing' },
      { href: '/egyptian-arabic/vocab', label: 'Vocabulary' },
      { href: '/anki-decks', label: 'Anki Decks' }
    ],
    'fusha': [
      // { href: '/fusha/stories', label: 'Stories' },
      // { href: '/fusha/speak', label: 'Speaking' },
      // { href: '/fusha/sentences', label: 'Sentences' },
      { href: '/fusha/write', label: 'Writing' },
      { href: '/fusha/vocab', label: 'Vocabulary' },
      { href: '/anki-decks', label: 'Anki Decks' }
    ],
    'levantine': [
      // { href: '/levantine/stories', label: 'Stories' },
      // { href: '/levantine/speak', label: 'Speaking' },
      // { href: '/levantine/sentences', label: 'Sentences' },
      { href: '/levantine/write', label: 'Writing' },
      { href: '/levantine/vocab', label: 'Vocabulary' },
      { href: '/anki-decks', label: 'Anki Decks' }
    ],
    'darija': [
      // { href: '/darija/stories', label: 'Stories' },
      // { href: '/darija/speak', label: 'Speaking' },
      // { href: '/darija/sentences', label: 'Sentences' },
      { href: '/darija/write', label: 'Writing' },
      { href: '/darija/vocab', label: 'Vocabulary' },
      { href: '/anki-decks', label: 'Anki Decks' }
    ],
  };

  const dialectNames: Record<DialectKey, string> = {
    'egyptian-arabic': 'Egyptian Arabic',
    'fusha': 'Modern Standard Arabic (Fusha)',
    'levantine': 'Levantine Arabic',
    'darija': 'Darija',
  };
</script>

{#if $currentDialect && $currentDialect in dialectNames}
  <nav class="w-full border-b border-tile-600 py-3 bg-tile-400">
    <div class="max-w-5xl mx-auto px-4">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-lg font-semibold text-text-300">
          {dialectNames[$currentDialect as DialectKey]}
        </h2>
        <a href="/" class="text-sm text-text-200 hover:text-text-300 underline">
          ← All Dialects
        </a>
      </div>
      
      <menu class="flex gap-3 items-center flex-wrap">
        {#each dialectFeatures[$currentDialect as DialectKey] as feature}
          <li>
            <a 
              href={feature.href} 
              class="text-text-300 text-sm hover:text-text-200 underline {feature.disabled ? 'opacity-60 cursor-not-allowed' : ''}"
              class:pointer-events-none={feature.disabled}
            >
              {feature.label}
            </a>
          </li>
        {/each}
      </menu>
    </div>
  </nav>
{/if} 