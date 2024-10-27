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
<PaywallModal isOpen={isModalOpen} {handleCloseModal}></PaywallModal>
<h1 class="text-4xl text-text-300 font-semibold mt-4 px-8 pt-6">Anki Decks</h1>
<p class=" pl-8 text-text-300 text-lg">Click on the links to download</p>

{#if !data.isSubscribed}
  <p class=" pl-8 text-text-300 text-lg">You are not currently subscribed and will not have access to all the vocabulary</p>
{/if}
<ul class="gap-4 list-disc list-inside sm:grid sm:grid-cols-2 px-8 mt-4">
  {#each decks as deck}
  {#if deck.isPaywalled && !data.isSubscribed}
    <li>
      <button 
      onclick={openPaywallModal}
      class="text-text-300 text-lg underline hover:text-text-500 transition-colors duration-300"
      >
       🔒 {deck.name} ({deck.count} Words)
      </button>
    </li>
  {:else}
  <li>
    <a 
      class="text-text-300 text-lg underline hover:text-text-500 transition-colors duration-300"
      href={deck.path} 
      download={deck.path}
      >
      {deck.name} ({deck.count} Words)
    </a>
  </li>
  {/if}

  {/each}
</ul>