<script lang="ts">
  import cn from "classnames";

  export let text: string
  export let value: string
  export let isSelected: Boolean
  export let onClick: (e: any) => void
  export let selectableFor: string
</script>

<label
  for={selectableFor}
  aria-labelledby={selectableFor}
  class={cn(
    "border-2 border-tile-500 flex gap-4 flex-row items-center border w-full p-4 text-base rounded-lg sm:cursor-pointer relative bg-tile-300 hover:bg-tile-500 transition-all duration-300",
    { "!bg-tile-600 !border-tile-600": isSelected }
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
  <span class="overflow-hidden text-text-300 text-ellipsis text-3xl font-normal whitespace-nowrap select-none">{text}</span>
</label>
