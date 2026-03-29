import type { BlogPost } from '$lib/types/blog';

export const adjectiveOfTheVerb: BlogPost = {
  slug: 'adjective-of-the-verb',
  title: 'Adjective of the Verb (Active Participle) in Egyptian Arabic',
  description:
    'Learn how to form and use the active participle (اسم الفاعل) in Egyptian Arabic — the form that describes ongoing states like going, sitting, seeing, and knowing.',
  publishedAt: '2026-03-29',
  tags: ['grammar', 'egyptian-arabic', 'verbs', 'active-participle'],
  dialect: 'egyptian-arabic',
  difficulty: 'intermediate',
  relatedLinks: [
    { label: 'Egyptian Arabic Verb Conjugations', href: '/egyptian-arabic/conjugations' },
    { label: 'Egyptian Arabic Vocabulary', href: '/vocab-list/egyptian-arabic/verbs' },
    { label: 'Egyptian Arabic Lessons', href: '/lessons/structured/egyptian-arabic' },
  ],
  content: [
    {
      type: 'section-header',
      text: 'What is the Active Participle?',
      level: 2,
    },
    {
      type: 'paragraph',
      text: 'In Egyptian Arabic, we often use something called the active participle (اسم الفاعل — ism el-faʿel). This form comes from a verb but behaves like an adjective, and sometimes like a present or perfect tense. It is one of the most useful patterns to master because it appears constantly in everyday speech.',
    },
    {
      type: 'callout',
      title: 'Four main uses',
      text: '1. Actions happening right now: انا رايح الشغل دلوقتي (I am going to work now)\n2. Something you are in the process of doing: انا رايح اعمل شاي (I am making tea)\n3. Something you are about to do (planned): انا رايح فرح صاحبي انهاردة (I am going to make my friend happy today)\n4. Something you have just done (with لسة): انا لسة رايح المحل من خمس دقايق (I have just been to the shop five minutes ago)',
    },
    {
      type: 'section-header',
      text: 'رايح — Going',
      level: 2,
    },
    {
      type: 'paragraph',
      text: 'The verb راح (rāh — to go) gives us the active participle رايح (rayeh). Below are four ways it is used in real conversations.',
    },
    {
      type: 'example',
      caption: 'رايح (rayeh) — going / going to / have just gone',
      items: [
        {
          arabic: 'انت رايح فين؟ — انا رايح الشغل',
          transliteration: 'enta rayeh fein? — ana rayeh el-shughl',
          english: 'Where are you going? — I am going to work',
        },
        {
          arabic: 'انت رايح الشغل بكرة؟ لا، انا مش رايح بكرة بس هروح يوم الاتنين',
          transliteration: 'enta rayeh el-shughl bokra? la, ana mesh rayeh bokra bas harooh yom el-etnein',
          english: 'Are you going to work tomorrow? No, I am not going tomorrow but I will go on Monday',
        },
        {
          arabic: 'انا كنت رايح الشغل انهاردة ونسيت انه اجازة',
          transliteration: 'ana kont rayeh el-shughl enharḍa w-neseit eno agāza',
          english: 'I was going to go to work today and forgot that it is a day off',
        },
        {
          arabic: 'انا لسة رايح اسكندرية الاسبوع اللي فات',
          transliteration: 'ana lessa rayeh eskendereya el-osboʿ elli fāt',
          english: 'I have just been to Alexandria last week',
        },
      ],
    },
    {
      type: 'section-header',
      text: 'شايف — Seeing / Thinking',
      level: 2,
    },
    {
      type: 'paragraph',
      text: 'The verb شاف (shāf — to see / watch) gives شايف (shayef). Notice how it can mean both "currently seeing" and "having just seen", depending on context.',
    },
    {
      type: 'example',
      caption: 'شايف (shayef) — seeing now / I think / have just seen',
      items: [
        {
          arabic: 'انت شايفني؟ — انا شايفك، اه',
          transliteration: 'enta shayefni? — ana shayefak, ah',
          english: 'Do you see me (now)? — Yes, I see you',
        },
        {
          arabic: 'انا شايف انك مش لازم تروح الشغل انهاردة عشان انت عيان',
          transliteration: 'ana shayef ennak mesh lāzem trooh el-shughl enharḍa ʿashān enta ʿayyān',
          english: 'I think / see that you don\'t have to go to work today because you are sick',
        },
        {
          arabic: 'انا بشوف احمد كل يوم جمعة في الشغل',
          transliteration: 'ana bashoof ahmad koll yom gemʿa fi el-shughl',
          english: 'I see Ahmed every Friday after work',
        },
        {
          arabic: 'انت شوفت الـ post اللي احمد نزله؟ — اه، لسة شايف الـ post قبل الدرس',
          transliteration: 'enta shoft el-post elli ahmad nazzelo? — ah, lessa shayef el-post ʾabl el-dars',
          english: 'Did you see the post that Ahmed posted? — Yes, I\'ve just seen it right before the class',
        },
        {
          arabic: 'انا كنت شايف التلفون هنا بس مش موجود دلوقتي، راح فين؟',
          transliteration: 'ana kont shayef el-telefoon hena bas mesh mawgood delwaʾti, rāh fein?',
          english: 'I have seen the phone here but it is not here now, where did it go?',
        },
      ],
    },
    {
      type: 'section-header',
      text: 'لسة + Active Participle — "Have Just …"',
      level: 2,
    },
    {
      type: 'callout',
      title: 'لسة + اسم الفاعل',
      text: 'Putting لسة (lessa — still / just) before the active participle creates a "have just done" meaning. Example: انا لسة جايبة تفاح (ana lessa gayba tuffāh — I have just brought apples).',
    },
    {
      type: 'example',
      caption: 'لسة examples with various verbs',
      items: [
        {
          arabic: 'انا لسة شايفة فيلم على نيتفليكس بيتكلم عن عيلة مصرية',
          transliteration: 'ana lessa shayfa film ʿala netflix beyetkallim ʿan ʿeila masreya',
          english: 'I have just watched a film on Netflix about an Egyptian family',
        },
        {
          arabic: 'انا لسة جايبة تفاح انهاردة الصبح',
          transliteration: 'ana lessa gayba tuffāḥ enharḍa el-sobḥ',
          english: 'I have just brought apples this morning',
        },
        {
          arabic: 'انا لسة نايمة من ساعتين عشان كنت تعبانة اوي من الشغل',
          transliteration: 'ana lessa nayma men saʿtein ʿashān kont taʿbāna awi men el-shughl',
          english: 'I have just slept for two hours because I was very tired from work',
        },
        {
          arabic: 'انا لسة سايباها في المول من ساعة',
          transliteration: 'ana lessa saybaaha fi el-mall men sāʿa',
          english: 'I have just left her at the mall an hour ago',
        },
        {
          arabic: 'انا لسة صايمة عشان انا بعمل دايت',
          transliteration: 'ana lessa sayma ʿashān ana baʿmel dāyet',
          english: 'I am still fasting because I am on a diet',
        },
      ],
    },
    {
      type: 'section-header',
      text: 'Complete Reference Table',
      level: 2,
    },
    {
      type: 'paragraph',
      text: 'The table below covers all the verbs from the lesson. Verbs fall into a few patterns: hollow verbs (راح, شاف) add يا between the first and second root letter; sound three-radical verbs (فهم, سمع) take a فاعل shape; and Form II/V verbs (سافر, استنى) take a مفعل / مستفعل prefix.',
    },
    {
      type: 'vocab-table',
      caption: 'Active participle forms — Egyptian Arabic',
      rows: [
        // Hollow verbs (فاعل with long vowel)
        { arabic: 'راح', masculine: 'رايح', feminine: 'رايحة', plural: 'رايحين', transliteration: 'rayeh', english: 'go' },
        { arabic: 'شاف', masculine: 'شايف', feminine: 'شايفة', plural: 'شايفين', transliteration: 'shayef', english: 'see / watch' },
        { arabic: 'جاب', masculine: 'جايب', feminine: 'جايبة', plural: 'جايبين', transliteration: 'gayeb', english: 'bring / get' },
        { arabic: 'نام', masculine: 'نايم', feminine: 'نايمة', plural: 'نايمين', transliteration: 'nayem', english: 'sleep' },
        { arabic: 'ساق', masculine: 'سايق', feminine: 'سايقة', plural: 'سايقين', transliteration: 'sayeʾ', english: 'drive' },
        { arabic: 'ساب', masculine: 'سايب', feminine: 'سايبة', plural: 'سايبين', transliteration: 'sayeb', english: 'leave (behind)' },
        { arabic: 'تاه', masculine: 'تايه', feminine: 'تايهة', plural: 'تايهين', transliteration: 'tayeh', english: 'get lost' },
        { arabic: 'مات', masculine: 'مايت', feminine: 'مايتة', plural: 'مايتين', transliteration: 'mayet', english: 'die' },
        { arabic: 'عاش', masculine: 'عايش', feminine: 'عايشة', plural: 'عايشين', transliteration: 'ʿayesh', english: 'live' },
        { arabic: 'قال', masculine: 'قايل', feminine: 'قايلة', plural: 'قايلين', transliteration: 'ʾayel', english: 'say / tell' },
        { arabic: 'باع', masculine: 'بايع', feminine: 'بايعة', plural: 'بايعين', transliteration: 'bayeʿ', english: 'sell' },
        { arabic: 'صام', masculine: 'صايم', feminine: 'صايمة', plural: 'صايمين', transliteration: 'sayem', english: 'fast' },
        { arabic: 'خاف', masculine: 'خايف', feminine: 'خايفة', plural: 'خايفين', transliteration: 'khayef', english: 'be afraid' },
        { arabic: 'بان', masculine: 'باين', feminine: 'باينة', plural: 'باينين', transliteration: 'bayen', english: 'be obvious / show' },
        // Sound three-radical verbs (فاعل pattern)
        { arabic: 'فِهِم', masculine: 'فاهم', feminine: 'فاهمة', plural: 'فاهمين', transliteration: 'fāhem', english: 'understand' },
        { arabic: 'سِمِع', masculine: 'سامع', feminine: 'سامعة', plural: 'سامعين', transliteration: 'sāmeʿ', english: 'hear' },
        { arabic: 'عِرِف', masculine: 'عارف', feminine: 'عارفة', plural: 'عارفين', transliteration: 'ʿāref', english: 'know' },
        { arabic: 'وِقِف', masculine: 'واقف', feminine: 'واقفة', plural: 'واقفين', transliteration: 'wāʾef', english: 'stand' },
        { arabic: 'قَفَل', masculine: 'قافل', feminine: 'قافلة', plural: 'قافلين', transliteration: 'ʾāfel', english: 'close / lock' },
        { arabic: 'فَتَح', masculine: 'فاتح', feminine: 'فاتحة', plural: 'فاتحين', transliteration: 'fāteh', english: 'open' },
        { arabic: 'عَمَل', masculine: 'عامل', feminine: 'عاملة', plural: 'عاملين', transliteration: 'ʿāmel', english: 'do / make' },
        { arabic: 'رِجِع', masculine: 'راجع', feminine: 'راجعة', plural: 'راجعين', transliteration: 'rāgeʿ', english: 'go back / return' },
        { arabic: 'صِحِي', masculine: 'صاحي', feminine: 'صاحية', plural: 'صاحين', transliteration: 'sāhi', english: 'be awake' },
        { arabic: 'جي', masculine: 'جاي', feminine: 'جاية', plural: 'جاين', transliteration: 'gay', english: 'come' },
        // Stative / positional verbs
        { arabic: 'قَعَد', masculine: 'قاعد', feminine: 'قاعدة', plural: 'قاعدين', transliteration: 'ʾāʿed', english: 'sit / stay' },
        { arabic: 'مِسِك', masculine: 'ماسك', feminine: 'ماسكة', plural: 'ماسكين', transliteration: 'māsek', english: 'hold' },
        { arabic: 'حَط', masculine: 'حاطط', feminine: 'حاطة', plural: 'حاطين', transliteration: 'hātet', english: 'put / add' },
        { arabic: 'لِبِس', masculine: 'لابس', feminine: 'لابسة', plural: 'لابسين', transliteration: 'lābes', english: 'wear' },
        { arabic: 'رِكِب', masculine: 'راكب', feminine: 'راكبة', plural: 'راكبين', transliteration: 'rākeb', english: 'ride' },
        // Extended / Form II–X verbs (مفعل / متفعل)
        { arabic: 'سافَر', masculine: 'مسافر', feminine: 'مسافرة', plural: 'مسافرين', transliteration: 'mesāfer', english: 'travel' },
        { arabic: 'ذاكَر', masculine: 'مذاكر', feminine: 'مذاكرة', plural: 'مذاكرين', transliteration: 'mezāker', english: 'study / review' },
        { arabic: 'استنى', masculine: 'مستني', feminine: 'مستنية', plural: 'مستنيين', transliteration: 'mestanni', english: 'wait' },
        { arabic: 'خلص', masculine: 'مخلص', feminine: 'مخلصة', plural: 'مخلصين', transliteration: 'mekhallas', english: 'finish / be done' },
        { arabic: 'اشتغل', masculine: 'شغال', feminine: 'شغالة', plural: 'شغالين', transliteration: 'shaggāl', english: 'work' },
        { arabic: 'افتكر', masculine: 'فاكر', feminine: 'فاكرة', plural: 'فاكرين', transliteration: 'fāker', english: 'remember' },
        { arabic: 'اتأخر', masculine: 'متأخر', feminine: 'متأخرة', plural: 'متأخرين', transliteration: 'metaʾkhar', english: 'be late' },
        { arabic: 'اتضايق', masculine: 'مضايق', feminine: 'مضايقة', plural: 'مضايقين', transliteration: 'medāyeʾ', english: 'be annoyed' },
        { arabic: 'اتفق', masculine: 'متفق', feminine: 'متفقة', plural: 'متفقين', transliteration: 'mettafeʾ', english: 'agree' },
        { arabic: 'ركز', masculine: 'مركز', feminine: 'مركزة', plural: 'مركزين', transliteration: 'merakkez', english: 'focus' },
      ],
    },
    {
      type: 'section-header',
      text: 'How to Form the Active Participle',
      level: 2,
    },
    {
      type: 'callout',
      title: 'Pattern 1: Hollow verbs (ā in the root)',
      text: 'Insert ي between the first and last root consonants: راح → رايح, شاف → شايف, نام → نايم. For feminine, add ة: رايحة. For plural, add ين: رايحين.',
    },
    {
      type: 'callout',
      title: 'Pattern 2: Sound three-radical verbs',
      text: 'Insert ا after the first consonant: فهم → فاهم, سمع → سامع, رجع → راجع. Feminine: فاهمة. Plural: فاهمين.',
    },
    {
      type: 'callout',
      title: 'Pattern 3: Extended verbs (Form II–X)',
      text: 'Most take a مِـ prefix on the verb stem: سافر → مسافر, استنى → مستني, اتأخر → متأخر. Some have irregular forms: اشتغل → شغال.',
    },
    {
      type: 'section-header',
      text: 'Practice Dialogues',
      level: 2,
    },
    {
      type: 'dialogue',
      title: 'Dialogue 1 — Going to the café (رايح)',
      exchanges: [
        {
          speaker: 'A',
          arabic: 'انت رايح فين دلوقتي؟ انا رايح الكافيه افطر. عايزة تيجي معايا؟',
          transliteration: 'enta rayeh fein delwaʾti? ana rayeh el-kafeh aftir. ʿayza tigi maʿaya?',
          english: 'Where are you going now? I am going to the cafe to eat breakfast. Do you want to come with me?',
        },
        {
          speaker: 'B',
          arabic: 'لا، مش هاجي معاك، بس ينفع تشتريلي واحد قهوة؟',
          transliteration: 'la, mesh hāgi maʿāk, bas yenfeʿ teshterili wāhed ʾahwa?',
          english: 'No, I won\'t come with you, but can you buy me one coffee?',
        },
        {
          speaker: 'A',
          arabic: 'اكيد! بس هاخد وقت طويل لحد ما ارجع عشان هاكل هناك، عادي ولا ايه؟',
          transliteration: 'akid! bas hākhod waʾt tawil lehadde ma argeʿ ʿashān hākol henāk, ʿādi walla eh?',
          english: 'Sure! But I will take a long time until I come back because I will eat there. Is that okay?',
        },
        {
          speaker: 'B',
          arabic: 'ماشي، هستناك',
          transliteration: 'māshi, hastannāk',
          english: 'Okay, I will wait for you.',
        },
      ],
    },
    {
      type: 'dialogue',
      title: 'Dialogue 2 — Coming soon (جاي)',
      exchanges: [
        {
          speaker: 'A',
          arabic: 'انت في مصر دلوقتي؟',
          transliteration: 'enta fi masr delwaʾti?',
          english: 'Are you in Egypt now?',
        },
        {
          speaker: 'B',
          arabic: 'لا، بس انا جاي قريب',
          transliteration: 'la, bas ana gay ʾorayeb',
          english: 'No, but I am coming soon',
        },
        {
          speaker: 'A',
          arabic: 'انت جاي الاسبوع ده؟',
          transliteration: 'enta gay el-osboʿ dah?',
          english: 'Are you coming this week?',
        },
        {
          speaker: 'B',
          arabic: 'لا، رايح استراليا الاول وبعدين هرجع سان فرانسيسكو، هقعد هناك شوية وبعدين هسافر مصر',
          transliteration: 'la, rayeh ostrālya el-awwal w-baʿdein hargeʿ San Francisco, haʾʿod henāk shwayya w-baʿdein hasāfer masr',
          english: 'No, I am going to Australia first and then I will come back to San Francisco, will stay there for a while then travel to Egypt',
        },
      ],
    },
    {
      type: 'dialogue',
      title: 'Dialogue 3 — Hearing and understanding (سامع / فاهم)',
      exchanges: [
        {
          speaker: 'A',
          arabic: 'انتي سامعاني كويس؟',
          transliteration: 'enti sāmʿāni kwayyes?',
          english: 'Do you hear me well?',
        },
        {
          speaker: 'B',
          arabic: 'انا مش سامعك، تقريباً الميكروفون بتاعك مش شغال',
          transliteration: 'ana mesh sāmʿak, taʾriban el-microphone betāʿak mesh shaggāl',
          english: 'I don\'t hear you, I think your microphone isn\'t working',
        },
        {
          speaker: 'A',
          arabic: 'انت فاهمني؟',
          transliteration: 'enta fāhemni?',
          english: 'Do you understand me?',
        },
        {
          speaker: 'B',
          arabic: 'لا، انا مش فاهم انتي بتقولي ايه. قولي تاني',
          transliteration: 'la, ana mesh fāhem enti betʾolili eh. ʾolili tāni',
          english: 'No, I don\'t understand what you are saying. Say it one more time',
        },
      ],
    },
    {
      type: 'dialogue',
      title: 'Dialogue 4 — Knowing the way (عارف)',
      exchanges: [
        {
          speaker: 'A',
          arabic: 'رايح فين؟',
          transliteration: 'rayeh fein?',
          english: 'Where are you going?',
        },
        {
          speaker: 'B',
          arabic: 'انا رايح المعادي، عارف الطريق؟',
          transliteration: 'ana rayeh el-maʿādi, ʿāref el-tarīʾ?',
          english: 'I am going to Maadi, do you know the way / directions?',
        },
        {
          speaker: 'A',
          arabic: 'عارف جوش ازاي؟',
          transliteration: 'ʿāref Josh izzay?',
          english: 'How do you know Josh?',
        },
        {
          speaker: 'B',
          arabic: 'انا عارفه من الشغل، احنا بنشتغل مع بعض في نفس الشركة',
          transliteration: 'ana ʿārfo men el-shughl, ehna beneshtaghal maʿa baʿḍ fi nafs el-sharika',
          english: 'I know him from work, we work together at the same company',
        },
      ],
    },
  ],
};
