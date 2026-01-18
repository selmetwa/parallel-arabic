<script lang="ts">
  import cn from "classnames";
  type Props = {
    className?: string;
    type: "button" | "submit";
    onClick?: (() => void) | undefined;
    children?: import('svelte').Snippet;
    disabled?: boolean;
    variant?: "primary" | "secondary" | "success" | "danger";
  }

  let {
    className = "",
    type,
    onClick = undefined,
    children,
    disabled = false,
    variant = "primary"
  }: Props = $props();

  const variantClasses = {
    primary: `border-2 border-tile-600 bg-gradient-to-r from-tile-500 to-tile-600
      hover:from-tile-600 hover:to-tile-700 text-text-300`,
    secondary: `border-2 border-tile-500 bg-tile-400 hover:bg-tile-500 text-text-300`,
    success: `border-2 border-green-600 bg-gradient-to-r from-green-500 to-green-600
      hover:from-green-600 hover:to-green-700 text-white`,
    danger: `border-2 border-red-600 bg-gradient-to-r from-red-500 to-red-600
      hover:from-red-600 hover:to-red-700 text-white`,
  };
  </script>

  <button
    class={cn(
      `py-2 px-4 font-semibold rounded-xl
      shadow-md hover:shadow-lg
      active:scale-95
      transition-all duration-200
      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md
      whitespace-nowrap`,
      variantClasses[variant],
      className
    )}
    type={type}
    onclick={onClick}
    disabled={disabled}
  >
  <slot></slot>
    <!-- {@render children?.()} -->
</button>

