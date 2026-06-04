<!-- Hallmark · component: card · genre: playful · theme: project (HSL hue-200, theme-aware) -->
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
  class="group flex flex-col bg-tile-400 border border-tile-500 rounded-xl p-6 sm:p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:bg-tile-500 hover:shadow-lg active:scale-[0.98] motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300 {className}"
>
  <div class="text-4xl sm:text-5xl mb-4">{icon}</div>
  <h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-2">
    {title}
  </h3>
  <p class="text-text-200 text-sm sm:text-base leading-relaxed">
    {description}
  </p>
</a>
