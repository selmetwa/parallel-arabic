<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { currentDialect } from '$lib/store/store';
  import Button from '$lib/components/Button.svelte';
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

  const dialects = [
    { id: 'egyptian-arabic', label: 'Egyptian', emoji: '🇪🇬', description: 'The most widely understood Arabic dialect, spoken by over 100 million people' },
    { id: 'levantine', label: 'Levantine', emoji: '🇱🇧', description: 'Explore the dialect of Syria, Lebanon, Palestine, and Jordan. Known for its melodic sound and cultural richness.' },
    { id: 'fusha', label: 'MSA (Fusha)', emoji: '📚', description: 'Master formal Arabic used in news, literature, and official communications. The foundation of all Arabic dialects.' },
    { id: 'darija', label: 'Moroccan', emoji: '🇲🇦', description: 'Explore the unique dialect of Morocco. Known for its distinctive vocabulary and French/Berber influences.' }
  ];

  const learningReasons = [
    { id: 'Travel', label: 'Travel', emoji: '✈️', description: 'Planning to visit Arabic-speaking countries' },
    { id: 'Work', label: 'Work', emoji: '💼', description: 'Professional or business purposes' },
    { id: 'Heritage', label: 'Heritage', emoji: '🌍', description: 'Connecting with family and culture' },
    { id: 'Academic', label: 'Academic', emoji: '🎓', description: 'Studies or research' },
    { id: 'Personal Interest', label: 'Personal Interest', emoji: '❤️', description: 'General interest and passion' },
    { id: 'Other', label: 'Other', emoji: '✨', description: 'Another reason' }
  ];

  const proficiencyLevels = [
    { id: 'A1', label: 'A1 - Beginner', description: 'Just starting out' },
    { id: 'A2', label: 'A2 - Elementary', description: 'Basic phrases and vocabulary' },
    { id: 'B1', label: 'B1 - Intermediate', description: 'Can handle everyday conversations' },
    { id: 'B2', label: 'B2 - Upper Intermediate', description: 'Comfortable with most topics' },
    { id: 'C1', label: 'C1 - Advanced', description: 'Fluent in complex situations' },
    { id: 'C2', label: 'C2 - Proficient', description: 'Near-native level' }
  ];

  function nextStep() {
    // Step 0 (welcome) can always proceed
    if (step === 0) {
      step += 1;
      return;
    }
    // Other steps need validation
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
    setTimeout(() => nextStep(), 300);
  }

  function selectReason(id: string) {
    learningReason = id;
    setTimeout(() => nextStep(), 300);
  }

  function selectLevel(id: string) {
    proficiencyLevel = id;
    // Don't auto-advance - user must click Complete Setup button
  }

  async function handleSubmit() {
    if (!targetDialect || !learningReason || !proficiencyLevel) {
      error = 'Please complete all steps';
      return;
    }

    isSubmitting = true;
    error = '';

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_dialect: targetDialect,
          learning_reason: learningReason,
          proficiency_level: proficiencyLevel
        })
      });

      const data = await response.json();

      if (!response.ok) {
        await goto(`/lessons/structured/${targetDialect}`, { replaceState: true });
        throw new Error(data.error || 'Failed to save onboarding data');
      }

      // Success - redirect to structured lessons page
      // The redirect will naturally close the modal by navigating away
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
</script>

