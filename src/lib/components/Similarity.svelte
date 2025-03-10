<script>
  let { score } = $props();
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  let offset = $derived(circumference - (score / 100) * circumference);
  let color = $derived(score < 30 ? "#cd533b" : score < 70 ? "#ffce1f" : "#32a287");
</script>

<svg width="70" height="70" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="{radius}" stroke="var(--tile5)" stroke-width="10" fill="none" />

  <circle
    cx="50"
    cy="50"
    r="{radius}"
    stroke="{color}"
    stroke-width="10"
    fill="var(--tile4)"
    stroke-dasharray="{circumference}"
    stroke-dashoffset="{offset}"
    stroke-linecap="round"
    transform="rotate(-90 50 50)"
  />

  <!-- Score Text -->
  <text x="50" y="55" text-anchor="middle" fill="var(--text3)" font-weight="bold" class="text-xl p-0 m-0">
    {Math.round(score).toFixed(0)}%
  </text>
</svg>
