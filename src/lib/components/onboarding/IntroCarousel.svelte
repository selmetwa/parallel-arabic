<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { onMount } from 'svelte';

  type Props = {
    onDone: () => void;
  };

  let { onDone }: Props = $props();

  type Segment = { text: string; accent?: boolean };

  const slides: { headline: string; body: Segment[]; glyph: string }[] = [
    {
      headline: "Arabic isn't one language",
      body: [
        { text: 'Learn ' },
        { text: 'Egyptian', accent: true },
        { text: ', ' },
        { text: 'Levantine', accent: true },
        { text: ', ' },
        { text: 'Moroccan', accent: true },
        { text: ' or ' },
        { text: 'Fusha', accent: true },
        { text: ' — not a blend of all four.' }
      ],
      glyph: 'ع'
    },
    {
      headline: 'All it takes is one conversation a day',
      body: [
        { text: 'Practice ' },
        { text: 'speaking', accent: true },
        { text: ' or ' },
        { text: 'writing', accent: true },
        { text: ' with the AI Tutor, and get corrected as you go.' }
      ],
      glyph: 'ك'
    },
    {
      headline: 'Nothing you learn slips away',
      body: [
        { text: 'Every story and lesson feeds your ' },
        { text: 'review deck', accent: true },
        { text: ', so the words come back before you forget them.' }
      ],
      glyph: 'ذ'
    }
  ];

  const SWIPE_THRESHOLD = 40;

  let index = $state(0);
  let hasHover = $state(false);
  let startX = 0;
  let swiped = false;

  onMount(() => {
    hasHover = window.matchMedia('(hover: hover)').matches;
  });

  function next() {
    if (index === slides.length - 1) {
      onDone();
      return;
    }
    index += 1;
  }

  function prev() {
    if (index > 0) index -= 1;
  }

  function handlePointerDown(event: PointerEvent) {
    startX = event.clientX;
    swiped = false;
  }

  function handlePointerUp(event: PointerEvent) {
    const dx = event.clientX - startX;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    swiped = true;
    if (dx < 0) next();
    else prev();
  }

  function handleClick() {
    // A swipe ends in a click too — don't advance twice.
    if (swiped) {
      swiped = false;
      return;
    }
    next();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prev();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<style>
  .glyph {
    font-family: 'Rakkas', serif;
    line-height: 1;
    color: var(--text1);
    opacity: 0.07;
    user-select: none;
  }

  .accent {
    color: var(--brand);
    font-weight: 700;
  }

  .headline {
    text-wrap: balance;
    letter-spacing: -0.02em;
  }

  @media (prefers-reduced-motion: reduce) {
    .glyph {
      transition: none;
    }
  }
</style>

<div class="relative flex flex-col items-center w-full min-h-[60vh] sm:min-h-[55vh]">
  <div class="relative flex-1 w-full flex items-center justify-center">
    <!-- Tap/swipe surface. Sits under the dots so they stay clickable. -->
    <button
      type="button"
      class="absolute inset-0 z-10 cursor-pointer"
      aria-label="Next"
      onpointerdown={handlePointerDown}
      onpointerup={handlePointerUp}
      onclick={handleClick}
    ></button>

    {#key index}
      <div
        class="relative w-full max-w-xl px-2 text-center"
        in:fly={{ x: 40, duration: 400, easing: cubicOut }}
      >
        <div
          class="glyph absolute inset-0 flex items-center justify-center text-[14rem] sm:text-[18rem] pointer-events-none"
          dir="rtl"
          aria-hidden="true"
        >
          {slides[index].glyph}
        </div>

        <h2 class="headline relative text-3xl sm:text-4xl lg:text-5xl font-bold text-text-300 mb-4">
          {slides[index].headline}
        </h2>

        <p class="relative text-base sm:text-lg text-text-200 leading-relaxed">
          {#each slides[index].body as segment, i (i)}<span class={segment.accent ? 'accent' : ''}
              >{segment.text}</span
            >{/each}
        </p>
      </div>
    {/key}
  </div>

  <div class="relative z-20 flex flex-col items-center gap-3 pt-8">
    <div class="flex items-center gap-2">
      {#each slides as slide, i (slide.headline)}
        <button
          type="button"
          class="h-2 rounded-full transition-all duration-300 {i === index
            ? 'w-6 bg-text-300'
            : 'w-2 bg-text-300/25 hover:bg-text-300/50'}"
          aria-label={`Go to slide ${i + 1}`}
          aria-current={i === index}
          onclick={() => (index = i)}
        ></button>
      {/each}
    </div>

    <span class="text-sm text-text-200" in:fade={{ duration: 400, delay: 200 }}>
      {hasHover ? 'Click to continue' : 'Swipe to continue'}
    </span>
  </div>
</div>
