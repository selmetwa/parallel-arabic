<script lang="ts">
	import { Mode } from '../types';
  import RadioButton from '$lib/components/RadioButton.svelte';
	interface Props {
		key?: string;
		updateMode?: any;
		mode?: Mode;
	}

	let { key = '', updateMode = (event: Event) => {}, mode = Mode.SingleText }: Props = $props();
  
	const modeOptions = [
		{ value: Mode.SingleText, text: 'Single Text' },
		{ value: Mode.BiText, text: 'Bi Text' },
		{ value: Mode.SentanceView, text: 'Sentence View' }
	];
</script>

<header class="flex w-full sm:items-center flex-col justify-between gap-4 bg-tile-300 p-3 sm:flex-row">
	<figure>
	</figure>
	<fieldset>
		<legend class="sr-only">Select Mode</legend>
		<ul class="flex flex-row gap-1">
			{#each modeOptions as option}
				<li>
          <RadioButton 
            wrapperClass="!p-2 h-min"
            className="text-sm !p-1 h-min font-semibold"
            selectableFor={option.value}
            value={option.value}
            text={option.text}
            isSelected={option.value === mode}
            onClick={updateMode}
          />
				</li>
			{/each}
		</ul>
	</fieldset>
</header>
