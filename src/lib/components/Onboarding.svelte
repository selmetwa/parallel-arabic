<script lang="ts">
  import { fade, fly, scale } from 'svelte/transition';
  import { cubicOut, backOut } from 'svelte/easing';
  import { currentDialect } from '$lib/store/store';
  import { goto } from '$app/navigation';

  type Props = {
    isOpen: boolean;
    handleCloseModal: () => void;
  }

  let { isOpen = false, handleCloseModal = () => {} }: Props = $props();

  let step = $state(0);
  let targetDialect = $state('');
  let learningReason = $state('');
  let proficiencyLevel = $state('');
  let isSubmitting = $state(false);
  let error = $state('');

  // Display preferences
  let showArabic = $state(true);
  let showTransliteration = $state(true);
  let showEnglish = $state(true);

  const totalSteps = 5;

  const dialects = [
    { id: 'egyptian-arabic', label: 'Egyptian', emoji: '🇪🇬', description: 'Most widely understood dialect' },
    { id: 'levantine', label: 'Levantine', emoji: '🇱🇧', description: 'Syria, Lebanon, Palestine, Jordan' },
    { id: 'fusha', label: 'MSA (Fusha)', emoji: '📚', description: 'Formal Arabic for media & literature' },
    { id: 'darija', label: 'Moroccan', emoji: '🇲🇦', description: 'Unique North African dialect' }
  ];

  const learningReasons = [
    { id: 'Travel', label: 'Travel', emoji: '✈️' },
    { id: 'Work', label: 'Work', emoji: '💼' },
    { id: 'Heritage', label: 'Heritage', emoji: '🌍' },
    { id: 'Academic', label: 'Academic', emoji: '🎓' },
    { id: 'Personal Interest', label: 'Interest', emoji: '❤️' },
    { id: 'Other', label: 'Other', emoji: '✨' }
  ];

  const proficiencyLevels = [
    { id: 'A1', label: 'Complete Beginner', tag: 'A1', description: 'Just starting out' },
    { id: 'A2', label: 'Elementary', tag: 'A2', description: 'Know basic phrases' },
    { id: 'B1', label: 'Intermediate', tag: 'B1', description: 'Can hold conversations' },
    { id: 'B2', label: 'Upper Intermediate', tag: 'B2', description: 'Comfortable with most topics' },
    { id: 'C1', label: 'Advanced', tag: 'C1', description: 'Fluent in complex situations' },
    { id: 'C2', label: 'Proficient', tag: 'C2', description: 'Near-native level' }
  ];

  const stepInfo = [
    { title: 'Welcome', subtitle: '' },
    { title: 'Dialect', subtitle: 'Choose your focus' },
    { title: 'Goals', subtitle: 'Why are you learning?' },
    { title: 'Level', subtitle: 'Where are you now?' },
    { title: 'Display', subtitle: 'Customize your view' },
    { title: 'Start', subtitle: "You're all set!" }
  ];

  function nextStep() {
    if (step === 0) {
      step += 1;
      return;
    }
    if (step === 1 && !targetDialect) return;
    if (step === 2 && !learningReason) return;
    if (step === 3 && !proficiencyLevel) return;
    step += 1;
  }

  function prevStep() {
    if (step > 0) step -= 1;
  }

  function selectDialect(id: string) {
    targetDialect = id;
    currentDialect.set(id);
    setTimeout(() => nextStep(), 400);
  }

  function selectReason(id: string) {
    learningReason = id;
    setTimeout(() => nextStep(), 400);
  }

  function selectLevel(id: string) {
    proficiencyLevel = id;
    setTimeout(() => nextStep(), 400);
  }

  async function handleSubmit() {
    if (!targetDialect || !learningReason || !proficiencyLevel) {
      error = 'Please complete all steps';
      return;
    }

    if (isSubmitting) return;

    isSubmitting = true;
    error = '';

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_dialect: targetDialect,
          learning_reason: learningReason,
          proficiency_level: proficiencyLevel,
          show_arabic: showArabic,
          show_transliteration: showTransliteration,
          show_english: showEnglish
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save onboarding data');
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Something went wrong';
      isSubmitting = false;
      return;
    }

    isSubmitting = false;
    step = 5;
  }

  function getStaggerDelay(index: number) {
    return index * 80;
  }

  async function navigateToFeature(url: string) {
    handleCloseModal();
    await goto(url, { replaceState: true });
  }
