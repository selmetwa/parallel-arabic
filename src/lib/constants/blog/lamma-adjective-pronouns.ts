import type { BlogPost } from '$lib/types/blog';

export const lammaAdjectivePronouns: BlogPost = {
  slug: 'lamma-when-adjective-pronouns',
  title: 'لما, Adjective of Verbs & Pronouns in Egyptian Arabic',
  description:
    'Learn how to use لما (when/whenever) for habitual situations, the difference between بجيب and جايب, and how to attach ني (me) and ي (my) to words.',
  publishedAt: '2026-03-29',
  tags: ['grammar', 'egyptian-arabic', 'pronouns', 'active-participle', 'lamma'],
  dialect: 'egyptian-arabic',
  difficulty: 'intermediate',
  relatedLinks: [
    { label: 'Adjective of the Verb (Active Participle)', href: '/blog/adjective-of-the-verb' },
    { label: 'Egyptian Arabic Verb Conjugations', href: '/egyptian-arabic/conjugations' },
    { label: 'Egyptian Arabic Lessons', href: '/lessons/structured/egyptian-arabic' },
  ],
  content: [
    // ─── SECTION 1: لما ───────────────────────────────────────────────────────
    {
      type: 'section-header',
      text: 'لما — When / Whenever',
      level: 2,
    },
    {
      type: 'paragraph',
      text: 'لما (lamma) means "when" or "whenever" and is used for habitual or repeated situations — things that happen regularly whenever a condition is true. It is not used for single past events.',
    },
    {
      type: 'callout',
      title: 'Pattern: لما + بكون / بيكون',
      text: 'لما بكون [state/place] → whenever I am [state/place] …\nلما مش بيكون في [thing] → whenever there is no [thing] …',
    },
    {
      type: 'example',
      caption: 'لما (lamma) — habitual "when"',
      items: [
        {
          arabic: 'لما بكون جعان، بعمل أكل',
          transliteration: 'lamma bakoon gaʿān, baʿmel akl',
          english: 'When I\'m hungry, I cook',
        },
        {
          arabic: 'لما مش بيكون في قهوة في البيت، بشتري قهوة من Uber Eats',
          transliteration: 'lamma mesh beyekoon fi ʾahwa fi el-beit, beshtiri ʾahwa men Uber Eats',
          english: 'When there isn\'t coffee at home, I buy coffee from Uber Eats',
        },
        {
          arabic: 'عايش دلوقتي في أمريكا، بس لما بكون في القاهرة، بعيش مع بابا في شقته',
          transliteration: 'ʿāyesh delwaʾti fi amrika, bas lamma bakoon fi el-ʾāhera, baʿīsh maʿa baba fi shaʾʾeto',
          english: 'I live in the US now, but when I\'m in Cairo, I stay with my dad in his apartment',
        },
      ],
    },

    // ─── SECTION 2: بكون ─────────────────────────────────────────────────────
    {
      type: 'section-header',
      text: 'بكون — Habitual or Recurring State',
      level: 2,
    },
    {
      type: 'paragraph',
      text: 'بكون (bakoon) is the habitual/continuous present of كان. On its own, an adjective or location describes your state right now. Adding بكون shifts the meaning to "usually" or "in general".',
    },
    {
      type: 'callout',
      title: 'State now vs. habitual state',
      text: 'أنا [adjective] → I am [adjective] right now\nأنا بكون [adjective] → I am usually / I tend to be [adjective]',
    },
    {
      type: 'example',
      caption: 'مبسوط (mabsoot) — happy',
      items: [
        {
          arabic: 'أنا مبسوط',
          transliteration: 'ana mabsoot',
          english: 'I am happy (right now)',
        },
        {
          arabic: 'أنا بكون مبسوط',
          transliteration: 'ana bakoon mabsoot',
          english: 'I get happy / I am usually happy',
        },
      ],
    },

    // ─── SECTION 3: Active Participle vs. Present Continuous ─────────────────
    {
      type: 'section-header',
      text: 'Active Participle vs. Present Continuous',
      level: 2,
    },
    {
      type: 'paragraph',
      text: 'This builds on the active participle lesson. The key contrast: the present continuous (بـ prefix) describes what you habitually or regularly do; the active participle describes what you are doing right now, or a state you are currently in.',
    },
    {
      type: 'callout',
      title: 'The core difference',
      text: 'بـ + verb → habitual / general: أنا بجيب الأكل (I bring/get the food — that\'s my job or habit)\nActive participle → right now / already in that state: أنا جايب الأكل (I am bringing the food / I already have it with me)',
    },
    {
      type: 'example',
      caption: 'Side-by-side contrasts',
      items: [
        {
          arabic: 'أنا بجيب الأكل',
          transliteration: 'ana bagīb el-akl',
          english: 'I get / bring the food (habitual — it\'s my role)',
        },
        {
          arabic: 'أنا جايب الأكل',
          transliteration: 'ana gayeb el-akl',
          english: 'I am getting the food / I already have it with me (right now)',
        },
        {
          arabic: 'أنا بلبس قميص وبنطلون في الشغل',
          transliteration: 'ana belbis ʾamīs w-bantaloon fi el-shughl',
          english: 'I wear a shirt and trousers at work (habit)',
        },
        {
          arabic: 'أنا لابس قميص أبيض — انت شايفني؟',
          transliteration: 'ana lābes ʾamīs abyad — enta shayefni?',
          english: 'I am wearing a white shirt — can you see me? (right now)',
        },
        {
          arabic: 'أنا بنام بدري كل يوم',
          transliteration: 'ana banām badri koll yom',
          english: 'I sleep early every day (habit)',
        },
        {
          arabic: 'أنا نايم',
          transliteration: 'ana nāyem',
          english: 'I am sleeping (right now)',
        },
        {
          arabic: 'أنا بروح الشغل كل يوم',
          transliteration: 'ana barooh el-shughl koll yom',
          english: 'I go to work every day (habit)',
        },
        {
          arabic: 'أنا رايح الفرح دلوقتي',
          transliteration: 'ana rayeh el-faraḥ delwaʾti',
          english: 'I am going to the wedding right now',
        },
      ],
    },

    // ─── SECTION 4: Pronouns ─────────────────────────────────────────────────
    {
      type: 'section-header',
      text: 'Attached Pronouns — ني (me) and ي (my)',
      level: 2,
    },
    {
      type: 'paragraph',
      text: 'Egyptian Arabic attaches short pronoun suffixes directly to verbs and nouns. Two of the most common are ني (ni — me) added to verbs, and ي (i — my) added to nouns.',
    },
    {
      type: 'callout',
      title: 'Verb + ني → "… me"',
      text: 'Add ني (ni) to the end of a verb to mean "me" as the object.\nExample: بتكلم (you talk) → بتكلمني (you talk to me)',
    },
    {
      type: 'example',
      caption: 'Verb + ني (ni) — me',
      items: [
        {
          arabic: 'بتكلمني',
          transliteration: 'betkallemni',
          english: 'You talk to me / you are talking to me',
        },
        {
          arabic: 'بتسمعني؟',
          transliteration: 'betsmaʿni?',
          english: 'Can you hear me?',
        },
        {
          arabic: 'بتشوفني؟',
          transliteration: 'betshooofni?',
          english: 'Can you see me?',
        },
        {
          arabic: 'بتفهمني؟',
          transliteration: 'betfahemni?',
          english: 'Do you understand me?',
        },
      ],
    },
    {
      type: 'callout',
      title: 'Noun + ي → "my …"',
      text: 'Add ي (i / ya) to the end of a noun to mean "my".\nExample: بيت (house) → بيتي (my house)',
    },
    {
      type: 'example',
      caption: 'Noun + ي (i) — my',
      items: [
        {
          arabic: 'بيتي',
          transliteration: 'beiti',
          english: 'My house',
        },
        {
          arabic: 'أمي',
          transliteration: 'ommi',
          english: 'My mother',
        },
        {
          arabic: 'أبويا',
          transliteration: 'abouya',
          english: 'My father',
        },
        {
          arabic: 'اسمي',
          transliteration: 'esmi',
          english: 'My name',
        },
        {
          arabic: 'شغلي',
          transliteration: 'shughli',
          english: 'My work / my job',
        },
      ],
    },
  ],
};
