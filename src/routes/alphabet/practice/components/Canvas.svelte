<script>
  import { writable } from 'svelte/store';
  import { getStroke } from 'perfect-freehand';

  export let letter;
  export let size; 

  $: if (letter) {
    clear()
  }
  
  const points = writable([[]]);

  export function getSvgPathFromStroke(stroke) {
    if (!stroke.length) return "";

    const d = stroke.reduce(
      (acc, [x0, y0], i, arr) => {
        const [x1, y1] = arr[(i + 1) % arr.length];
        acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
        return acc;
      },
      ["M", ...stroke[0], "Q"]
    );

    d.push("Z");
    return d.join(" ");
  }

  function handlePointerDown(e) {
    e.target.setPointerCapture(e.pointerId);
    const rect = e.target.getBoundingClientRect();
    points.update(points => {
      points.push([[e.clientX - rect.left, e.clientY - rect.top, e.pressure]]);
      return points;
    });
  }

  function handlePointerMove(e) {
    if (e.buttons !== 1) return;
    const rect = e.target.getBoundingClientRect();
    points.update(points => {
      points[points.length - 1].push([e.clientX - rect.left, e.clientY - rect.top, e.pressure]);
      return points;
    });
  }

  let pathData = [];

  $: {
    pathData = $points.map(strokePoints => {
      const stroke = getStroke(strokePoints, {
        size: size,
        thinning: 0.5,
        smoothing: 0.2,
        streamline: 0.2,
        simulatePressure: true,
        start: {
          taper: 0,
          easing: (t) => 1 - Math.cos((t * Math.PI) / 2),
        },
        end: {
          taper: 0,
          easing: (t) => 1 - Math.cos((t * Math.PI) / 2),
        },
      });
      return getSvgPathFromStroke(stroke);
    });
  }

  function clear() {
    points.set([[]]);
  }
</script>

<div class="wrapper">
  <button on:click={clear} class="text-text-200 underline">Clear</button>
  <svg on:pointerdown={handlePointerDown} on:pointermove={handlePointerMove} style="touch-action: none;">
    {#each pathData as path, i (i)}
      <path d={path} />
    {/each}
  </svg>
</div>

<style>
  .wrapper {
    user-select: none;
  }

svg {
  width: 100%;
  height: 500px;
  border: 5px solid var(--tile5);
  fill: var(--text3);
  background-color: var(--tile4);
  touch-action: none;
}
</style>