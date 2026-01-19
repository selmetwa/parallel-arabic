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
    { title: 'Display', subtitle: 'Customize your view' }
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
        await goto(`/lessons/structured/${targetDialect}`, { replaceState: true });
        throw new Error(data.error || 'Failed to save onboarding data');
      }

      await goto(`/lessons/structured/${targetDialect}`, { replaceState: true });
    } catch (e) {
      error = e instanceof Error ? e.message : 'Something went wrong';
      isSubmitting = false;
    } finally {
      isSubmitting = false;
      await goto(`/lessons/structured/${targetDialect}`, { replaceState: true });
      handleCloseModal();
    }
  }

  function getStaggerDelay(index: number) {
    return index * 80;
  }
</script>

<style>
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(2deg); }
  }

  @keyframes pulse-soft {
    0%, 100% { opacity: 0.03; }
    50% { opacity: 0.08; }
  }

  .float-animation {
    animation: float 6s ease-in-out infinite;
  }

  .pulse-bg {
    animation: pulse-soft 4s ease-in-out infinite;
  }

  .card-hover {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .card-hover:hover {
    transform: translateY(-4px);
  }

  .selected-card {
    transform: translateY(-4px) scale(1.02);
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
</style>

{#if isOpen}
  <div
    class="fixed inset-0 z-50 bg-gradient-to-br from-tile-300 via-tile-400 to-tile-300 overflow-hidden h-dvh"
    transition:fade={{ duration: 300 }}
  >
    <!-- Animated Background Pattern -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-10 left-10 w-64 h-64 bg-text-300/5 rounded-full blur-3xl pulse-bg"></div>
      <div class="absolute bottom-20 right-20 w-96 h-96 bg-text-300/5 rounded-full blur-3xl pulse-bg" style="animation-delay: 2s;"></div>
      <div class="absolute top-1/2 left-1/4 w-48 h-48 bg-text-300/3 rounded-full blur-2xl pulse-bg" style="animation-delay: 1s;"></div>

      <!-- Floating Arabic Letters -->
      <div class="absolute top-20 right-[15%] text-6xl text-text-300/5 float-animation font-arabic" style="animation-delay: 0s;">ع</div>
      <div class="absolute bottom-32 left-[10%] text-7xl text-text-300/5 float-animation font-arabic" style="animation-delay: 1.5s;">م</div>
      <div class="absolute top-1/3 right-[8%] text-5xl text-text-300/5 float-animation font-arabic" style="animation-delay: 3s;">ر</div>
      <div class="absolute bottom-1/4 right-[25%] text-6xl text-text-300/5 float-animation font-arabic" style="animation-delay: 2s;">ب</div>
      <div class="absolute top-[60%] left-[5%] text-5xl text-text-300/5 float-animation font-arabic" style="animation-delay: 0.5s;">ي</div>
    </div>

    <!-- Main Container -->
    <div class="relative h-full w-full flex flex-col">
      <!-- Header with Progress -->
      <div class="px-4 sm:px-8 pt-4 sm:pt-6 pb-2">
        <!-- Step Indicators -->
        <div class="flex items-center justify-center gap-2 sm:gap-3 mb-3">
          {#each Array(totalSteps) as _, i}
            <button
              class="progress-step flex items-center gap-1.5"
              onclick={() => { if (i < step) step = i; }}
              disabled={i > step}
            >
              <div
                class="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300
                  {i < step ? 'bg-text-300 text-tile-300' : i === step ? 'bg-text-300/20 text-text-300 ring-2 ring-text-300' : 'bg-tile-500 text-text-200'}"
              >
                {#if i < step}
                  <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                {:else}
                  {i + 1}
                {/if}
              </div>
            </button>
            {#if i < totalSteps - 1}
              <div class="w-8 sm:w-12 h-0.5 rounded-full transition-all duration-500 {i < step ? 'bg-text-300' : 'bg-tile-500'}"></div>
            {/if}
          {/each}
        </div>

        <!-- Current Step Label -->
        <div class="text-center">
          <span class="text-xs sm:text-sm text-text-200 font-medium tracking-wide uppercase">
            {stepInfo[step].subtitle}
          </span>
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
              <div
                class="mb-4 sm:mb-6"
                in:scale={{ start: 0.5, duration: 600, delay: 200, easing: backOut }}
              >
                <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-text-300/20 to-text-300/10 flex items-center justify-center">
                  <span class="text-4xl sm:text-5xl">👋</span>
                </div>
              </div>

              <h1
                class="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-300 mb-2 sm:mb-3"
                in:fly={{ y: 20, duration: 500, delay: 300, easing: cubicOut }}
              >
                Welcome!
              </h1>

              <p
                class="text-2xl sm:text-3xl font-bold text-text-300/80 mb-3 sm:mb-4 font-arabic"
                dir="rtl"
                lang="ar"
                in:fly={{ y: 20, duration: 500, delay: 400, easing: cubicOut }}
              >
                أهلاً وسهلاً
              </p>

              <p
                class="text-text-200 text-base sm:text-lg max-w-md mb-6 sm:mb-8"
                in:fly={{ y: 20, duration: 500, delay: 500, easing: cubicOut }}
              >
                Let's personalize your Arabic learning journey in a few quick steps.
              </p>

              <button
                class="group relative px-8 py-3 bg-text-300 text-tile-300 rounded-xl font-semibold text-base sm:text-lg
                  hover:bg-text-200 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-text-300/20"
                onclick={nextStep}
                in:fly={{ y: 20, duration: 500, delay: 600, easing: cubicOut }}
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
              <div class="text-center mb-6">
                <h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-1">Choose Your Dialect</h2>
                <p class="text-text-200 text-sm sm:text-base">Select the Arabic dialect you want to master</p>
              </div>

              <div class="grid grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
                {#each dialects as dialect, i}
                  <button
                    class="card-hover p-4 sm:p-5 rounded-2xl border-2 text-left
                      {targetDialect === dialect.id
                        ? 'selected-card bg-text-300/10 border-text-300 shadow-lg shadow-text-300/10'
                        : 'bg-tile-400/50 border-tile-500 hover:border-text-300/30 hover:bg-tile-400'}"
                    onclick={() => selectDialect(dialect.id)}
                    in:fly={{ y: 30, duration: 400, delay: getStaggerDelay(i), easing: cubicOut }}
                  >
                    <div class="flex items-start gap-3">
                      <span class="text-3xl sm:text-4xl">{dialect.emoji}</span>
                      <div class="flex-1 min-w-0">
                        <span class="font-bold text-base sm:text-lg text-text-300 block">{dialect.label}</span>
                        <span class="text-xs sm:text-sm text-text-200 line-clamp-2">{dialect.description}</span>
                      </div>
                      {#if targetDialect === dialect.id}
                        <div class="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-text-300 flex items-center justify-center flex-shrink-0">
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
              <div class="text-center mb-6">
                <h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-1">What's Your Goal?</h2>
                <p class="text-text-200 text-sm sm:text-base">This helps us personalize your experience</p>
              </div>

              <div class="grid grid-cols-3 gap-2 sm:gap-3 max-w-xl mx-auto">
                {#each learningReasons as reason, i}
                  <button
                    class="card-hover p-3 sm:p-4 rounded-xl border-2 flex flex-col items-center gap-2
                      {learningReason === reason.id
                        ? 'selected-card bg-text-300/10 border-text-300 shadow-lg shadow-text-300/10'
                        : 'bg-tile-400/50 border-tile-500 hover:border-text-300/30 hover:bg-tile-400'}"
                    onclick={() => selectReason(reason.id)}
                    in:fly={{ y: 30, duration: 400, delay: getStaggerDelay(i), easing: cubicOut }}
                  >
                    <span class="text-2xl sm:text-3xl">{reason.emoji}</span>
                    <span class="font-semibold text-xs sm:text-sm text-text-300">{reason.label}</span>
                    {#if learningReason === reason.id}
                      <div class="w-4 h-4 rounded-full bg-text-300 flex items-center justify-center">
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
              <div class="text-center mb-6">
                <h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-1">Your Current Level</h2>
                <p class="text-text-200 text-sm sm:text-base">Be honest — we'll meet you where you are</p>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-w-2xl mx-auto">
                {#each proficiencyLevels as level, i}
                  <button
                    class="card-hover p-3 sm:p-4 rounded-xl border-2 text-left relative overflow-hidden
                      {proficiencyLevel === level.id
                        ? 'selected-card bg-text-300/10 border-text-300 shadow-lg shadow-text-300/10'
                        : 'bg-tile-400/50 border-tile-500 hover:border-text-300/30 hover:bg-tile-400'}"
                    onclick={() => selectLevel(level.id)}
                    in:fly={{ y: 30, duration: 400, delay: getStaggerDelay(i), easing: cubicOut }}
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <span class="inline-block px-2 py-0.5 rounded-md text-xs font-bold mb-1
                          {proficiencyLevel === level.id ? 'bg-text-300 text-tile-300' : 'bg-tile-500 text-text-200'}">
                          {level.tag}
                        </span>
                        <span class="font-semibold text-sm sm:text-base text-text-300 block">{level.label}</span>
                        <span class="text-xs text-text-200">{level.description}</span>
                      </div>
                      {#if proficiencyLevel === level.id}
                        <div class="w-5 h-5 rounded-full bg-text-300 flex items-center justify-center flex-shrink-0">
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
              <div class="text-center mb-5">
                <h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-1">Display Settings</h2>
                <p class="text-text-200 text-sm sm:text-base">Choose what you see while learning</p>
              </div>

              <!-- Live Preview -->
              <div
                class="max-w-md mx-auto mb-5 p-4 sm:p-5 rounded-2xl bg-tile-400/80 border border-tile-500 backdrop-blur-sm"
                in:fly={{ y: 20, duration: 400, delay: 100, easing: cubicOut }}
              >
                <div class="text-center space-y-2">
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
                    <p class="text-lg sm:text-xl text-text-300 font-semibold font-arabic" dir="rtl" in:fade={{ duration: 200 }}>
                      أهلاً، إزيك؟
                    </p>
                  {/if}
                  {#if !showEnglish && !showTransliteration && !showArabic}
                    <p class="text-sm text-text-200/60 italic py-4">Select at least one option</p>
                  {/if}
                </div>
              </div>

              <!-- Toggle Cards -->
              <div class="flex flex-col gap-2 sm:gap-3 max-w-md mx-auto">
                {#each [
                  { key: 'arabic', label: 'Arabic Script', desc: 'Show Arabic text', icon: '🔤', get: () => showArabic, set: (v: boolean) => showArabic = v },
                  { key: 'translit', label: 'Transliteration', desc: 'Latin letter pronunciation', icon: '📝', get: () => showTransliteration, set: (v: boolean) => showTransliteration = v },
                  { key: 'english', label: 'English', desc: 'Show translations', icon: '🇬🇧', get: () => showEnglish, set: (v: boolean) => showEnglish = v }
                ] as opt, i}
                  <button
                    class="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 transition-all duration-300
                      {opt.get()
                        ? 'bg-text-300/10 border-text-300/50'
                        : 'bg-tile-400/50 border-tile-500 hover:border-tile-400'}"
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
              <div class="mt-6 flex justify-center" in:fly={{ y: 20, duration: 400, delay: 500, easing: cubicOut }}>
                {#if isSubmitting}
                  <div class="flex items-center gap-3 text-text-300 px-8 py-3">
                    <div class="w-5 h-5 border-2 border-text-300 border-t-transparent rounded-full animate-spin"></div>
                    <span class="font-medium">Setting up your experience...</span>
                  </div>
                {:else}
                  <button
                    class="group px-8 py-3 bg-text-300 text-tile-300 rounded-xl font-semibold text-base
                      hover:bg-text-200 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-text-300/20
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
        <div class="px-4 sm:px-8 pb-4 sm:pb-6">
          <div class="flex justify-between items-center max-w-2xl mx-auto">
            <button
              class="flex items-center gap-2 px-4 py-2 text-text-200 hover:text-text-300 transition-colors duration-200 rounded-lg hover:bg-tile-500/50"
              onclick={prevStep}
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              <span class="text-sm font-medium">Back</span>
            </button>

            <button
              class="flex items-center gap-2 px-5 py-2 bg-text-300/10 text-text-300 rounded-lg hover:bg-text-300/20 transition-colors duration-200"
              onclick={nextStep}
            >
              <span class="text-sm font-medium">Skip</span>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      {:else if step === 4}
        <div class="px-4 sm:px-8 pb-4 sm:pb-6">
          <div class="flex justify-start max-w-2xl mx-auto">
            <button
              class="flex items-center gap-2 px-4 py-2 text-text-200 hover:text-text-300 transition-colors duration-200 rounded-lg hover:bg-tile-500/50"
              onclick={prevStep}
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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
