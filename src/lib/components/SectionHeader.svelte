<script lang="ts">
  interface Props {
    title: string;
    className?: string;
  }

  let { title, className = '' }: Props = $props();
</script>

<div class="flex items-center gap-4 mb-6 {className}">
  <h2 class="text-2xl sm:text-3xl text-text-300 font-bold tracking-tight">{title}</h2>
  <div class="h-1 bg-gradient-to-r from-tile-500 to-transparent flex-1 rounded-full shadow-sm"></div>
</div>
