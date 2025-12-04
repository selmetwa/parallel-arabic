<script lang="ts">
  interface Props {
    href: string;
    icon: string;
    title: string;
    subtitle: string;
    variant?: 'blue' | 'green' | 'purple';
  }

  let { href, icon, title, subtitle, variant = 'blue' }: Props = $props();

  const variantClasses = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-700',
    green: 'bg-gradient-to-r from-green-500 to-green-600 border-green-700',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-700'
  };

  const textColorClasses = {
    blue: 'text-blue-100',
    green: 'text-green-100',
    purple: 'text-purple-100'
  };
</script>

<a
  {href}
  class="block {variantClasses[variant]} border-2 rounded-lg p-4 sm:p-6 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-center group"
>
  <div class="text-3xl sm:text-4xl mb-2">{icon}</div>
  <h2 class="text-lg sm:text-xl font-bold text-white mb-1 group-hover:text-opacity-90 transition-colors">
    {title}
  </h2>
  <p class="{textColorClasses[variant]} text-xs sm:text-sm">
    {subtitle}
  </p>
</a>
