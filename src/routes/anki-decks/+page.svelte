<script>
    import PaywallModal from '$lib/components/PaywallModal.svelte';

  const decks = [
    {
      name: "All Vocabulary",
      path: "/anki_decks/all_words.apkg",
      count: 4131,
      isPaywalled: true,
    },
    {
      name: 'Egyptian Arabic Verbs',
      path: '/anki_decks/verbs.apkg',
      count: 97,
      isPaywalled: true,
    },
    {
      name: 'Animals',
      path: '/anki_decks/animals.apkg',
      count: 156,
      isPaywalled: true,
    },
    {
      name: 'Around the House',
      path: '/anki_decks/around_the_house.apkg',
      count: 253,
      isPaywalled: true,
    },
    {
      name: 'City and Transportation',
      path: '/anki_decks/city_and_transportation.apkg',
      count: 184,
      isPaywalled: true,
    },
    {
      name: 'Clothing',
      path: '/anki_decks/clothing.apkg',
      count: 117,
      isPaywalled: true,
    },
    {
      name: 'Colors',
      path: '/anki_decks/colors.apkg',
      count: 59,
      isPaywalled: true,
    },
    {
      name: 'Crime and Punishment',
      path: '/anki_decks/crime_and_punishment.apkg',
      count: 73,
      isPaywalled: true,
    },
    {
      name: 'Education',
      path: '/anki_decks/education.apkg',
      count: 144,
      isPaywalled: true,
    },
    {
      name: 'Emotions and Personality Traits',
      path: '/anki_decks/emotions_and_personality_traits.apkg',
      count: 214,
      isPaywalled: true,
    },
    {
      name: 'Food',
      path: '/anki_decks/food.apkg',
      count: 192,
      isPaywalled: true,
    },
    {
      name: 'Geography',
      path: '/anki_decks/geography.apkg',
      count: 90,
      isPaywalled: true,
    },
    {
      name: 'Government and Politics',
      path: '/anki_decks/government_and_politics.apkg',
      count: 225,
      isPaywalled: true,
    },
    {
      name: 'Human Body',
      path: '/anki_decks/human_body.apkg',
      count: 221,
      isPaywalled: true,
    },
    {
      name: 'Mankind and Kinship',
      path: '/anki_decks/mankind_and_kinship.apkg',
      count: 151,
      isPaywalled: true,
    },
    {
      name: 'Media and the Arts',
      path: '/anki_decks/media_and_arts.apkg',
      count: 271,
      isPaywalled: true,
    },
    {
      name: 'Media',
      path: '/anki_decks/media.apkg',
      count: 575,
      isPaywalled: true,
    },
    {
      name: 'Medicine',
      path: '/anki_decks/medicine.apkg',
      count: 148,
      isPaywalled: true,
    },
    {
      name: 'Nature and Weather',
      path: '/anki_decks/nature_and_weather.apkg',
      count: 173,
      isPaywalled: true,
    },
    {
      name: 'Religion',
      path: '/anki_decks/religion.apkg',
      count: 135,
      isPaywalled: true,
    },
    {
      name: 'Sports and Hobbies',
      path: '/anki_decks/sports_hobbies.apkg',
      count: 136,
      isPaywalled: true,
    },
    {
      name: 'Technology',
      path: '/anki_decks/technology.apkg',
      count: 85,
      isPaywalled: true,
    },
    {
      name: 'Time',
      path: '/anki_decks/time.apkg',
      count: 103,
      isPaywalled: true,
    },
    {
      name: 'Work and Money',
      path: '/anki_decks/work_and_money.apkg',
      count: 176,
      isPaywalled: true,
    },
    {
      name: 'War',
      path: '/anki_decks/war.apkg',
      count: 172,
      isPaywalled: true,
    }
  ]

  let { data } = $props();

  let isModalOpen = $state(false);
  

function openPaywallModal() {
  isModalOpen = true;
}

function handleCloseModal() {
  isModalOpen = false;
}
</script>

<section class="min-h-screen bg-tile-300">
  <PaywallModal isOpen={isModalOpen} {handleCloseModal}></PaywallModal>
  
  <!-- Header Section -->
  <header class="border-b-2 border-tile-600 bg-tile-400 shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      <div class="text-center">
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-300 mb-4">
          Anki Decks
        </h1>
        <p class="text-lg sm:text-xl text-text-200 leading-relaxed mb-4">
          Download custom Egyptian Arabic flashcard decks for Anki
        </p>
        {#if !data.isSubscribed}
          <div class="bg-tile-500 border-2 border-tile-600 p-4 max-w-2xl mx-auto">
            <p class="text-base text-text-200">
              🔒 Subscribe to access all vocabulary decks and enhance your learning experience
            </p>
          </div>
        {/if}
      </div>
    </div>
  </header>

  <!-- Decks Grid Section -->
  <section class="py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each decks as deck}
          <div class="bg-tile-400 border-2 border-tile-600 p-4 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-bold text-text-300 text-base leading-tight">{deck.name}</h3>
              {#if deck.isPaywalled && !data.isSubscribed}
                <span class="text-xl">🔒</span>
              {/if}
            </div>
            
            <div class="mb-4">
              <span class="inline-block bg-tile-500 border border-tile-600 px-3 py-1 text-sm font-medium text-text-200">
                {deck.count} Words
              </span>
            </div>

            {#if deck.isPaywalled && !data.isSubscribed}
              <button 
                onclick={openPaywallModal}
                class="w-full px-4 py-2 text-sm font-semibold bg-tile-500 border-2 border-tile-600 text-text-300 hover:bg-tile-600 transition-colors duration-300 shadow-md"
              >
                Download Deck
              </button>
            {:else}
              <a 
                class="block w-full px-4 py-2 text-sm font-semibold bg-tile-600 border-2 border-tile-600 text-text-300 hover:bg-tile-700 transition-colors duration-300 shadow-md text-center"
                href={deck.path} 
                download={deck.path}
              >
                Download Deck
              </a>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </section>
</section>