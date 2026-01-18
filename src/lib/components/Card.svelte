<script lang="ts">
  interface Props {
    href: string;
    icon: string;
    title: string;
    description: string;
    className?: string;
  }

  let { href, icon, title, description, className = '' }: Props = $props();
</script>

<a
  {href}
  class="group relative overflow-hidden flex flex-col bg-gradient-to-br from-tile-400 to-tile-300 border-2 border-tile-600 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl hover:bg-gradient-to-br hover:from-tile-500 hover:to-tile-400 hover:border-tile-500 transition-all duration-300 hover:-translate-y-2 active:scale-95 {className}"
>
  <!-- Animated background pattern on hover -->
  <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
    <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
  </div>

  <div class="text-4xl sm:text-5xl mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative z-10">{icon}</div>
  <h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-2 group-hover:text-text-200 transition-colors relative z-10">
    {title}
  </h3>
  <p class="text-text-200 text-sm sm:text-base leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity relative z-10">
    {description}
  </p>
</a>
