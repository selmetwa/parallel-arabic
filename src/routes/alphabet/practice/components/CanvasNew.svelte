<script>
  import { onMount } from 'svelte';
  import Atrament, { MODE_DRAW, MODE_ERASE} from 'atrament';
	export let letter;
  export let weight = 15
  let sketchpad;

  $: if (letter) {
		clearCanvas();
	}

  onMount(() => {
    const canvas = document.querySelector('#sketchpad');
    sketchpad = new Atrament(canvas, {
      width: 700,
      height: 400,
      color: 'var(--text2)',
      weight: weight,
      smoothing: 1.3
    });
  });

  $: mode = 'draw'

  function clearCanvas() {
    if (typeof sketchpad !== 'undefined') {
      sketchpad.clear();
    }
  }

  function toggleEraser() {
    if (typeof sketchpad !== 'undefined') {
      sketchpad.mode = sketchpad.mode === MODE_ERASE;
    }
  }

  function toggleDraw() {
    if (typeof sketchpad !== 'undefined') {
      sketchpad.mode = sketchpad.mode === MODE_DRAW;
    }
  }

  function updateMode(event) {
    if (typeof sketchpad !== 'undefined') {
      if (event.target.value === 'draw') {
        sketchpad.mode = MODE_DRAW;
      } else if (event.target.value === 'erase') {
        sketchpad.mode = MODE_ERASE;
      }
      // sketchpad.mode = event.target.value;
    }
  }

</script>

<section class="mt-4">
  <div class="flex flex-row gap-2">
    <button on:click={clearCanvas} class="text-text-200">Clear</button>
    <fieldset>
      <legend class="sr-only">Select Mode</legend>
      <ul class="flex flex-row gap-1">
          <li>
            <label
              for="draw"
              class="flex w-full flex-row items-center gap-1 p-2 text-base sm:cursor-pointer"
            >
              <input
                checked={mode === 'draw'}
                type="radio"
                name="mode"
                id="draw"
                value="draw"
                on:change={updateMode}
              />
              <span
                class="select-none overflow-hidden text-ellipsis whitespace-nowrap text-base font-normal"
                >Draw</span
              >
            </label>
          </li>
          <li>
            <label
              for="erase"
              class="flex w-full flex-row items-center gap-1 p-2 text-base sm:cursor-pointer"
            >
              <input
                checked={mode === 'erase'}
                type="radio"
                name="mode"
                id="erase"
                value="erase"
                on:change={updateMode}
              />
              <span
                class="select-none overflow-hidden text-ellipsis whitespace-nowrap text-base font-normal"
                >Erase</span
              >
            </label>
          </li>
      </ul>
    </fieldset>
  </div>
  <canvas id="sketchpad" width="700" height="400" class="border-4 border-tile-500 bg-tile-400"></canvas>
</section>
