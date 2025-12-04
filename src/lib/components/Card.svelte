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
  class="group flex flex-col bg-tile-400 border-2 border-tile-600 rounded-lg p-6 sm:p-8 shadow-lg hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 hover:-translate-y-1 {className}"
>
  <div class="text-4xl mb-4">{icon}</div>
  <h3 class="text-xl sm:text-2xl font-bold text-text-300 mb-2 group-hover:text-text-200 transition-colors">
    {title}
  </h3>
  <p class="text-text-200 text-sm sm:text-base leading-relaxed opacity-90 group-hover:opacity-100">
    {description}
  </p>
</a>
