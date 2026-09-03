/**
 * Content for /egyptian-arabic/pronunciation.
 *
 * Kept out of the component for the same reason `dialect-landing.ts` is: the
 * route needs to hand the sound list to the practice round and the layout needs
 * the FAQ entries for FAQPage structured data.
 */

export interface SoundExample {
	arabic: string;
	transliteration: string;
	english: string;
	/** How a Fusha-trained speaker would say it, when that differs. */
	fusha?: string;
}

export interface SoundSection {
	id: string;
	letter: string;
	heading: string;
	body: string;
	examples: SoundExample[];
}

export const PRONUNCIATION_INTRO =
	'Most Arabic courses teach the sound system of Modern Standard Arabic, then hand you a dialect that does not use it. Egyptian Arabic changes four letters outright and softens several more, and those changes are the whole difference between reading Arabic and sounding like you are from Cairo. Everything below is the spoken form — the spelling stays the same.';

export const SOUND_SECTIONS: SoundSection[] = [
	{
		id: 'geem',
		letter: 'ج',
		heading: 'ج is a hard g',
		body: 'This is the single fastest way to identify an Egyptian speaker, and it holds across the entire vocabulary with almost no exceptions. Everywhere else in the Arab world ج is the j of "jam"; in Egypt it is the g of "go". If you learned Arabic anywhere else, this one substitution will do more for your accent than anything else on this page.',
		examples: [
			{ arabic: 'جميل', transliteration: 'gamiil', english: 'beautiful', fusha: 'jamiil' },
			{ arabic: 'جوز', transliteration: 'gooz', english: 'husband', fusha: 'jawz' },
			{ arabic: 'راجل', transliteration: 'raagil', english: 'man', fusha: 'rajul' },
			{ arabic: 'جبنة', transliteration: 'gibna', english: 'cheese', fusha: 'jubna' }
		]
	},
	{
		id: 'qaf',
		letter: 'ق',
		heading: 'ق disappears into a glottal stop',
		body: 'The q sound drops to the catch in the middle of "uh-oh". It is still written, and you still need to recognise it on the page, but in ordinary Cairo speech it is not pronounced as a q. The exceptions are worth knowing: religious vocabulary, formal or literary words, and a handful of everyday words keep the q, and rural and Upper Egyptian speech often turns it into a g instead.',
		examples: [
			{ arabic: 'قهوة', transliteration: "'ahwa", english: 'coffee', fusha: 'qahwa' },
			{ arabic: 'قلب', transliteration: "'alb", english: 'heart', fusha: 'qalb' },
			{ arabic: 'قمر', transliteration: "'amar", english: 'moon', fusha: 'qamar' },
			{ arabic: 'قريب', transliteration: "'urayyib", english: 'close by', fusha: 'qariib' }
		]
	},
	{
		id: 'th',
		letter: 'ث ذ ظ',
		heading: 'The "th" letters are not pronounced "th"',
		body: 'ث collapses to t (or s in borrowed and formal words), ذ to d (or z), and ظ to a heavy z. English speakers usually find this a relief, since the Fusha versions are the two sounds in "thin" and "this". The trap is that the same letter goes two ways depending on the word, and the split follows whether the word is everyday or learned rather than any rule you can apply on sight.',
		examples: [
			{ arabic: 'تلاتة', transliteration: 'talaata', english: 'three', fusha: 'thalaatha' },
			{ arabic: 'ده', transliteration: 'da', english: 'this', fusha: 'haadha' },
			{ arabic: 'دهب', transliteration: 'dahab', english: 'gold', fusha: 'dhahab' },
			{ arabic: 'سقافة', transliteration: "sa'aafa", english: 'culture', fusha: 'thaqaafa' }
		]
	},
	{
		id: 'throat',
		letter: 'ع ح',
		heading: 'ع and ح are the two that take practice',
		body: 'These are the letters with no English equivalent, and they are the ones worth spending real time on. ح is a hard whisper from the throat, like breathing hard on a cold window with the throat tightened. ع is made lower still, by squeezing the throat almost closed and voicing through it. Neither is a vowel and neither can be skipped: عم ("paternal uncle") and أم ("mother") differ only by ع, and حبيبي loses its meaning entirely without the ح.',
		examples: [
			{ arabic: 'عربي', transliteration: '3arabi', english: 'Arabic' },
			{ arabic: 'حبيبي', transliteration: '7abiibi', english: 'my dear' },
			{ arabic: 'عشان', transliteration: '3ashaan', english: 'because' },
			{ arabic: 'حاجة', transliteration: '7aaga', english: 'thing' }
		]
	},
	{
		id: 'emphatic',
		letter: 'ص ض ط ظ',
		heading: 'The heavy letters darken the vowels around them',
		body: 'ص ض ط ظ are pronounced with the back of the tongue raised, and the effect spreads to the neighbouring vowels. The practical consequence is that you cannot learn them as "s with attitude" — what your ear actually picks up is the vowel changing colour. سيف (sayf, "sword") and صيف (Sayf, "summer") are separated less by the consonant than by how the vowel sounds after it.',
		examples: [
			{ arabic: 'صيف', transliteration: 'Sayf', english: 'summer' },
			{ arabic: 'طويل', transliteration: 'Tawiil', english: 'tall' },
			{ arabic: 'ضهر', transliteration: 'Dahr', english: 'back' },
			{ arabic: 'صغير', transliteration: 'Sughayyar', english: 'small' }
		]
	},
	{
		id: 'rhythm',
		letter: 'بـ',
		heading: 'The b- prefix changes the rhythm of every sentence',
		body: 'Egyptian marks ordinary present tense with a b- stuck to the front of the verb: baktib is "I write" or "I am writing", where Fusha would say aktub. The bare form without b- is reserved for things like "I want to write". Because almost every present-tense verb in conversation carries it, b- is a large part of why spoken Egyptian has a different rhythm from anything you hear on the news.',
		examples: [
			{ arabic: 'باكتب', transliteration: 'baktib', english: 'I write', fusha: 'aktub' },
			{ arabic: 'بيشتغل', transliteration: 'biyishtaghal', english: 'he works' },
			{ arabic: 'بتحب', transliteration: 'bit7ibb', english: 'you like' },
			{ arabic: 'بنروح', transliteration: 'binruu7', english: 'we go' }
		]
	}
];

export const PRONUNCIATION_FAQS = [
	{
		question: 'Do I have to pronounce ق as a glottal stop?',
		answer:
			'In Cairo, yes, if you want to sound natural. Saying qahwa instead of ahwa will be understood everywhere but marks you immediately as either a foreigner or a newsreader. Keep the q for religious and formal vocabulary, where Egyptians keep it too.'
	},
	{
		question: 'Is Egyptian Arabic pronunciation harder than Modern Standard Arabic?',
		answer:
			'Easier, on balance. Egyptian drops the two "th" sounds and the q, which are three of the harder targets for English speakers, and adds nothing new. ع and ح are difficult, but they are difficult in every variety of Arabic including Fusha.'
	},
	{
		question: 'How do I practise ع and ح?',
		answer:
			'Record yourself saying a word you know well with each sound in it, then compare it to a native recording of the same word. The practice round on this page does exactly that and scores how close you got. Both sounds are produced further back in the throat than anything in English, so the usual mistake is not producing them far enough back rather than getting them wrong.'
	},
	{
		question: 'Will Egyptian pronunciation be understood in other Arab countries?',
		answer:
			'Yes. Decades of Egyptian film and music mean the Egyptian sound system is the one most Arabic speakers have heard most often, and the g for ج in particular is instantly recognisable rather than confusing.'
	}
];
