<script lang="ts">
  interface Props {
    title: string;
    className?: string;
  }

  let { title, className = '' }: Props = $props();
</script>

<div class="flex items-center gap-4 mb-6 {className}">
  <h2 class="text-2xl sm:text-3xl text-text-300 font-bold">{title}</h2>
  <div class="h-0.5 bg-tile-500 flex-1 opacity-50 rounded-full"></div>
</div>
