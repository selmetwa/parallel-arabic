import type { Dialect } from '$lib/types';

export interface ScenarioLine {
  speaker: 'student' | 'other';
  arabic: string;
  transliteration: string;
  english: string;
}

export interface ScenarioDialog {
  otherRoleEnglish: string;
  lines: ScenarioLine[];
}

export interface TutorScenario {
  id: string;
  title: string;
  emoji: string;
  description: string;
  level: 'beginner';
  dialogs: Partial<Record<Dialect, ScenarioDialog>>;
}

export const TUTOR_SCENARIOS: TutorScenario[] = [
  {
    id: 'introducing-yourself',
    title: 'Introducing Yourself',
    emoji: '👋',
    description: 'Share your name and where you are from.',
    level: 'beginner',
    dialogs: {
      'levantine': {
        otherRoleEnglish: 'New friend',
        lines: [
          { speaker: 'student', arabic: 'مرحبا، اسمي سارة.', transliteration: 'marhaba, ismi Sara.', english: "Hi, my name is Sara." },
          { speaker: 'other', arabic: 'أهلًا سارة، تشرفنا. أنا أحمد.', transliteration: 'ahlan Sara, tsharrafna. ana Ahmad.', english: "Hi Sara, nice to meet you. I'm Ahmad." },
          { speaker: 'student', arabic: 'أنا من كندا. وانت من وين؟', transliteration: 'ana min Canada. winta min wein?', english: "I'm from Canada. Where are you from?" },
          { speaker: 'other', arabic: 'أنا من لبنان، من بيروت.', transliteration: 'ana min Lubnan, min Beirut.', english: "I'm from Lebanon, from Beirut." }
        ]
      },
      'egyptian-arabic': {
        otherRoleEnglish: 'New friend',
        lines: [
          { speaker: 'student', arabic: 'أهلاً، أنا اسمي سارة.', transliteration: 'ahlan, ana ismi Sara.', english: "Hi, my name is Sara." },
          { speaker: 'other', arabic: 'أهلاً بيكي يا سارة. أنا أحمد.', transliteration: 'ahlan biki ya Sara. ana Ahmad.', english: "Hi Sara. I'm Ahmad." },
          { speaker: 'student', arabic: 'أنا من كندا. انت منين؟', transliteration: 'ana min Canada. inta mineen?', english: "I'm from Canada. Where are you from?" },
          { speaker: 'other', arabic: 'أنا من مصر، من القاهرة.', transliteration: 'ana min Masr, min al-Qahira.', english: "I'm from Egypt, from Cairo." }
        ]
      },
      'fusha': {
        otherRoleEnglish: 'New friend',
        lines: [
          { speaker: 'student', arabic: 'مرحبًا، اسمي سارة.', transliteration: 'marhaban, ismi Sara.', english: "Hello, my name is Sara." },
          { speaker: 'other', arabic: 'أهلًا بكِ يا سارة. أنا أحمد.', transliteration: 'ahlan biki ya Sara. ana Ahmad.', english: "Hello Sara. I am Ahmad." },
          { speaker: 'student', arabic: 'أنا من كندا. من أين أنت؟', transliteration: 'ana min Canada. min ayna anta?', english: "I am from Canada. Where are you from?" },
          { speaker: 'other', arabic: 'أنا من الأردن.', transliteration: 'ana min al-Urdun.', english: "I am from Jordan." }
        ]
      }
    }
  },
  {
    id: 'greetings',
    title: 'Greetings & Goodbyes',
    emoji: '🤝',
    description: 'Say hello, ask how someone is, and say goodbye.',
    level: 'beginner',
    dialogs: {
      'levantine': {
        otherRoleEnglish: 'A friend',
        lines: [
          { speaker: 'student', arabic: 'مرحبا! كيفك؟', transliteration: 'marhaba! kifak?', english: 'Hi! How are you?' },
          { speaker: 'other', arabic: 'الحمد لله، منيح. وانت؟', transliteration: 'al-hamdulillah, mneeh. winta?', english: "Thank God, I'm good. And you?" },
          { speaker: 'student', arabic: 'أنا كمان منيح، شكرا.', transliteration: 'ana kaman mneeh, shukran.', english: "I'm also good, thanks." },
          { speaker: 'other', arabic: 'يلا، باي! بشوفك بكرا.', transliteration: 'yalla, bye! bshufak bukra.', english: 'Okay, bye! See you tomorrow.' }
        ]
      },
      'egyptian-arabic': {
        otherRoleEnglish: 'A friend',
        lines: [
          { speaker: 'student', arabic: 'أهلاً! إزيك؟', transliteration: 'ahlan! izzayyak?', english: 'Hi! How are you?' },
          { speaker: 'other', arabic: 'الحمد لله، كويس. وانت؟', transliteration: 'al-hamdulillah, kwayyis. winta?', english: "Thank God, I'm good. And you?" },
          { speaker: 'student', arabic: 'أنا كمان كويس، شكراً.', transliteration: 'ana kaman kwayyis, shukran.', english: "I'm also good, thanks." },
          { speaker: 'other', arabic: 'تمام، مع السلامة!', transliteration: 'tamam, ma3a as-salama!', english: 'Okay, goodbye!' }
        ]
      },
      'fusha': {
        otherRoleEnglish: 'A friend',
        lines: [
          { speaker: 'student', arabic: 'السلام عليكم. كيف حالك؟', transliteration: 'as-salamu alaykum. kayfa haluk?', english: 'Peace be upon you. How are you?' },
          { speaker: 'other', arabic: 'وعليكم السلام. أنا بخير، الحمد لله.', transliteration: 'wa alaykum as-salam. ana bikhair, al-hamdulillah.', english: "And upon you peace. I am well, thanks be to God." },
          { speaker: 'student', arabic: 'الحمد لله. تشرفنا.', transliteration: 'al-hamdulillah. tasharrafna.', english: 'Thanks be to God. Nice to meet you.' },
          { speaker: 'other', arabic: 'مع السلامة.', transliteration: 'ma3a as-salama.', english: 'Goodbye.' }
        ]
      }
    }
  },
  {
    id: 'ordering-coffee',
    title: 'Ordering at a Café',
    emoji: '☕',
    description: 'Order coffee or tea and pay the bill.',
    level: 'beginner',
    dialogs: {
      'levantine': {
        otherRoleEnglish: 'Café server',
        lines: [
          { speaker: 'other', arabic: 'أهلين، شو بتحب تشرب؟', transliteration: 'ahlein, shu bithibb tishrab?', english: 'Hi, what would you like to drink?' },
          { speaker: 'student', arabic: 'بدي قهوة من فضلك.', transliteration: 'biddi ahweh min fadlak.', english: "I'd like a coffee, please." },
          { speaker: 'other', arabic: 'مع سكر؟', transliteration: 'ma3 sukkar?', english: 'With sugar?' },
          { speaker: 'student', arabic: 'بدون سكر، شكراً.', transliteration: 'bidoon sukkar, shukran.', english: 'No sugar, thanks.' }
        ]
      },
      'egyptian-arabic': {
        otherRoleEnglish: 'Café server',
        lines: [
          { speaker: 'other', arabic: 'اتفضل، تحب تشرب إيه؟', transliteration: 'itfaddal, tihibb tishrab eih?', english: 'Welcome, what would you like to drink?' },
          { speaker: 'student', arabic: 'عايز قهوة من فضلك.', transliteration: '3ayiz ahwa min fadlak.', english: 'I want a coffee, please.' },
          { speaker: 'other', arabic: 'سكر؟', transliteration: 'sukkar?', english: 'Sugar?' },
          { speaker: 'student', arabic: 'سكر قليل، شكراً.', transliteration: 'sukkar 2alil, shukran.', english: 'A little sugar, thanks.' }
        ]
      },
      'fusha': {
        otherRoleEnglish: 'Café server',
        lines: [
          { speaker: 'other', arabic: 'مرحبًا، ماذا تودّ أن تشرب؟', transliteration: 'marhaban, matha tawadd an tashrab?', english: 'Hello, what would you like to drink?' },
          { speaker: 'student', arabic: 'أريد قهوة من فضلك.', transliteration: 'ureed qahwa min fadlik.', english: 'I would like a coffee, please.' },
          { speaker: 'other', arabic: 'مع السكر؟', transliteration: 'ma3a as-sukkar?', english: 'With sugar?' },
          { speaker: 'student', arabic: 'بدون سكر، شكرًا لك.', transliteration: 'bidoon sukkar, shukran lak.', english: 'Without sugar, thank you.' }
        ]
      }
    }
  },
  {
    id: 'asking-directions',
    title: 'Asking for Directions',
    emoji: '🗺️',
    description: 'Ask how to get somewhere on the street.',
    level: 'beginner',
    dialogs: {
      'levantine': {
        otherRoleEnglish: 'Passerby',
        lines: [
          { speaker: 'student', arabic: 'عفواً، وين المتحف؟', transliteration: '3afwan, wein al-mathaf?', english: 'Excuse me, where is the museum?' },
          { speaker: 'other', arabic: 'دغري، وبعدين لف يمين.', transliteration: 'dughri, w-ba3dein liff yameen.', english: 'Straight ahead, then turn right.' },
          { speaker: 'student', arabic: 'بعيد عن هون؟', transliteration: 'b3eed 3an hon?', english: 'Is it far from here?' },
          { speaker: 'other', arabic: 'لا، قريب. خمس دقايق مشي.', transliteration: 'la, areeb. khamis daqayiq mashi.', english: "No, it's close. Five minutes walking." }
        ]
      },
      'egyptian-arabic': {
        otherRoleEnglish: 'Passerby',
        lines: [
          { speaker: 'student', arabic: 'لو سمحت، فين المتحف؟', transliteration: 'law samaht, fein al-mathaf?', english: 'Excuse me, where is the museum?' },
          { speaker: 'other', arabic: 'على طول، وبعدين شمال.', transliteration: '3ala tool, w-ba3dein shimal.', english: 'Straight ahead, then left.' },
          { speaker: 'student', arabic: 'بعيد من هنا؟', transliteration: 'b3eed min hena?', english: 'Is it far from here?' },
          { speaker: 'other', arabic: 'لأ، قريب. عشر دقايق.', transliteration: 'la2, urayyib. 3ashar daqayi2.', english: "No, it's close. Ten minutes." }
        ]
      },
      'fusha': {
        otherRoleEnglish: 'Passerby',
        lines: [
          { speaker: 'student', arabic: 'عفوًا، أين المتحف؟', transliteration: '3afwan, ayna al-math.haf?', english: 'Excuse me, where is the museum?' },
          { speaker: 'other', arabic: 'إلى الأمام مباشرة ثم انعطف يمينًا.', transliteration: 'ila al-amam mubasharatan thumma in3atif yameenan.', english: 'Straight ahead, then turn right.' },
          { speaker: 'student', arabic: 'هل هو بعيد من هنا؟', transliteration: 'hal huwa ba3eed min huna?', english: 'Is it far from here?' },
          { speaker: 'other', arabic: 'لا، قريب. حوالي عشر دقائق.', transliteration: 'la, qareeb. hawali 3ashr daqa2iq.', english: "No, it's close. About ten minutes." }
        ]
      }
    }
  },
  {
    id: 'ordering-taxi',
    title: 'Ordering a Taxi',
    emoji: '🚖',
    description: 'Tell the driver where to go and ask the price.',
    level: 'beginner',
    dialogs: {
      'levantine': {
        otherRoleEnglish: 'Taxi driver',
        lines: [
          { speaker: 'student', arabic: 'مرحبا، بدي أروح ع المطار.', transliteration: 'marhaba, biddi aruh 3al-mataar.', english: 'Hi, I want to go to the airport.' },
          { speaker: 'other', arabic: 'تفضل. الأجرة عشرين دولار.', transliteration: 'tfaddal. al-ujra 3ishreen dolar.', english: 'Get in. The fare is twenty dollars.' },
          { speaker: 'student', arabic: 'كم بياخد الطريق؟', transliteration: 'kam byakhud at-tareeq?', english: 'How long does the trip take?' },
          { speaker: 'other', arabic: 'حوالي نص ساعة.', transliteration: 'hawali nuss sa3a.', english: 'About half an hour.' }
        ]
      },
      'egyptian-arabic': {
        otherRoleEnglish: 'Taxi driver',
        lines: [
          { speaker: 'student', arabic: 'لو سمحت، أنا رايح المطار.', transliteration: 'law samaht, ana rayih al-mataar.', english: 'Excuse me, I am going to the airport.' },
          { speaker: 'other', arabic: 'اتفضل. الأجرة مية جنيه.', transliteration: 'itfaddal. al-ugra meet ginih.', english: 'Get in. The fare is one hundred pounds.' },
          { speaker: 'student', arabic: 'الطريق بياخد قد إيه؟', transliteration: 'at-taree2 byakhud add eih?', english: 'How long does the trip take?' },
          { speaker: 'other', arabic: 'حوالي تلت ساعة.', transliteration: 'hawali tilt sa3a.', english: 'About forty minutes.' }
        ]
      },
      'fusha': {
        otherRoleEnglish: 'Taxi driver',
        lines: [
          { speaker: 'student', arabic: 'مرحبًا، أريد الذهاب إلى المطار.', transliteration: 'marhaban, ureed adh-dhahab ila al-mataar.', english: 'Hello, I would like to go to the airport.' },
          { speaker: 'other', arabic: 'تفضل. الأجرة عشرون دولارًا.', transliteration: 'tafaddal. al-ujra 3ishroon doolaran.', english: 'Please get in. The fare is twenty dollars.' },
          { speaker: 'student', arabic: 'كم تستغرق الرحلة؟', transliteration: 'kam tastaghriq ar-rihla?', english: 'How long does the trip take?' },
          { speaker: 'other', arabic: 'حوالي نصف ساعة.', transliteration: 'hawali nisf sa3a.', english: 'About half an hour.' }
        ]
      }
    }
  },
  {
    id: 'asking-price',
    title: 'Asking About Prices',
    emoji: '💰',
    description: 'Ask how much something costs at a shop.',
    level: 'beginner',
    dialogs: {
      'levantine': {
        otherRoleEnglish: 'Shopkeeper',
        lines: [
          { speaker: 'student', arabic: 'قديش هاد؟', transliteration: 'addeesh had?', english: 'How much is this?' },
          { speaker: 'other', arabic: 'بعشر دولار.', transliteration: 'b3ashar dolar.', english: 'Ten dollars.' },
          { speaker: 'student', arabic: 'غالي شوي. ممكن أقل؟', transliteration: 'ghali shway. mumkin a2all?', english: "It's a bit expensive. Can it be less?" },
          { speaker: 'other', arabic: 'تمانية، آخر سعر.', transliteration: 'tmaneh, akhir si3r.', english: 'Eight, final price.' }
        ]
      },
      'egyptian-arabic': {
        otherRoleEnglish: 'Shopkeeper',
        lines: [
          { speaker: 'student', arabic: 'بكام ده؟', transliteration: 'bikam da?', english: 'How much is this?' },
          { speaker: 'other', arabic: 'بخمسين جنيه.', transliteration: 'bikhamseen ginih.', english: 'Fifty pounds.' },
          { speaker: 'student', arabic: 'غالي شوية. ممكن أقل؟', transliteration: 'ghali shwayya. mumkin a2all?', english: "It's a bit expensive. Can it be less?" },
          { speaker: 'other', arabic: 'أربعين، آخر كلام.', transliteration: 'arba3een, akhir kalam.', english: 'Forty, final word.' }
        ]
      },
      'fusha': {
        otherRoleEnglish: 'Shopkeeper',
        lines: [
          { speaker: 'student', arabic: 'كم ثمن هذا؟', transliteration: 'kam thaman hadha?', english: 'How much does this cost?' },
          { speaker: 'other', arabic: 'بعشرة دولارات.', transliteration: 'bi3ashrat doolaraat.', english: 'Ten dollars.' },
          { speaker: 'student', arabic: 'غالٍ قليلًا. هل يمكن أن يكون أقل؟', transliteration: 'ghaalin qaleelan. hal yumkin an yakoon aqall?', english: 'A bit expensive. Could it be less?' },
          { speaker: 'other', arabic: 'ثمانية، السعر النهائي.', transliteration: 'thamaaniya, as-si3r an-niha2i.', english: 'Eight, final price.' }
        ]
      }
    }
  },
  {
    id: 'asking-for-help',
    title: 'Asking for Help',
    emoji: '🆘',
    description: "Say you don't understand and ask for help.",
    level: 'beginner',
    dialogs: {
      'levantine': {
        otherRoleEnglish: 'A helpful local',
        lines: [
          { speaker: 'student', arabic: 'عفواً، بقدر تساعدني؟', transliteration: '3afwan, ba2dar tsa3idni?', english: 'Excuse me, can you help me?' },
          { speaker: 'other', arabic: 'أكيد، شو بدك؟', transliteration: 'akeed, shu biddak?', english: 'Sure, what do you need?' },
          { speaker: 'student', arabic: 'أنا تايه. ما بفهم منيح.', transliteration: 'ana tayih. ma bifham mneeh.', english: "I'm lost. I don't understand well." },
          { speaker: 'other', arabic: 'لا تقلق، بساعدك.', transliteration: 'la tiqlaq, bisa3dak.', english: "Don't worry, I'll help you." }
        ]
      },
      'egyptian-arabic': {
        otherRoleEnglish: 'A helpful local',
        lines: [
          { speaker: 'student', arabic: 'لو سمحت، ممكن تساعدني؟', transliteration: 'law samaht, mumkin tisa3idni?', english: 'Excuse me, can you help me?' },
          { speaker: 'other', arabic: 'أكيد، عايز إيه؟', transliteration: 'akeed, 3ayiz eih?', english: 'Sure, what do you need?' },
          { speaker: 'student', arabic: 'أنا تايه. مش فاهم كويس.', transliteration: 'ana tayih. mish fahim kwayyis.', english: "I'm lost. I don't understand well." },
          { speaker: 'other', arabic: 'متقلقش، أنا هساعدك.', transliteration: 'matq2alaq.sh, ana hasa3dak.', english: "Don't worry, I'll help you." }
        ]
      },
      'fusha': {
        otherRoleEnglish: 'A helpful local',
        lines: [
          { speaker: 'student', arabic: 'عفوًا، هل يمكنك أن تساعدني؟', transliteration: '3afwan, hal yumkinuka an tusa3idani?', english: 'Excuse me, can you help me?' },
          { speaker: 'other', arabic: 'بالتأكيد، ماذا تحتاج؟', transliteration: 'bit-ta2keed, matha tahtaaj?', english: 'Of course, what do you need?' },
          { speaker: 'student', arabic: 'أنا تائه. لا أفهم جيدًا.', transliteration: 'ana ta2ih. la afham jayyidan.', english: "I am lost. I don't understand well." },
          { speaker: 'other', arabic: 'لا تقلق، سأساعدك.', transliteration: 'la taqlaq, sa-usa3iduk.', english: "Don't worry, I will help you." }
        ]
      }
    }
  },
  {
    id: 'talking-about-family',
    title: 'Talking About Family',
    emoji: '👨‍👩‍👧',
    description: 'Talk about your family — brothers, sisters, parents.',
    level: 'beginner',
    dialogs: {
      'levantine': {
        otherRoleEnglish: 'A friend',
        lines: [
          { speaker: 'other', arabic: 'عندك إخوة؟', transliteration: '3indak ikhweh?', english: 'Do you have siblings?' },
          { speaker: 'student', arabic: 'عندي أخ وأخت.', transliteration: '3indi akh w-ikht.', english: 'I have one brother and one sister.' },
          { speaker: 'other', arabic: 'وين ساكنين؟', transliteration: 'wein sakneen?', english: 'Where do they live?' },
          { speaker: 'student', arabic: 'ساكنين مع أهلي في كندا.', transliteration: 'sakneen ma3 ahli fi Canada.', english: 'They live with my parents in Canada.' }
        ]
      },
      'egyptian-arabic': {
        otherRoleEnglish: 'A friend',
        lines: [
          { speaker: 'other', arabic: 'عندك إخوات؟', transliteration: '3andak ikhwaat?', english: 'Do you have siblings?' },
          { speaker: 'student', arabic: 'عندي أخ وأخت.', transliteration: '3andi akh wi ukht.', english: 'I have a brother and a sister.' },
          { speaker: 'other', arabic: 'ساكنين فين؟', transliteration: 'sakneen fein?', english: 'Where do they live?' },
          { speaker: 'student', arabic: 'ساكنين مع أهلي في كندا.', transliteration: 'sakneen ma3 ahli fi Canada.', english: 'They live with my parents in Canada.' }
        ]
      },
      'fusha': {
        otherRoleEnglish: 'A friend',
        lines: [
          { speaker: 'other', arabic: 'هل لديك إخوة؟', transliteration: 'hal ladayka ikhwa?', english: 'Do you have siblings?' },
          { speaker: 'student', arabic: 'لديّ أخ وأخت.', transliteration: 'ladayya akh wa-ukht.', english: 'I have a brother and a sister.' },
          { speaker: 'other', arabic: 'أين يعيشون؟', transliteration: 'ayna ya3eeshoon?', english: 'Where do they live?' },
          { speaker: 'student', arabic: 'يعيشون مع والديّ في كندا.', transliteration: 'ya3eeshoon ma3a walidayya fi Canada.', english: 'They live with my parents in Canada.' }
        ]
      }
    }
  },
  {
    id: 'at-the-restaurant',
    title: 'At the Restaurant',
    emoji: '🍽️',
    description: 'Order food and ask for the bill.',
    level: 'beginner',
    dialogs: {
      'levantine': {
        otherRoleEnglish: 'Waiter',
        lines: [
          { speaker: 'other', arabic: 'شو بتحب تاكل اليوم؟', transliteration: 'shu bithibb takul al-yom?', english: 'What would you like to eat today?' },
          { speaker: 'student', arabic: 'بدي شاورما دجاج، من فضلك.', transliteration: 'biddi shawarma djaj, min fadlak.', english: "I'd like chicken shawarma, please." },
          { speaker: 'other', arabic: 'تحب تشرب شي؟', transliteration: 'tihibb tishrab shi?', english: 'Would you like to drink something?' },
          { speaker: 'student', arabic: 'كاسة مي، شكراً. والحساب لو سمحت.', transliteration: 'kaaset mayy, shukran. wal-hsab law samaht.', english: 'A glass of water, thanks. And the bill, please.' }
        ]
      },
      'egyptian-arabic': {
        otherRoleEnglish: 'Waiter',
        lines: [
          { speaker: 'other', arabic: 'تحب تاكل إيه النهارده؟', transliteration: 'tihibb takul eih in-naharda?', english: 'What would you like to eat today?' },
          { speaker: 'student', arabic: 'عايز كشري من فضلك.', transliteration: '3ayiz kushari min fadlak.', english: 'I want koshari, please.' },
          { speaker: 'other', arabic: 'تشرب إيه؟', transliteration: 'tishrab eih?', english: 'What would you like to drink?' },
          { speaker: 'student', arabic: 'مية، شكراً. والحساب لو سمحت.', transliteration: 'mayya, shukran. wal-hisab law samaht.', english: 'Water, thanks. And the bill, please.' }
        ]
      },
      'fusha': {
        otherRoleEnglish: 'Waiter',
        lines: [
          { speaker: 'other', arabic: 'ماذا تودّ أن تأكل اليوم؟', transliteration: 'matha tawadd an ta2kul al-yawm?', english: 'What would you like to eat today?' },
          { speaker: 'student', arabic: 'أريد دجاجًا مشويًا من فضلك.', transliteration: 'ureed dajaajan mashwiyyan min fadlik.', english: 'I would like grilled chicken, please.' },
          { speaker: 'other', arabic: 'هل تودّ أن تشرب شيئًا؟', transliteration: 'hal tawadd an tashrab shay2an?', english: 'Would you like something to drink?' },
          { speaker: 'student', arabic: 'كوب ماء من فضلك. والحساب لاحقًا.', transliteration: 'koob ma2 min fadlik. wal-hisaab lahiqan.', english: 'A glass of water, please. And the bill later.' }
        ]
      }
    }
  },
  {
    id: 'telling-time',
    title: 'Asking the Time',
    emoji: '🕒',
    description: 'Ask what time it is and answer about your day.',
    level: 'beginner',
    dialogs: {
      'levantine': {
        otherRoleEnglish: 'A friend',
        lines: [
          { speaker: 'student', arabic: 'قديش الساعة هلق؟', transliteration: 'addeesh as-sa3a halla2?', english: 'What time is it now?' },
          { speaker: 'other', arabic: 'الساعة تلاتة وربع.', transliteration: 'as-sa3a tlateh w-rub3.', english: "It's three fifteen." },
          { speaker: 'student', arabic: 'يلا، لازم أروح. عندي شغل.', transliteration: 'yalla, lazim aruh. 3indi shughl.', english: 'Okay, I have to go. I have work.' },
          { speaker: 'other', arabic: 'تمام، بشوفك بعدين.', transliteration: 'tamam, bshufak ba3dein.', english: 'Okay, see you later.' }
        ]
      },
      'egyptian-arabic': {
        otherRoleEnglish: 'A friend',
        lines: [
          { speaker: 'student', arabic: 'الساعة كام دلوقتي؟', transliteration: 'as-sa3a kam dilwa2ti?', english: 'What time is it now?' },
          { speaker: 'other', arabic: 'الساعة تلاتة وربع.', transliteration: 'as-sa3a talata w-rub3.', english: "It's three fifteen." },
          { speaker: 'student', arabic: 'لازم أمشي، عندي شغل.', transliteration: 'lazim amshi, 3andi shoghl.', english: 'I have to go, I have work.' },
          { speaker: 'other', arabic: 'تمام، أشوفك بعدين.', transliteration: 'tamam, ashufak ba3dein.', english: 'Okay, see you later.' }
        ]
      },
      'fusha': {
        otherRoleEnglish: 'A friend',
        lines: [
          { speaker: 'student', arabic: 'كم الساعة الآن؟', transliteration: 'kam as-sa3a al-2aan?', english: 'What time is it now?' },
          { speaker: 'other', arabic: 'الساعة الثالثة والربع.', transliteration: 'as-sa3a ath-thalitha war-rub3.', english: "It's three fifteen." },
          { speaker: 'student', arabic: 'يجب أن أذهب. لديّ عمل.', transliteration: 'yajib an adhhab. ladayya 3amal.', english: 'I must go. I have work.' },
          { speaker: 'other', arabic: 'حسنًا، إلى اللقاء.', transliteration: 'hasanan, ila al-liqaa2.', english: 'Okay, goodbye.' }
        ]
      }
    }
  }
];
