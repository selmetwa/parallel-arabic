// Egyptian-Colloquial Arabic alphabet data.
// Keys match `src/lib/constants/alphabet.ts` so audio (`/letters/audios/{key}.mp3`)
// and stroke SVGs (`/letters/{key}.svg`) can be reused, and positional forms merged in.

export type Articulation = 'throat' | 'tongue-teeth' | 'lips';

export type EgyptianLetter = {
  key: string;
  letterName: string;
  franco: string;
  englishSound: string;
  egyptianSound: string;
  exampleArabic: string;
  exampleFranco: string;
  meaning: string;
  notes: string;
  articulation: Articulation;
};

export const egyptianLetters: EgyptianLetter[] = [
  {
    key: 'alif',
    letterName: 'Alif',
    franco: 'Alef',
    englishSound: 'A/E/O',
    egyptianSound: 'A/E/O',
    exampleArabic: 'أنا',
    exampleFranco: 'ana',
    meaning: 'I',
    notes: 'Takes vowel sound',
    articulation: 'throat'
  },
  {
    key: 'ba',
    letterName: 'Ba',
    franco: 'Ba',
    englishSound: 'B',
    egyptianSound: 'B',
    exampleArabic: 'باب',
    exampleFranco: 'bab',
    meaning: 'door',
    notes: 'Same as English B',
    articulation: 'lips'
  },
  {
    key: 'ta',
    letterName: 'Ta',
    franco: 'Ta',
    englishSound: 'T',
    egyptianSound: 'T',
    exampleArabic: 'تفاح',
    exampleFranco: 'toffa7',
    meaning: 'apple',
    notes: 'Same as English t',
    articulation: 'tongue-teeth'
  },
  {
    key: 'tha',
    letterName: 'Tha',
    franco: 'Tha',
    englishSound: 'TH',
    egyptianSound: 'S/T',
    exampleArabic: 'ثوم ثانية',
    exampleFranco: 'Tom / sanyah',
    meaning: 'garlic / second',
    notes: 'Usually T or S in Egyptian',
    articulation: 'tongue-teeth'
  },
  {
    key: 'jeem',
    letterName: 'Jim',
    franco: 'Jim',
    englishSound: 'J',
    egyptianSound: 'G',
    exampleArabic: 'جمل',
    exampleFranco: 'jamal',
    meaning: 'camel',
    notes: 'Egyptian G sound',
    articulation: 'throat'
  },
  {
    key: 'haa',
    letterName: 'Ha',
    franco: '7a',
    englishSound: 'Strong H',
    egyptianSound: 'Strong H',
    exampleArabic: 'حبيب',
    exampleFranco: 'Habib',
    meaning: 'beloved',
    notes: 'No English equivalent',
    articulation: 'throat'
  },
  {
    key: 'khaa',
    letterName: 'Kha',
    franco: 'Kha',
    englishSound: 'KH',
    egyptianSound: 'KH',
    exampleArabic: 'خير',
    exampleFranco: 'kheer',
    meaning: 'goodness',
    notes: 'Like German Bach',
    articulation: 'throat'
  },
  {
    key: 'dal',
    letterName: 'Dal',
    franco: 'Dal',
    englishSound: 'D',
    egyptianSound: 'D',
    exampleArabic: 'درس',
    exampleFranco: 'dars',
    meaning: 'lesson',
    notes: 'Same as English D',
    articulation: 'tongue-teeth'
  },
  {
    key: 'dhal',
    letterName: 'Zal',
    franco: 'Zaal',
    englishSound: 'TH',
    egyptianSound: 'Z',
    exampleArabic: 'ذرة',
    exampleFranco: 'dorra',
    meaning: 'corn',
    notes: 'Usually Z, can shift to D',
    articulation: 'tongue-teeth'
  },
  {
    key: 'ra',
    letterName: 'Ra',
    franco: 'Ra',
    englishSound: 'R',
    egyptianSound: 'R',
    exampleArabic: 'راجل',
    exampleFranco: 'ragel',
    meaning: 'man',
    notes: 'Rolled R',
    articulation: 'tongue-teeth'
  },
  {
    key: 'zay',
    letterName: 'Zay',
    franco: 'Zay',
    englishSound: 'Z',
    egyptianSound: 'Z',
    exampleArabic: 'زيت',
    exampleFranco: 'zeit',
    meaning: 'oil',
    notes: 'Same as English Z',
    articulation: 'tongue-teeth'
  },
  {
    key: 'seen',
    letterName: 'Seen',
    franco: 'Seen',
    englishSound: 'S',
    egyptianSound: 'S',
    exampleArabic: 'سمك',
    exampleFranco: 'samak',
    meaning: 'fish',
    notes: 'Same as English S',
    articulation: 'tongue-teeth'
  },
  {
    key: 'sheen',
    letterName: 'Sheen',
    franco: 'Sheen',
    englishSound: 'SH',
    egyptianSound: 'SH',
    exampleArabic: 'شاي',
    exampleFranco: 'shay',
    meaning: 'tea',
    notes: 'Same as English SH',
    articulation: 'tongue-teeth'
  },
  {
    key: 'saad',
    letterName: 'Saad',
    franco: 'Saad',
    englishSound: 'Heavy S',
    egyptianSound: 'Heavy S',
    exampleArabic: 'صاحب',
    exampleFranco: 'sa7eb',
    meaning: 'friend',
    notes: 'Emphatic S',
    articulation: 'tongue-teeth'
  },
  {
    key: 'dhaad',
    letterName: 'Dad',
    franco: 'Dad',
    englishSound: 'Heavy D',
    egyptianSound: 'Heavy D',
    exampleArabic: 'ضيف',
    exampleFranco: 'deif',
    meaning: 'guest',
    notes: 'Emphatic D',
    articulation: 'tongue-teeth'
  },
  {
    key: 'taa',
    letterName: 'Ta',
    franco: 'Ta2',
    englishSound: 'Heavy T',
    egyptianSound: 'Heavy T',
    exampleArabic: 'طيارة',
    exampleFranco: 'tayyara',
    meaning: 'airplane',
    notes: 'Emphatic T',
    articulation: 'tongue-teeth'
  },
  {
    key: 'dhaa',
    letterName: 'Za',
    franco: 'Za2',
    englishSound: 'Heavy Z',
    egyptianSound: 'Heavy Z',
    exampleArabic: 'ظرف',
    exampleFranco: 'zarf',
    meaning: 'envelope',
    notes: 'Usually a hard Z',
    articulation: 'tongue-teeth'
  },
  {
    key: 'ayn',
    letterName: 'Ayn',
    franco: '3yn',
    englishSound: 'ʕ',
    egyptianSound: 'ʕ',
    exampleArabic: 'عربي',
    exampleFranco: '3arabi',
    meaning: 'Arabic',
    notes: 'No English equivalent',
    articulation: 'throat'
  },
  {
    key: 'ghayn',
    letterName: 'Ghein',
    franco: 'Ghein',
    englishSound: 'GH',
    egyptianSound: 'GH',
    exampleArabic: 'غالي',
    exampleFranco: 'ghali',
    meaning: 'expensive',
    notes: 'French R-like',
    articulation: 'throat'
  },
  {
    key: 'fa',
    letterName: 'Fa',
    franco: 'Fa',
    englishSound: 'F',
    egyptianSound: 'F',
    exampleArabic: 'فصل',
    exampleFranco: 'fasl',
    meaning: 'class',
    notes: 'Same as English F',
    articulation: 'lips'
  },
  {
    key: 'qaf',
    letterName: 'Qaf',
    franco: 'Qaf',
    englishSound: 'Q',
    egyptianSound: 'A/Q',
    exampleArabic: 'قلب قرية',
    exampleFranco: 'alb / qaryah',
    meaning: 'heart / village',
    notes: 'Often becomes a hamza (glottal stop)',
    articulation: 'throat'
  },
  {
    key: 'kaf',
    letterName: 'Kaf',
    franco: 'Kaf',
    englishSound: 'K',
    egyptianSound: 'K',
    exampleArabic: 'كتاب',
    exampleFranco: 'ketab',
    meaning: 'book',
    notes: 'Same as English K',
    articulation: 'throat'
  },
  {
    key: 'lam',
    letterName: 'Lam',
    franco: 'Lam',
    englishSound: 'L',
    egyptianSound: 'L',
    exampleArabic: 'لبن',
    exampleFranco: 'laban',
    meaning: 'milk',
    notes: 'Same as English L',
    articulation: 'tongue-teeth'
  },
  {
    key: 'meem',
    letterName: 'Mim',
    franco: 'Mim',
    englishSound: 'M',
    egyptianSound: 'M',
    exampleArabic: 'مدرسة',
    exampleFranco: 'madrasa',
    meaning: 'school',
    notes: 'Same as English M',
    articulation: 'lips'
  },
  {
    key: 'noon',
    letterName: 'Nun',
    franco: 'Nun',
    englishSound: 'N',
    egyptianSound: 'N',
    exampleArabic: 'ناس',
    exampleFranco: 'nas',
    meaning: 'people',
    notes: 'Same as English N',
    articulation: 'tongue-teeth'
  },
  {
    key: 'ha',
    letterName: 'Ha',
    franco: 'Ha',
    englishSound: 'H',
    egyptianSound: 'H',
    exampleArabic: 'هو',
    exampleFranco: 'howwa',
    meaning: 'he',
    notes: 'Soft H',
    articulation: 'throat'
  },
  {
    key: 'waw',
    letterName: 'Waw',
    franco: 'Waw',
    englishSound: 'W/OO',
    egyptianSound: 'W/OO',
    exampleArabic: 'ورد',
    exampleFranco: 'ward',
    meaning: 'flower',
    notes: 'Consonant or vowel',
    articulation: 'lips'
  },
  {
    key: 'yaa',
    letterName: 'Ya',
    franco: 'Ya',
    englishSound: 'Y/EE',
    egyptianSound: 'Y/EE',
    exampleArabic: 'يلّا',
    exampleFranco: 'yalla',
    meaning: 'hurry',
    notes: 'Consonant or vowel',
    articulation: 'lips'
  }
];

