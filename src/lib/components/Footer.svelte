<script>
  import Logo from './Logo.svelte';
  import Tooltip from './Tooltip.svelte';
</script>

<footer class="w-full bg-gradient-to-b from-tile-500 to-tile-400 border-t-2 border-tile-600 mt-auto relative z-0 shadow-2xl">
  <div class="max-w-7xl mx-auto px-6 py-12">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
      <div class="space-y-4">
        <h2 class="text-text-100 font-semibold text-lg mb-3 tracking-wide">Parallel Arabic</h2>
        <p class="text-text-300 text-sm leading-relaxed max-w-xs">
          Open source language learning platform for Arabic and her dialects.
        </p>
      </div>

      <div class="space-y-4">
        <h3 class="text-text-100 font-semibold text-base mb-3 tracking-wide">Navigation</h3>
        <ul class="space-y-2 text-text-300 text-sm">
          <li><a href="/" class="hover:text-text-100 transition-all duration-200 hover:translate-x-1 inline-block">Home</a></li>
          <li><a href="/about" class="hover:text-text-100 transition-all duration-200 hover:translate-x-1 inline-block">About</a></li>
          <li><a href="/pricing" class="hover:text-text-100 transition-all duration-200 hover:translate-x-1 inline-block">Pricing</a></li>
          <li><a href="/mobile-app" class="hover:text-text-100 transition-all duration-200 hover:translate-x-1 inline-block">Mobile App</a></li>
          <li><a href="/keyboard" class="hover:text-text-100 transition-all duration-200 hover:translate-x-1 inline-block">Virtual Keyboard</a></li>
        </ul>
      </div>

      <div class="space-y-4">
        <h3 class="text-text-100 font-semibold text-base mb-3 tracking-wide">Resources</h3>
        <ul class="space-y-2 text-text-300 text-sm">
          <li><a href="/anki-decks" class="hover:text-text-100 transition-all duration-200 hover:translate-x-1 inline-block">Anki Decks</a></li>
          <li><a href="/support" class="hover:text-text-100 transition-all duration-200 hover:translate-x-1 inline-block">Support</a></li>
          <li><a href="/faq" class="hover:text-text-100 transition-all duration-200 hover:translate-x-1 inline-block">FAQ</a></li>
          <li><a href="https://github.com/selmetwa/parallel-arabic" target="_blank" class="hover:text-text-100 transition-all duration-200 hover:translate-x-1 inline-block">Source Code</a></li>
        </ul>
      </div>
    </div>

    <div class="pt-8 border-t-2 border-tile-600">
      <p class="text-text-300 text-sm text-center">
        Made with <Tooltip text="Love">
          {#snippet children()}
            <span class="cursor-help hover:scale-110 inline-block transition-transform duration-200">حُبّ</span>
          {/snippet}
        </Tooltip> by <a href="https://sherifelmetwally.com/" target="_blank" class="hover:text-text-100 font-medium transition-colors duration-200">Sherif Elmetwally</a>
      </p>
    </div>
  </div>
</footer>