// All vocabulary sections - all use the new API format (/vocab/egyptian/{category})
// except 'most_common' which uses local data
export const sections = [
  {
    name: 'Verbs',
    path: 'verbs',
    count: 126,
    isPaywalled: false
  },
  {
    name: 'Animals',
    path: 'animals',
    count: 152,
    isPaywalled: false
  },
  {
    // These two are a UI split of the local frequency list in
    // common-words.ts (2,404 entries), not categories in the word table, so
    // their counts come from that file rather than from Supabase.
    name: 'Most common words (1–1000)',
    path: 'most_common',
    count: 1000,
    isPaywalled: true,
    useLocalData: true
  },
  {
    name: 'Most common words (1001–2404)',
    path: 'most_common_2',
    count: 1404,
    isPaywalled: true,
    useLocalData: true
  },
  {
    name: 'Adjectives',
    path: 'adjectives',
    count: 71,
    isPaywalled: true
  },
  {
    name: 'Adverbs',
    path: 'adverbs',
    count: 76,
    isPaywalled: true
  },
  {
    name: 'Around the house',
    path: 'around_the_house',
    count: 251,
    isPaywalled: true
  },
  {
    name: 'Cars and other transportation',
    path: 'cars_and_other_transportation',
    count: 166,
    isPaywalled: true
  },
  {
    name: 'City and transportation',
    path: 'city_and_transportation',
    count: 180,
    isPaywalled: true
  },
  {
    name: 'Clothing, jewelry and accessories',
    path: 'clothing_jewelry_and_accessories',
    count: 161,
    isPaywalled: true
  },
  {
    name: 'Clothing',
    path: 'clothing',
    count: 113,
    isPaywalled: true
  },
  {
    name: 'Colors',
    path: 'colors',
    count: 43,
    isPaywalled: true
  },
  {
    name: 'Education',
    path: 'education',
    count: 142,
    isPaywalled: true
  },
  {
    name: 'School and education',
    path: 'school_and_education',
    count: 179,
    isPaywalled: true
  },
  {
    name: 'Emotions and personality traits',
    path: 'emotions__and__personality_traits',
    count: 112,
    isPaywalled: true
  },
  {
    name: 'Family',
    path: 'family',
    count: 97,
    isPaywalled: true
  },
  {
    name: 'Food and drink',
    path: 'food_and_drink',
    count: 364,
    isPaywalled: true
  },
  {
    name: 'Food',
    path: 'food',
    count: 193,
    isPaywalled: true
  },
  {
    name: 'Geography',
    path: 'geography',
    count: 88,
    isPaywalled: true
  },
  {
    name: 'Government and politics',
    path: 'government_and_politics',
    count: 223,
    isPaywalled: true
  },
  {
    name: 'Health and medicine',
    path: 'health_and_medicine',
    count: 123,
    isPaywalled: true
  },
  {
    name: 'Human body',
    path: 'human_body',
    count: 205,
    isPaywalled: true
  },
  {
    name: 'Language',
    path: 'language',
    count: 131,
    isPaywalled: true
  },
  {
    name: 'Life and death',
    path: 'life_and_death',
    count: 92,
    isPaywalled: true
  },
  {
    name: 'Mankind and kinship',
    path: 'mankind_and_kinship',
    count: 145,
    isPaywalled: true
  },
  {
    name: 'Media and the arts',
    path: 'media_and_the_arts',
    count: 265,
    isPaywalled: true
  },
  {
    name: 'Media',
    path: 'media',
    count: 250,
    isPaywalled: true
  },
  {
    name: 'Media 2',
    path: 'media_2',
    count: 222,
    isPaywalled: true
  },
  {
    name: 'Media 3',
    path: 'media_3',
    count: 151,
    isPaywalled: true
  },
  {
    name: 'Medicine',
    path: 'medicine',
    count: 138,
    isPaywalled: true
  },
  {
    name: 'Nature and weather',
    path: 'nature__and__weather',
    count: 100,
    isPaywalled: true
  },
  {
    name: 'Weather',
    path: 'weather',
    count: 91,
    isPaywalled: true
  },
  {
    name: 'Numbers',
    path: 'numbers',
    count: 116,
    isPaywalled: true
  },
  {
    name: 'Recreation and relaxation',
    path: 'recreation_and_relaxation',
    count: 196,
    isPaywalled: true
  },
  {
    name: 'Religion',
    path: 'religion',
    count: 131,
    isPaywalled: true
  },
  {
    name: 'Sports and hobbies',
    path: 'sports__and__hobbies',
    count: 134,
    isPaywalled: true
  },
  {
    name: 'Time',
    path: 'time',
    count: 101,
    isPaywalled: true
  },
  {
    name: 'Vocabulary from around the house',
    path: 'vocabulary_from_around_the_house',
    count: 145,
    isPaywalled: true
  },
  {
    name: 'Work and money',
    path: 'work_and_money',
    count: 174,
    isPaywalled: true
  },
  {
    name: 'Work and professions',
    path: 'work_and_professions',
    count: 135,
    isPaywalled: true
  },
  {
    name: 'War',
    path: 'war',
    count: 168,
    isPaywalled: true
  }
];