export type ArticulationGroup = {
  id: Articulation;
  label: string;
  description: string;
  keys: string[];
};

export const articulationGroups: ArticulationGroup[] = [
  {
    id: 'throat',
    label: 'Throat',
    description:
      'Produced deep in the throat. These are the hardest for English speakers — ح ع غ خ ق ء have no close English equivalent.',
    keys: egyptianLetters.filter((l) => l.articulation === 'throat').map((l) => l.key)
  },
  {
    id: 'tongue-teeth',
    label: 'Tongue & teeth',
    description: 'Made with the tongue against the teeth or ridge behind them.',
    keys: egyptianLetters.filter((l) => l.articulation === 'tongue-teeth').map((l) => l.key)
  },
  {
    id: 'lips',
    label: 'Lips',
    description: 'Formed at the lips.',
    keys: egyptianLetters.filter((l) => l.articulation === 'lips').map((l) => l.key)
  }
];

// Letters that connect to the letter BEFORE them but never to the letter AFTER them.
export const sixKickingLetters = ['alif', 'waw', 'dal', 'dhal', 'ra', 'zay'];

export type EgyptianNote = {
  title: string;
  summary: string;
  rows: { arabic: string; egyptian: string }[];
};

export const egyptianNotes: EgyptianNote[] = [
  {
    title: 'ج = G',
    summary: "Always a hard G in Egyptian — never 'J' unless you're speaking MSA.",
    rows: [
      { arabic: 'جميل', egyptian: 'gameel — beautiful' },
      { arabic: 'جمل', egyptian: 'gamal — camel' },
      { arabic: 'جديد', egyptian: 'gedeed — new' }
    ]
  },
  {
    title: 'ق = three possibilities (Q, A or 2)',
    summary:
      'In everyday Egyptian it usually becomes a hamza (glottal stop), but educated speakers keep the Q in many words.',
    rows: [
      { arabic: 'قلب', egyptian: 'alb — heart' },
      { arabic: 'قرآن', egyptian: "Qor'an — Quran" },
      { arabic: 'قرار', egyptian: 'Qarar — decision' }
    ]
  },
  {
    title: 'ث = usually T or S',
    summary: 'The English "th" sound is rare in Egyptian; it shifts to T or S.',
    rows: [
      { arabic: 'ثوم', egyptian: 'Tom — garlic' },
      { arabic: 'ثلاثة', egyptian: 'Talata — three' },
      { arabic: 'ثانوية', egyptian: 'Sanaweya — secondary' }
    ]
  },
  {
    title: 'ذ = usually Z or D',
    summary: 'The English "th" (as in this) shifts to Z, occasionally D.',
    rows: [
      { arabic: 'ذرة', egyptian: 'Dorra — corn' },
      { arabic: 'ذهب', egyptian: 'Dahab — gold' },
      { arabic: 'إذاعة', egyptian: 'eza3a — radio channel' }
    ]
  },
  {
    title: 'ظ = usually Z',
    summary: 'Pronounced as a hard/emphatic Z.',
    rows: [
      { arabic: 'ظرف', egyptian: 'Zarf — envelope' },
      { arabic: 'ظابط', egyptian: 'Zabet — officer' }
    ]
  }
];

