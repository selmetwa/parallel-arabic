// All vocabulary sections - all use the new API format (/vocab/egyptian/{category})
// except 'most_common' which uses local data
export const sections = [
  {
    name: 'Verbs',
    path: 'verbs',
    count: 97,
    isPaywalled: false
  },
  {
    name: 'Animals',
    path: 'animals',
    count: 156,
    isPaywalled: false
  },
  {
    name: 'Most common words',
    path: 'most_common',
    count: 2404,
    isPaywalled: true,
    useLocalData: true // Special handling - uses local commonWords data
  },
  {
    name: 'Adjectives',
    path: 'adjectives',
    count: 100,
    isPaywalled: true
  },
  {
    name: 'Adverbs',
    path: 'adverbs',
    count: 80,
    isPaywalled: true
  },
  {
    name: 'Around the house',
    path: 'around_the_house',
    count: 253,
    isPaywalled: true
  },
  {
    name: 'Cars and other transportation',
    path: 'cars_and_other_transportation',
    count: 120,
    isPaywalled: true
  },
  {
    name: 'City and transportation',
    path: 'city_and_transportation',
    count: 184,
    isPaywalled: true
  },
  {
    name: 'Clothing, jewelry and accessories',
    path: 'clothing_jewelry_and_accessories',
    count: 150,
    isPaywalled: true
  },
  {
    name: 'Clothing',
    path: 'clothing',
    count: 117,
    isPaywalled: true
  },
  {
    name: 'Colors',
    path: 'colors',
    count: 59,
    isPaywalled: true
  },
  {
    name: 'Crime and punishment',
    path: 'crime_and_punishment',
    count: 73,
    isPaywalled: true
  },
  {
    name: 'Education',
    path: 'education',
    count: 144,
    isPaywalled: true
  },
  {
    name: 'School and education',
    path: 'school_and_education',
    count: 144,
    isPaywalled: true
  },
  {
    name: 'Emotions and personality traits',
    path: 'emotions__and__personality_traits',
    count: 214,
    isPaywalled: true
  },
  {
    name: 'Family',
    path: 'family',
    count: 80,
    isPaywalled: true
  },
  {
    name: 'Food and drink',
    path: 'food_and_drink',
    count: 220,
    isPaywalled: true
  },
  {
    name: 'Food',
    path: 'food',
    count: 192,
    isPaywalled: true
  },
  {
    name: 'Geography',
    path: 'geography',
    count: 90,
    isPaywalled: true
  },
  {
    name: 'Government and politics',
    path: 'government_and_politics',
    count: 225,
    isPaywalled: true
  },
  {
    name: 'Health and medicine',
    path: 'health_and_medicine',
    count: 180,
    isPaywalled: true
  },
  {
    name: 'Human body',
    path: 'human_body',
    count: 221,
    isPaywalled: true
  },
  {
    name: 'Language',
    path: 'language',
    count: 90,
    isPaywalled: true
  },
  {
    name: 'Life and death',
    path: 'life_and_death',
    count: 60,
    isPaywalled: true
  },
  {
    name: 'Mankind and kinship',
    path: 'mankind_and_kinship',
    count: 151,
    isPaywalled: true
  },
  {
    name: 'Media and the arts',
    path: 'media_and_the_arts',
    count: 271,
    isPaywalled: true
  },
  {
    name: 'Media',
    path: 'media',
    count: 252,
    isPaywalled: true
  },
  {
    name: 'Media 2',
    path: 'media_2',
    count: 224,
    isPaywalled: true
  },
  {
    name: 'Media 3',
    path: 'media_3',
    count: 153,
    isPaywalled: true
  },
  {
    name: 'Medicine',
    path: 'medicine',
    count: 148,
    isPaywalled: true
  },
  {
    name: 'Nature and weather',
    path: 'nature__and__weather',
    count: 173,
    isPaywalled: true
  },
  {
    name: 'Weather',
    path: 'weather',
    count: 85,
    isPaywalled: true
  },
  {
    name: 'Numbers',
    path: 'numbers',
    count: 50,
    isPaywalled: true
  },
  {
    name: 'Recreation and relaxation',
    path: 'recreation_and_relaxation',
    count: 120,
    isPaywalled: true
  },
  {
    name: 'Religion',
    path: 'religion',
    count: 135,
    isPaywalled: true
  },
  {
    name: 'Sports and hobbies',
    path: 'sports__and__hobbies',
    count: 136,
    isPaywalled: true
  },
  {
    name: 'Technology',
    path: 'technology',
    count: 85,
    isPaywalled: true
  },
  {
    name: 'Time',
    path: 'time',
    count: 103,
    isPaywalled: true
  },
  {
    name: 'Vocabulary from around the house',
    path: 'vocabulary_from_around_the_house',
    count: 253,
    isPaywalled: true
  },
  {
    name: 'Work and money',
    path: 'work_and_money',
    count: 176,
    isPaywalled: true
  },
  {
    name: 'Work and professions',
    path: 'work_and_professions',
    count: 120,
    isPaywalled: true
  },
  {
    name: 'War',
    path: 'war',
    count: 172,
    isPaywalled: true
  }
];