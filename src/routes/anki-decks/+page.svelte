<script>
  const decks = [
    {
      name: "All Vocabulary",
      path: "/anki_decks/all_words.apkg",
      count: 4131
    },
    {
      name: 'Egyptian Arabic Verbs',
      path: '/anki_decks/verbs.apkg',
      count: 97
    },
    {
      name: 'Animals',
      path: '/anki_decks/animals.apkg',
      count: 156
    },
    {
      name: 'Around the House',
      path: '/anki_decks/around_the_house.apkg',
      count: 253
    },
    {
      name: 'City and Transportation',
      path: '/anki_decks/city_and_transportation.apkg',
      count: 184
    },
    {
      name: 'Clothing',
      path: '/anki_decks/clothing.apkg',
      count: 117
    },
    {
      name: 'Colors',
      path: '/anki_decks/colors.apkg',
      count: 59
    },
    {
      name: 'Crime and Punishment',
      path: '/anki_decks/crime_and_punishment.apkg',
      count: 73
    },
    {
      name: 'Education',
      path: '/anki_decks/education.apkg',
      count: 144
    },
    {
      name: 'Emotions and Personality Traits',
      path: '/anki_decks/emotions_and_personality_traits.apkg',
      count: 214
    },
    {
      name: 'Food',
      path: '/anki_decks/food.apkg',
      count: 192
    },
    {
      name: 'Geography',
      path: '/anki_decks/geography.apkg',
      count: 90
    },
    {
      name: 'Government and Politics',
      path: '/anki_decks/government_and_politics.apkg',
      count: 225
    },
    {
      name: 'Human Body',
      path: '/anki_decks/human_body.apkg',
      count: 221
    },
    {
      name: 'Mankind and Kinship',
      path: '/anki_decks/mankind_and_kinship.apkg',
      count: 151
    },
    {
      name: 'Media and the Arts',
      path: '/anki_decks/media_and_arts.apkg',
      count: 271
    },
    {
      name: 'Media',
      path: '/anki_decks/media.apkg',
      count: 575
    },
    {
      name: 'Medicine',
      path: '/anki_decks/medicine.apkg',
      count: 148
    },
    {
      name: 'Nature and Weather',
      path: '/anki_decks/nature_and_weather.apkg',
      count: 173
    },
    {
      name: 'Religion',
      path: '/anki_decks/religion.apkg',
      count: 135
    },
    {
      name: 'Sports and Hobbies',
      path: '/anki_decks/sports_hobbies.apkg',
      count: 136
    },
    {
      name: 'Technology',
      path: '/anki_decks/technology.apkg',
      count: 85
    },
    {
      name: 'Time',
      path: '/anki_decks/time.apkg',
      count: 103
    },
    {
      name: 'Work and Money',
      path: '/anki_decks/work_and_money.apkg',
      count: 176
    },
    {
      name: 'War',
      path: '/anki_decks/war.apkg',
      count: 172
    }
  ]
</script>






<h1 class="text-4xl text-text-300 font-semibold mt-12 px-8 py-6">Anki Decks</h1>
<ul class="gap-4 list-disc list-inside grid grid-cols-2 px-8">
  {#each decks as deck}
    <li>
      <a 
        class="text-text-300 text-xl underline hover:text-text-500 transition-colors duration-300"
        href={deck.path} 
        download={deck.path}
        >
        {deck.name} Deck ({deck.count} Words)
      </a>
    </li>
  {/each}
</ul>