export const longVowels = [
  { letter: 'ا', sound: 'aa', example: 'باب (bab) — door' },
  { letter: 'و', sound: 'oo', example: 'نور (noor) — light' },
  { letter: 'ي', sound: 'ee', example: 'كبير (kebeer) — big' }
];

export type SpecialShape = {
  name: string;
  franco: string;
  forms: { label: string; glyph: string }[];
  example: string;
  note: string;
};

export const specialShapes: SpecialShape[] = [
  {
    name: 'Lam-Alif',
    franco: 'laa',
    forms: [
      { label: 'Isolated', glyph: 'لا' },
      { label: 'Linked', glyph: 'ـلا' }
    ],
    example: 'كلام (kalam) — speech',
    note: 'ل + ا fuse into a single ligature.'
  },
  {
    name: 'Haa',
    franco: 'h',
    forms: [
      { label: 'Isolated', glyph: 'ه' },
      { label: 'Middle', glyph: 'ـهـ' },
      { label: 'Final', glyph: 'ـه' }
    ],
    example: 'وشه (wesho) — his face',
    note: 'Changes shape noticeably in isolated, middle and final positions.'
  },
  {
    name: 'Taa Marbuta',
    franco: 'a / ah',
    forms: [
      { label: 'Isolated', glyph: 'ة' },
      { label: 'Final', glyph: 'ـة' }
    ],
    example: 'مدرسة (madrasa) — school',
    note: 'Appears only at the end of words — very important in Egyptian feminine nouns.'
  }
];

export type HamzaForm = {
  position: string;
  glyph: string;
  name: string;
};

export const hamzaForms: HamzaForm[] = [
  { position: 'Middle', glyph: 'ـأـ', name: 'Hamza on Alif' },
  { position: 'Middle', glyph: 'ـؤـ', name: 'Hamza on Waw' },
  { position: 'Middle', glyph: 'ـئـ', name: 'Hamza on Ya' },
  { position: 'Middle', glyph: 'ـءـ', name: 'Standalone Hamza' },
  { position: 'End', glyph: 'ـأ', name: 'Hamza on Alif' },
  { position: 'End', glyph: 'ـؤ', name: 'Hamza on Waw' },
  { position: 'End', glyph: 'ـئ', name: 'Hamza on Ya' },
  { position: 'End', glyph: 'ـء', name: 'Standalone Hamza' }
];
