<script lang="ts">
  import cn from "classnames";

  export let text: string
  export let value: string
  export let isSelected: Boolean
  export let onClick: (e: any) => void | undefined
  export let selectableFor: string
  export let className = ''
  export let wrapperClass = ''
</script>

<label
  for={selectableFor}
  aria-labelledby={selectableFor}
  class={cn(
    "border-2 border-tile-500 flex gap-4 flex-row items-center border w-full p-4 text-base sm:cursor-pointer relative bg-tile-300 hover:bg-tile-500 transition-all duration-300",
    { "!bg-tile-600 !border-tile-600": isSelected },
    wrapperClass
  )}
  style={isSelected ? "background-color: var(--tile6); border-color: var(--tile6)" : ""}
>
  <input
    on:click={onClick}
    value={value}
    id={selectableFor}
    checked={!!isSelected}
    type="radio"
    style="appearance: none;"
    class="appearance-none absolute left-full top-full"
  />
  <span class={cn(
    "text-text-300 text-3xl font-normal select-none",
    className,    
    )}>{text}</span>
</label>
