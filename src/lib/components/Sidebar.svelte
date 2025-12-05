<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { sidebarCollapsed } from '$lib/store/store';
  import Button from './Button.svelte';
  import Logo from './Logo.svelte';

  interface NavItem {
    label: string;
    href: string;
    icon: string;
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  interface Props {
    session: any;
    handleOpenDrawer?: () => void;
  }

  let { session, handleOpenDrawer }: Props = $props();

  // Load collapsed state from localStorage on mount
  onMount(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved === 'true') {
        sidebarCollapsed.set(true);
      }
    }
  });

  // Sync localStorage with store changes
  $effect(() => {
    const unsubscribe = sidebarCollapsed.subscribe((value) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar-collapsed', value.toString());
      }
    });
    return unsubscribe;
  });

  function toggleSidebar() {
    sidebarCollapsed.update(collapsed => !collapsed);
  }

  const navSections = $derived.by(() => {
    const baseSections: NavSection[] = [
      {
        title: 'Learn',
        items: [
          { label: 'Alphabet', href: '/alphabet', icon: '✍️' },
          { label: 'Lessons', href: '/lessons', icon: '📚' },
          { label: 'Vocab Review', href: '/review', icon: '🧠' },
          { label: 'Vocabulary', href: '/vocabulary', icon: '📖' },
        ]
      },
      {
        title: 'Practice',
        items: [
          { label: 'Sentences', href: '/sentences', icon: '📝' },
          { label: 'Stories', href: '/stories', icon: '📖' },
          { label: 'Speak', href: '/speak', icon: '🎙️' }
        ]
      },
      {
        title: 'Explore',
        items: [
          { label: 'Videos', href: '/videos', icon: '📺' },
          { label: 'Tutor', href: '/tutor', icon: '💬' }
        ]
      },
      {
        title: 'General',
        items: [
          session 
            ? { label: 'Profile', href: '/profile', icon: '👤' }
            : { label: 'Login', href: '/login', icon: '🔐' }
        ]
      }
    ];
    return baseSections;
  });

  let expandedSections = $state<Set<string>>(new Set(['Learn', 'Practice', 'Explore', 'General']));

  function toggleSection(title: string) {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(title)) {
      newExpanded.delete(title);
    } else {
      newExpanded.add(title);
    }
    expandedSections = newExpanded;
  }

  function isActive(href: string): boolean {
    const currentPath = $page.url.pathname;
    if (href === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(href);
  }
</script>

<aside class="hidden lg:flex flex-col bg-tile-300 border-r-2 border-tile-600 h-screen fixed top-0 left-0 overflow-hidden z-40 transition-all duration-300 {$sidebarCollapsed ? 'w-0 opacity-0' : 'w-64 opacity-100'}">
  <div class="p-6 {$sidebarCollapsed ? 'hidden' : ''}">
    <div class="flex items-center justify-between mb-8">
      <a href="/" class="flex items-center logo-container flex-1 min-w-0">
        <h1 class="text-xl font-bold">Parallel Arabic</h1>
      </a>
      <button
        type="button"
        onclick={toggleSidebar}
        class="p-2 rounded-lg hover:bg-tile-400 transition-colors text-text-300 flex-shrink-0 ml-2"
        aria-label="Collapse sidebar"
        title="Collapse sidebar"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <nav class="flex flex-col gap-2">
      {#each navSections as section}
        <div class="mb-2">
          <button
            type="button"
            onclick={() => toggleSection(section.title)}
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg md:hover:bg-tile-400 transition-colors text-text-200 font-semibold text-sm uppercase tracking-wide"
          >
            <span>{section.title}</span>
            <span
              class="transition-transform duration-200 text-xs"
              style="transform: {expandedSections.has(section.title) ? 'rotate(180deg)' : 'rotate(0deg)'}"
            >
              ▼
            </span>
          </button>

          {#if expandedSections.has(section.title)}
            <div class="mt-1 flex flex-col gap-1">
              {#each section.items as item}
                <a
                  href={item.href}
                  class="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-text-200"
                  class:bg-tile-500={isActive(item.href)}
                  class:border-l-4={isActive(item.href)}
                  class:border-blue-500={isActive(item.href)}
                  class:text-text-300={isActive(item.href)}
                  class:font-semibold={isActive(item.href)}
                  class:md:hover:bg-tile-400={!isActive(item.href)}
                >
                  <span class="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </nav>

    <!-- Theme Toggle -->
    {#if handleOpenDrawer}
      <div class="mt-6 pt-6 border-t border-tile-600">
        <Button onClick={handleOpenDrawer} type="button" className="w-full">
          Theme
        </Button>
      </div>
    {/if}
  </div>
</aside>

<style>
  aside {
    scrollbar-width: thin;
    scrollbar-color: var(--tile-600) var(--tile-300);
  }

  aside::-webkit-scrollbar {
    width: 6px;
  }

  aside::-webkit-scrollbar-track {
    background: var(--tile-300);
  }

  aside::-webkit-scrollbar-thumb {
    background: var(--tile-600);
    border-radius: 3px;
  }

  .logo-container {
    transition: transform 0.2s ease;
  }

  .logo-container:hover {
    transform: scale(1.02);
  }
</style>