{#if isOpen}
  <div 
    class="fixed inset-0 z-50 bg-tile-300 overflow-hidden"
    transition:fade={{ duration: 200 }}
  >
    <!-- Decorative Kufic SVG Background Elements -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <!-- Top Left - Larger and more visible -->
      <svg class="absolute top-0 left-0 w-96 h-96 opacity-10" viewBox="0 0 400 400">
        <g transform="scale(0.5) translate(200,200) rotate(45)">
          <path
            class="stroke-text-200"
            style="fill:none;stroke-width:20px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
            d="m 619.20254,525.91121 0,105.91999 -22.04281,0 0,42.36799 -22.42473,5e-4 0,45.51697 44.46754,-5e-4 0,-45.51697 -22.04281,0 0,-42.36799 -22.42473,5e-4 2.3e-4,-105.91999"
          />
          <path
            class="stroke-text-200"
            style="fill:none;stroke-width:20px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
            d="m 530.26791,525.91121 -0.2147,193.80495 -44.25261,0"
          />
          <path
            class="stroke-text-200"
            style="fill:none;stroke-width:20px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
            d="m 485.8006,525.91121 0,193.80495 -91.60648,0 0,-43.79935 47.2346,0 0,43.79935"
          />
          <path
            class="stroke-text-200"
            style="fill:none;stroke-width:20px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
            d="m 351.53986,525.33527 0,206.38139"
          />
        </g>
      </svg>

      <!-- Top Right -->
      <svg class="absolute top-0 right-0 w-96 h-96 opacity-10" viewBox="0 0 400 400">
        <g transform="scale(0.5) translate(-200,200) rotate(-45)">
          <path
            class="stroke-text-200"
            style="fill:none;stroke-width:20px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
            d="m 484.98708,333.82387 -1.6e-4,-104.20269 58.92638,0"
          />
          <path
            class="stroke-text-200"
            style="fill:none;stroke-width:20px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
            d="m 529.045,378.08185 0,-117.94334"
          />
          <path
            class="stroke-text-200"
            style="fill:none;stroke-width:20px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
            d="m 558.51324,229.90778 60.68976,3e-4 0,45.51696"
          />
          <path
            class="stroke-text-200"
            style="fill:none;stroke-width:20px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
            d="m 558.51324,275.42474 60.68976,3e-4 0,88.17124 -45.52132,-3e-4 0,-43.22681 45.52132,3e-4"
          />
        </g>
      </svg>

      <!-- Bottom Left -->
      <svg class="absolute bottom-0 left-0 w-96 h-96 opacity-10" viewBox="0 0 400 400">
        <g transform="scale(0.5) translate(200,-200) rotate(-45)">
          <path
            class="stroke-text-200"
            style="fill:none;stroke-width:20px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
            d="m 216.99284,436.30862 0,194.94834"
          />
          <path
            class="stroke-text-200"
            style="fill:none;stroke-width:20px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
            d="m 218.13793,719.71666 -92.46529,0 4.5e-4,-45.51748"
          />
          <path
            class="stroke-text-200"
            style="fill:none;stroke-width:20px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
            d="m 218.71091,674.19918 -93.03782,0 -4.5e-4,-89.03003 48.88336,0 -3.2e-4,46.08803 -48.88336,0"
          />
          <path
            class="stroke-text-200"
            style="fill:none;stroke-width:20px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
            d="m 125.81561,496.42537 48.74039,4.9e-4 0,45.42857 -48.74039,-4.9e-4 0,-90.51614"
          />
        </g>
      </svg>

      <!-- Bottom Right -->
      <svg class="absolute bottom-0 right-0 w-96 h-96 opacity-10" viewBox="0 0 400 400">
        <g transform="scale(0.5) translate(-200,-200) rotate(45)">
          <path
            class="stroke-text-200"
            style="fill:none;stroke-width:20px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
            d="m 381.36612,540.2304 60.06288,-3e-4 0,91.02675 -43.8,6.6e-4 0,-46.088 43.8,-6.6e-4"
          />
          <path
            class="stroke-text-200"
            style="fill:none;stroke-width:20px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
            d="m 336.02312,496.40233 105.40576,-3e-4 1.2e-4,43.82807"
          />
          <path
            class="stroke-text-200"
            style="fill:none;stroke-width:20px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
            d="m 397.629,393.27094 0,62.34648 43.8,0.8093 0,-63.15618 -1.2e-4,103.13149"
          />
          <path
            class="stroke-text-200"
            style="fill:none;stroke-width:20px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
            d="m 350.967,346.30834 0,107.74984 -42.94,0"
          />
        </g>
      </svg>

      <!-- Center decorative elements -->
      <svg class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-5" viewBox="0 0 400 400">
        <g transform="scale(0.8) translate(250,250) rotate(90)">
          <path
            class="stroke-text-200"
            style="fill:none;stroke-width:25px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
            d="m 216.99284,334.37518 0,-106.126 148.63316,0"
          />
          <path
            class="stroke-text-200"
            style="fill:none;stroke-width:25px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
            d="m 263.36862,334.11014 -0.57229,-61.07096 45.2307,0 -2.5e-4,61.07096 2.5e-4,-61.07096 42.368,0 0.57229,61.07096 -0.57229,-61.07096 93.89664,0 -2.5e-4,50.47896 -46.66205,0 0,-93.89664 58.66205,0"
          />
        </g>
      </svg>
    </div>

    <!-- Main Content Container -->
    <div class="relative h-full w-full flex flex-col">
      <!-- Progress Bar -->
      <div class="h-2 bg-tile-500 w-full">
        <div 
          class="h-full bg-text-300 transition-all duration-500 ease-out"
          style="width: {((step + 1) / 4) * 100}%"
        ></div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-hidden">
        <div class="w-full max-w-5xl overflow-y-auto" style="max-height: calc(100vh - 120px); scrollbar-width: none; -ms-overflow-style: none;">
          <style>
            div::-webkit-scrollbar {
              display: none;
            }
          </style>
          
          <!-- Step 0: Welcome -->
          {#if step === 0}
            <div class="flex flex-col items-center text-center gap-8 py-12" in:fade={{ duration: 300 }}>
              <div class="text-8xl mb-6 animate-bounce">👋</div>
              <h2 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-300 mb-4">Welcome to Parallel Arabic!</h2>
              <p class="text-3xl sm:text-4xl font-bold text-text-300 mb-6" dir="rtl" lang="ar">
                أهلاً وسهلاً
              </p>
              <p class="text-text-200 text-xl sm:text-2xl leading-relaxed max-w-2xl">
                Let's personalize your learning experience. This will only take a minute.
              </p>
            </div>
          {/if}

          <!-- Step 1: Dialect Selection -->
          {#if step === 1}
            <div class="flex flex-col gap-8" in:fade={{ duration: 300 }}>
              <div class="text-center mb-6">
                <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-300 mb-4">Choose Your Target Dialect</h2>
                <p class="text-text-200 text-xl sm:text-2xl">Which dialect do you want to focus on?</p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 p-3">
                {#each dialects as dialect}
                  <button
                    class="flex flex-col items-center gap-4 p-8 rounded-lg border-2 transition-all duration-200
                      {targetDialect === dialect.id 
                        ? 'bg-tile-500 border-text-300 scale-105 shadow-xl' 
                        : 'bg-tile-400 border-tile-600 hover:bg-tile-500 hover:border-tile-500 hover:scale-102'}"
                    onclick={() => selectDialect(dialect.id)}
                  >
                    <span class="text-5xl">{dialect.emoji}</span>
                    <div class="text-center w-full">
                      <span class="font-bold text-xl sm:text-2xl text-text-300 block mb-2">{dialect.label}</span>
                      <span class="text-base sm:text-lg text-text-200">{dialect.description}</span>
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Step 2: Learning Reason -->
          {#if step === 2}
            <div class="flex flex-col gap-8" in:fade={{ duration: 300 }}>
              <div class="text-center mb-6">
                <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-300 mb-4">Why Are You Learning Arabic?</h2>
                <p class="text-text-200 text-xl sm:text-2xl">Help us tailor content to your goals</p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-3">
                {#each learningReasons as reason}
                  <button
                    class="flex flex-col items-center gap-4 p-8 rounded-lg border-2 transition-all duration-200
                      {learningReason === reason.id 
                        ? 'bg-tile-500 border-text-300 scale-105 shadow-xl' 
                        : 'bg-tile-400 border-tile-600 hover:bg-tile-500 hover:border-tile-500 hover:scale-102'}"
                    onclick={() => selectReason(reason.id)}
                  >
                    <span class="text-5xl">{reason.emoji}</span>
                    <div class="text-center w-full">
                      <span class="font-bold text-xl sm:text-2xl text-text-300 block mb-2">{reason.label}</span>
                      <span class="text-base sm:text-lg text-text-200">{reason.description}</span>
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Step 3: Proficiency Level -->
          {#if step === 3}
            <div class="flex flex-col gap-8" in:fade={{ duration: 300 }}>
              <div class="text-center mb-6">
                <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-300 mb-4">What's Your Current Level?</h2>
                <p class="text-text-200 text-xl sm:text-2xl">Select your proficiency level</p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-3">
                {#each proficiencyLevels as level}
                  <button
                    class="flex flex-col gap-3 p-8 rounded-lg border-2 transition-all duration-200 text-left
                      {proficiencyLevel === level.id 
                        ? 'bg-tile-500 border-text-300 scale-105 shadow-xl' 
                        : 'bg-tile-400 border-tile-600 hover:bg-tile-500 hover:border-tile-500 hover:scale-102'}"
                    onclick={() => selectLevel(level.id)}
                  >
                    <span class="font-bold text-xl sm:text-2xl text-text-300">{level.label}</span>
                    <span class="text-base sm:text-lg text-text-200">{level.description}</span>
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Error Message -->
          {#if error}
            <div class="bg-tile-500 border-2 border-red-500 rounded-lg p-4 text-red-200 text-lg mt-6 max-w-2xl mx-auto">
              {error}
            </div>
          {/if}

          <!-- Navigation Buttons -->
          <div class="flex gap-4 mt-12 pt-8 border-t border-tile-600 max-w-2xl mx-auto w-full">
            {#if step > 0 && step < 3}
              <Button type="button" onClick={prevStep} className="!w-auto !px-8 !py-3 !text-lg">
                Back
              </Button>
            {/if}
            
            <div class="flex-1"></div>

            {#if step === 0}
              <Button type="button" onClick={nextStep} className="!w-auto !px-10 !py-3 !text-lg">
                Get Started
              </Button>
            {:else if step === 1}
              <Button 
                type="button" 
                onClick={nextStep} 
                className="!w-auto !px-10 !py-3 !text-lg"
              >
                Next
              </Button>
            {:else if step === 2}
              <Button 
                type="button" 
                onClick={nextStep} 
                className="!w-auto !px-10 !py-3 !text-lg"
              >
                Next
              </Button>
            {:else if step === 3}
              <Button 
                type="button" 
                onClick={handleSubmit} 
                className="!w-auto !px-10 !py-3 !text-lg"
                disabled={isSubmitting || !proficiencyLevel}
              >
                {isSubmitting ? 'Saving...' : 'Complete Setup'}
              </Button>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