</script>

<style>
  /* Layered atmospheric background: petrol-tinted glow + Islamic star tessellation + vignette */
  .onboarding-bg {
    background:
      radial-gradient(120% 90% at 50% -10%, hsl(var(--brand-hue) 40% 55% / 0.18), transparent 55%),
      radial-gradient(90% 70% at 100% 100%, hsl(var(--brand-hue) 30% 40% / 0.12), transparent 50%),
      linear-gradient(160deg, var(--tile3) 0%, var(--tile4) 55%, var(--tile3) 100%);
  }

  /* Soft inner vignette to focus the eye toward center */
  .onboarding-bg::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(120% 100% at 50% 35%, transparent 55%, hsl(var(--brand-hue) 30% 12% / 0.22) 100%);
  }

  .geometric-pattern {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cg fill='none' stroke='currentColor' stroke-width='0.5'%3E%3Cpolygon points='24,4 29,19 44,19 32,29 37,44 24,34 11,44 16,29 4,19 19,19' /%3E%3C/g%3E%3C/svg%3E");
    background-size: 48px 48px;
  }

  .eyebrow {
    letter-spacing: 0.32em;
  }

  .card-hover {
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease;
  }

  .card-hover:hover {
    transform: translateY(-5px);
  }

  .selected-card {
    transform: translateY(-5px) scale(1.015);
  }

  .progress-step {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .toggle-switch {
    transition: background-color 0.3s ease;
  }

  .toggle-knob {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Slow drift for the current-step ring */
  @keyframes ring-pulse {
    0%, 100% { box-shadow: 0 0 0 0 hsl(var(--brand-hue) 40% 50% / 0.35); }
    50% { box-shadow: 0 0 0 6px hsl(var(--brand-hue) 40% 50% / 0); }
  }
  .ring-pulse { animation: ring-pulse 2.4s ease-in-out infinite; }
</style>

{#if isOpen}
  <div
    class="onboarding-bg fixed inset-0 z-50 overflow-hidden h-dvh"
    transition:fade={{ duration: 300 }}
  >
    <!-- Geometric tessellation -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="geometric-pattern absolute inset-0 text-text-300 opacity-[0.05]"></div>
    </div>

    <!-- Main Container -->
    <div class="relative h-full w-full flex flex-col">
      <!-- Header with Progress -->
      <div class="px-4 sm:px-8 pt-5 sm:pt-7 pb-2">
        <!-- Step Indicators -->
        <div class="flex items-center justify-center gap-2 sm:gap-2.5 mb-3">
          {#each Array(totalSteps) as _, i (i)}
            <button
              class="progress-step flex items-center"
              onclick={() => { if (i < step) step = i; }}
              disabled={i > step}
              aria-label={`Step ${i + 1}`}
            >
              <div
                class="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[11px] sm:text-sm font-semibold transition-all duration-300
                  {i < step
                    ? 'bg-text-300 text-tile-300'
                    : i === step
                      ? 'bg-tile-300/60 text-text-300 ring-2 ring-text-300 ring-pulse'
                      : 'bg-tile-500/60 text-text-200/60'}"
              >
                {#if i < step}
                  <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                {:else}
                  {i + 1}
                {/if}
              </div>
            </button>
            {#if i < totalSteps - 1}
              <div class="w-6 sm:w-10 h-px rounded-full transition-all duration-500 {i < step ? 'bg-text-300' : 'bg-text-300/15'}"></div>
            {/if}
          {/each}
        </div>

        <!-- Current Step Label -->
        <div class="text-center h-4">
          {#if stepInfo[step].subtitle}
            <span class="eyebrow text-[10px] sm:text-xs text-text-200 font-semibold uppercase">
              {String(step).padStart(2, '0')} &nbsp;·&nbsp; {stepInfo[step].subtitle}
            </span>
          {/if}
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex items-center justify-center px-4 sm:px-8 py-4 overflow-hidden">
        <div class="w-full max-w-4xl">

          <!-- Step 0: Welcome -->
          {#if step === 0}
            <div
              class="flex flex-col items-center text-center"
              in:fly={{ y: 30, duration: 500, easing: cubicOut }}
            >
              <span
                class="eyebrow text-[10px] sm:text-xs text-text-200 font-semibold uppercase mb-5 sm:mb-7"
                in:fade={{ duration: 500, delay: 150 }}
              >
                Parallel Arabic
              </span>

              <!-- Bilingual hero lockup: Arabic over a clean Latin line -->
              <h1
                class="font-arabic font-bold text-text-300 text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4"
                dir="rtl"
                lang="ar"
                in:scale={{ start: 0.85, duration: 700, delay: 200, easing: backOut }}
              >
                أهلاً وسهلاً
              </h1>

              <div
                class="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-7"
                in:fly={{ y: 16, duration: 500, delay: 380, easing: cubicOut }}
              >
                <span class="h-px w-8 sm:w-12 bg-text-300/30"></span>
                <span class="text-base sm:text-lg font-semibold text-text-300 tracking-wide">Welcome</span>
                <span class="h-px w-8 sm:w-12 bg-text-300/30"></span>
              </div>

              <p
                class="text-text-200 text-base sm:text-lg leading-relaxed max-w-md mb-8 sm:mb-10"
                in:fly={{ y: 20, duration: 500, delay: 500, easing: cubicOut }}
              >
                Arabic isn't one language — it's Egyptian, Levantine, Moroccan, Modern Standard, and more. Parallel Arabic is built around the variety you actually want to learn. Let's set you up in a few quick steps.
              </p>

              <button
                class="group relative px-9 py-3.5 bg-text-300 text-tile-300 rounded-full font-semibold text-base sm:text-lg
                  hover:-translate-y-0.5 transition-all duration-300 hover:shadow-xl hover:shadow-text-300/20"
                onclick={nextStep}
                in:fly={{ y: 20, duration: 500, delay: 620, easing: cubicOut }}
              >
                <span class="flex items-center gap-2">
                  Get Started
                  <svg class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>
          {/if}

          <!-- Step 1: Dialect Selection -->
          {#if step === 1}
            <div in:fly={{ y: 30, duration: 500, easing: cubicOut }}>
              <div class="text-center mb-7">
                <h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-1.5 tracking-tight">Choose Your Dialect</h2>
                <p class="text-text-200 text-sm sm:text-base">Select the Arabic dialect you want to master</p>
                <p class="text-text-200/70 text-xs sm:text-sm mt-1">This shapes all your lessons, stories, and vocabulary.</p>
              </div>

              <div class="grid grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
                {#each dialects as dialect, i (dialect.id)}
                  <button
                    class="card-hover group p-4 sm:p-5 rounded-2xl border text-left backdrop-blur-sm
                      {targetDialect === dialect.id
                        ? 'selected-card bg-text-300/[0.07] border-text-300 shadow-xl shadow-text-300/10'
                        : 'bg-tile-300/40 border-text-300/10 hover:border-text-300/40 hover:bg-tile-300/70'}"
                    onclick={() => selectDialect(dialect.id)}
                    in:fly={{ y: 30, duration: 400, delay: getStaggerDelay(i), easing: cubicOut }}
                  >
                    <div class="flex items-start gap-3">
                      <span class="text-3xl sm:text-4xl transition-transform duration-300 group-hover:scale-110">{dialect.emoji}</span>
                      <div class="flex-1 min-w-0">
                        <span class="font-bold text-base sm:text-lg text-text-300 block">{dialect.label}</span>
                        <span class="text-xs sm:text-sm text-text-200 line-clamp-2">{dialect.description}</span>
                      </div>
                      {#if targetDialect === dialect.id}
                        <div class="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-text-300 flex items-center justify-center flex-shrink-0" in:scale={{ duration: 250, easing: backOut }}>
                          <svg class="w-3 h-3 sm:w-4 sm:h-4 text-tile-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      {/if}
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Step 2: Learning Reason -->
          {#if step === 2}
            <div in:fly={{ y: 30, duration: 500, easing: cubicOut }}>
              <div class="text-center mb-7">
                <h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-1.5 tracking-tight">What's Your Goal?</h2>
                <p class="text-text-200 text-sm sm:text-base">This helps us personalize your experience</p>
              </div>

              <div class="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-xl mx-auto">
                {#each learningReasons as reason, i (reason.id)}
                  <button
                    class="card-hover group relative p-3 sm:p-5 rounded-2xl border flex flex-col items-center gap-2 backdrop-blur-sm
                      {learningReason === reason.id
                        ? 'selected-card bg-text-300/[0.07] border-text-300 shadow-xl shadow-text-300/10'
                        : 'bg-tile-300/40 border-text-300/10 hover:border-text-300/40 hover:bg-tile-300/70'}"
                    onclick={() => selectReason(reason.id)}
                    in:fly={{ y: 30, duration: 400, delay: getStaggerDelay(i), easing: cubicOut }}
                  >
                    <span class="text-2xl sm:text-3xl transition-transform duration-300 group-hover:scale-110">{reason.emoji}</span>
                    <span class="font-semibold text-xs sm:text-sm text-text-300">{reason.label}</span>
                    {#if learningReason === reason.id}
                      <div class="absolute top-2 right-2 w-4 h-4 rounded-full bg-text-300 flex items-center justify-center" in:scale={{ duration: 250, easing: backOut }}>
                        <svg class="w-2.5 h-2.5 text-tile-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    {/if}
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Step 3: Proficiency Level -->
          {#if step === 3}
            <div in:fly={{ y: 30, duration: 500, easing: cubicOut }}>
              <div class="text-center mb-7">
                <h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-1.5 tracking-tight">Your Current Level</h2>
                <p class="text-text-200 text-sm sm:text-base">Be honest — we'll meet you where you are</p>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 max-w-2xl mx-auto">
                {#each proficiencyLevels as level, i (level.id)}
                  <button
                    class="card-hover group p-3 sm:p-4 rounded-2xl border text-left relative overflow-hidden backdrop-blur-sm
                      {proficiencyLevel === level.id
                        ? 'selected-card bg-text-300/[0.07] border-text-300 shadow-xl shadow-text-300/10'
                        : 'bg-tile-300/40 border-text-300/10 hover:border-text-300/40 hover:bg-tile-300/70'}"
                    onclick={() => selectLevel(level.id)}
                    in:fly={{ y: 30, duration: 400, delay: getStaggerDelay(i), easing: cubicOut }}
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <span class="inline-block px-2 py-0.5 rounded-md text-xs font-bold mb-1.5 tracking-wide
                          {proficiencyLevel === level.id ? 'bg-text-300 text-tile-300' : 'bg-text-300/10 text-text-200'}">
                          {level.tag}
                        </span>
                        <span class="font-semibold text-sm sm:text-base text-text-300 block">{level.label}</span>
                        <span class="text-xs text-text-200">{level.description}</span>
                      </div>
                      {#if proficiencyLevel === level.id}
                        <div class="w-5 h-5 rounded-full bg-text-300 flex items-center justify-center flex-shrink-0" in:scale={{ duration: 250, easing: backOut }}>
                          <svg class="w-3 h-3 text-tile-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      {/if}
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Step 4: Display Preferences -->
          {#if step === 4}
            <div in:fly={{ y: 30, duration: 500, easing: cubicOut }}>
              <div class="text-center mb-6">
                <h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-1.5 tracking-tight">Display Settings</h2>
                <p class="text-text-200 text-sm sm:text-base">Choose what you see while learning</p>
              </div>

              <!-- Live Preview -->
              <div
                class="relative max-w-md mx-auto mb-6 p-5 sm:p-6 rounded-2xl bg-tile-300/60 border border-text-300/10 backdrop-blur-sm overflow-hidden"
                in:fly={{ y: 20, duration: 400, delay: 100, easing: cubicOut }}
              >
                <span class="eyebrow absolute top-3 left-4 text-[9px] font-semibold uppercase text-text-200/60">Preview</span>
                <div class="text-center space-y-2 pt-3">
                  {#if showEnglish}
                    <p class="text-lg sm:text-xl text-text-300 font-semibold" in:fade={{ duration: 200 }}>
                      Hello, how are you?
                    </p>
                  {/if}
                  {#if showTransliteration}
                    <p class="text-sm sm:text-base text-text-200 italic" in:fade={{ duration: 200 }}>
                      ahlan, izzayak?
                    </p>
                  {/if}
                  {#if showArabic}
                    <p class="font-arabic font-semibold text-lg sm:text-xl text-text-300 pt-1" dir="rtl" lang="ar" in:fade={{ duration: 200 }}>
                      أهلاً، إزيك؟
                    </p>
                  {/if}
                  {#if !showEnglish && !showTransliteration && !showArabic}
                    <p class="text-sm text-text-200/60 italic py-4">Select at least one option</p>
                  {/if}
                </div>
              </div>

              <!-- Toggle Cards -->
              <div class="flex flex-col gap-2.5 max-w-md mx-auto">
                {#each [
                  { key: 'arabic', label: 'Arabic Script', desc: 'Show Arabic text', icon: '🔤', get: () => showArabic, set: (v: boolean) => showArabic = v },
                  { key: 'translit', label: 'Transliteration', desc: 'Latin letter pronunciation', icon: '📝', get: () => showTransliteration, set: (v: boolean) => showTransliteration = v },
                  { key: 'english', label: 'English', desc: 'Show translations', icon: '🇬🇧', get: () => showEnglish, set: (v: boolean) => showEnglish = v }
                ] as opt, i (opt.key)}
                  <button
                    class="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 backdrop-blur-sm
                      {opt.get()
                        ? 'bg-text-300/[0.07] border-text-300/40'
                        : 'bg-tile-300/40 border-text-300/10 hover:border-text-300/25'}"
                    onclick={() => opt.set(!opt.get())}
                    in:fly={{ y: 20, duration: 400, delay: 200 + getStaggerDelay(i), easing: cubicOut }}
                  >
                    <span class="text-2xl">{opt.icon}</span>
                    <div class="flex-1 text-left">
                      <span class="font-semibold text-sm sm:text-base text-text-300 block">{opt.label}</span>
                      <span class="text-xs text-text-200">{opt.desc}</span>
                    </div>
                    <div class="toggle-switch w-12 h-7 rounded-full p-1 {opt.get() ? 'bg-green-500' : 'bg-tile-600'}">
                      <div class="toggle-knob w-5 h-5 rounded-full bg-white shadow-md {opt.get() ? 'translate-x-5' : 'translate-x-0'}"></div>
                    </div>
                  </button>
                {/each}
              </div>

              <!-- Submit Button -->
              <div class="mt-7 flex justify-center" in:fly={{ y: 20, duration: 400, delay: 500, easing: cubicOut }}>
                {#if isSubmitting}
                  <div class="flex items-center gap-3 text-text-300 px-8 py-3.5">
                    <div class="w-5 h-5 border-2 border-text-300 border-t-transparent rounded-full animate-spin"></div>
                    <span class="font-medium">Setting up your experience...</span>
                  </div>
                {:else}
                  <button
                    class="group px-9 py-3.5 bg-text-300 text-tile-300 rounded-full font-semibold text-base
                      hover:-translate-y-0.5 transition-all duration-300 hover:shadow-xl hover:shadow-text-300/20
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    onclick={handleSubmit}
                    disabled={!showArabic && !showTransliteration && !showEnglish}
                  >
                    <span class="flex items-center gap-2">
                      Start Learning
                      <svg class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Step 5: Feature Showcase -->
          {#if step === 5}
            <div in:fly={{ y: 30, duration: 500, easing: cubicOut }}>
              <div class="text-center mb-6">
                <p class="font-arabic font-bold text-2xl sm:text-3xl text-text-300/80 mb-2" dir="rtl" lang="ar">يلّا نبدأ</p>
                <h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-1.5 tracking-tight">You're all set!</h2>
                <p class="text-text-200 text-sm sm:text-base">Pick where you'd like to start. You can always come back to any of these.</p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 max-w-2xl mx-auto">
                {#each [
                  {
                    icon: '✍️',
                    title: 'Alphabet',
                    description: 'Learn to read Arabic script from scratch',
                    url: '/alphabet/learn',
                    badge: proficiencyLevel === 'A1' || proficiencyLevel === 'A2' ? 'New to Arabic script?' : null
                  },
                  {
                    icon: '📚',
                    title: 'Lessons',
                    description: 'Structured lessons in your dialect',
                    url: `/lessons/structured/${targetDialect}`,
                    badge: 'Recommended'
                  },
                  {
                    icon: '📖',
                    title: 'Stories',
                    description: 'Read short stories, click any word',
                    url: '/stories',
                    badge: null
                  },
                  {
                    icon: '📝',
                    title: 'Sentences',
                    description: 'Practice writing & matching sentences',
                    url: '/sentences',
                    badge: null
                  },
                  {
                    icon: '🎮',
                    title: 'Game',
                    description: 'Reinforce vocabulary with quick games',
                    url: '/learn/game',
                    badge: null
                  },
                  {
                    icon: '🤖',
                    title: 'Tutor',
                    description: 'Chat with an AI tutor in Arabic',
                    url: '/tutor',
                    badge: null
                  }
                ] as feature, i (feature.url)}
                  <button
                    class="card-hover group p-3.5 sm:p-5 rounded-2xl border text-left bg-tile-300/40 border-text-300/10 hover:border-text-300/40 hover:bg-tile-300/70 relative backdrop-blur-sm"
                    onclick={() => navigateToFeature(feature.url)}
                    in:fly={{ y: 30, duration: 400, delay: getStaggerDelay(i), easing: cubicOut }}
                  >
                    {#if feature.badge}
                      <span class="absolute top-2.5 right-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-text-300 text-tile-300">
                        {feature.badge}
                      </span>
                    {/if}
                    <div class="flex items-start gap-3 pt-2">
                      <span class="text-2xl sm:text-3xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110">{feature.icon}</span>
                      <div class="flex-1 min-w-0 {feature.badge ? 'pr-12' : ''}">
                        <span class="font-bold text-sm sm:text-base text-text-300 block">{feature.title}</span>
                        <span class="text-xs text-text-200 leading-tight">{feature.description}</span>
                      </div>
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Error Message -->
          {#if error}
            <div
              class="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-center max-w-md mx-auto"
              in:fly={{ y: 10, duration: 300 }}
            >
              {error}
            </div>
          {/if}
        </div>
      </div>

      <!-- Footer Navigation -->
      {#if step > 0 && step < 4}
        <div class="px-4 sm:px-8 pb-5 sm:pb-7">
          <div class="flex justify-between items-center max-w-2xl mx-auto">
            <button
              class="group flex items-center gap-2 px-4 py-2 text-text-200 hover:text-text-300 transition-colors duration-200 rounded-full hover:bg-text-300/5"
              onclick={prevStep}
            >
              <svg class="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              <span class="text-sm font-medium">Back</span>
            </button>

            <button
              class="group flex items-center gap-2 px-5 py-2 text-text-200 hover:text-text-300 rounded-full hover:bg-text-300/5 transition-colors duration-200"
              onclick={nextStep}
            >
              <span class="text-sm font-medium">Skip</span>
              <svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      {:else if step === 4}
        <div class="px-4 sm:px-8 pb-5 sm:pb-7">
          <div class="flex justify-start max-w-2xl mx-auto">
            <button
              class="group flex items-center gap-2 px-4 py-2 text-text-200 hover:text-text-300 transition-colors duration-200 rounded-full hover:bg-text-300/5"
              onclick={prevStep}
            >
              <svg class="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              <span class="text-sm font-medium">Back</span>
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
