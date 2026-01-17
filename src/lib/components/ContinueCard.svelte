<script lang="ts">
  interface Props {
    href: string;
    icon: string;
    title: string;
    subtitle: string;
    variant?: 'blue' | 'green' | 'purple' | 'amber' | 'rose';
    compact?: boolean;
  }

  let { href, icon, title, subtitle, variant = 'blue', compact = false }: Props = $props();

  const variantClasses: Record<string, string> = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-700',
    green: 'bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-700',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-700',
    amber: 'bg-gradient-to-r from-amber-500 to-amber-600 border-amber-700',
    rose: 'bg-gradient-to-r from-rose-500 to-rose-600 border-rose-700'
  };

  const textColorClasses: Record<string, string> = {
    blue: 'text-blue-100',
    green: 'text-emerald-100',
    purple: 'text-purple-100',
    amber: 'text-amber-100',
    rose: 'text-rose-100'
  };
</script>

<a
  {href}
  class="block {variantClasses[variant]} border-2 rounded-xl {compact ? 'p-3 sm:p-4' : 'p-4 sm:p-6'} shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
>
  <div class="flex items-center gap-3 sm:gap-4">
    <div class="{compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'} group-hover:scale-110 transition-transform">{icon}</div>
    <div class="flex-1 text-left">
      <h2 class="{compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'} font-bold text-white mb-0.5 group-hover:text-opacity-90 transition-colors">
        {title}
      </h2>
      <p class="{textColorClasses[variant]} {compact ? 'text-xs' : 'text-xs sm:text-sm'}">
        {subtitle}
      </p>
    </div>
    <div class="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all">
      <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </div>
</a>
