<script lang="ts">
  import { page } from '$app/stores';

  interface NavItem {
    label: string;
    href: string;
    icon: string;
    paths: string[]; // Additional paths that should activate this nav item
  }

  const navItems: NavItem[] = [
    {
      label: 'Learn',
      href: '/lessons',
      icon: '📚',
      paths: ['/alphabet', '/lessons', '/sentences', '/vocabulary']
    },
    {
      label: 'Review',
      href: '/review',
      icon: '🧠',
      paths: ['/review']
    },
    {
      label: 'Explore',
      href: '/stories',
      icon: '📖',
      paths: ['/stories', '/tutor'] // '/videos' hidden - not ready yet
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: '👤',
      paths: ['/profile', '/settings']
    }
  ];

  function isActive(item: NavItem): boolean {
    const currentPath = $page.url.pathname;
    return item.paths.some(path => currentPath.startsWith(path));
  }
</script>

<nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-tile-300 border-t-2 border-tile-600 z-50 safe-area-bottom">
  <div class="flex items-center justify-around h-16">
    {#each navItems as item}
      <a
        href={item.href}
        class="flex flex-col items-center justify-center flex-1 h-full transition-all duration-200"
        class:text-blue-500={isActive(item)}
        class:text-text-200={!isActive(item)}
      >
        <span class="text-2xl mb-0.5">{item.icon}</span>
        <span
          class="text-xs font-medium"
          class:font-semibold={isActive(item)}
        >
          {item.label}
        </span>
      </a>
    {/each}
  </div>
</nav>

<style>
  /* Add padding to account for bottom nav on mobile */
  :global(body) {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
</style>
