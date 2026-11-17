import type { Variety } from './varieties';

/**
 * Copy for the variety landing pages (/lebanese-arabic, /kuwaiti-arabic, ...).
 * Each phrase has a recording at /audio/varieties/<variety>-<index>.mp3, made by
 * scripts/generate-variety-audio.ts; the first one is also the voice preview
 * in onboarding.
 */
export interface VarietyPhrase {
	arabic: string;
	transliteration: string;
	english: string;
}

export interface VarietyLandingContent {
	nativeName: string;
	tagline: string;
	whereSpoken: string;
	seo: { title: string; description: string };
	features: { title: string; body: string }[];
	phrases: VarietyPhrase[];
	/** One question only this page answers; the shared ones come from the template. */
	faq: { question: string; answer: string };
}

export const VARIETY_LANDING: Record<Variety, VarietyLandingContent> = {
	syrian: {
		nativeName: 'اللهجة الشامية',
		tagline: 'The Arabic of Damascus, and the voice of the TV dramas the whole Arab world watches.',
		whereSpoken: 'Damascus, Aleppo and Homs, and Syrian communities in Germany, Turkey, Lebanon and beyond.',
		seo: {
			title: 'Learn Syrian Arabic Online: Damascene Phrases & Tutor',
			description:
				'Learn Syrian Arabic, the Shami dialect of Damascus. Levantine lessons with a Syrian voice, a tutor who speaks Damascene, and stories written the Syrian way.'
		},
		features: [
			{
				title: 'The Shami sound',
				body: 'Qaf turns into a glottal stop, so قلب is 2alb, and everyday words are short and soft: هلّق (halla2) for now, منيح (mnee7) for good.'
			},
			{
				title: 'The accent of dubbed TV',
				body: 'Turkish and other foreign series are dubbed into Syrian Arabic for the whole region, so Damascene is one of the most familiar accents anywhere.'
			},
			{
				title: 'A key to the Levant',
				body: 'Lebanese, Jordanian and Palestinian differ from it by a handful of words and sounds. Learn Syrian and you can follow all four.'
			}
		],
		phrases: [
			{ arabic: 'كيفك؟', transliteration: 'kifak?', english: 'How are you?' },
			{ arabic: 'شو بدك تعمل هلّق؟', transliteration: 'shu baddak ta3mel halla2?', english: 'What do you want to do now?' },
			{ arabic: 'تعا لهون', transliteration: "ta3a la-hon", english: 'Come here' },
			{ arabic: 'منيح كتير', transliteration: 'mnee7 kteer', english: 'Very good' }
		],
		faq: {
			question: 'What is the difference between Syrian and Lebanese Arabic?',
			answer:
				'Mostly a few words and the melody. Syrians say هاد (hada) for "this" where Lebanese say هيدا (hayda), and Lebanese mixes in French greetings like bonjour and merci. Grammar and most vocabulary are the same.'
		}
	},
	lebanese: {
		nativeName: 'اللهجة اللبنانية',
		tagline: 'The Arabic of Beirut: Levantine at heart, with French slipped into its greetings.',
		whereSpoken: 'Lebanon, and a diaspora larger than the country, from Brazil and Australia to France, Canada and the US.',
		seo: {
			title: 'Learn Lebanese Arabic Online: Phrases, Tutor & Stories',
			description:
				'Learn Lebanese Arabic, the dialect of Beirut: Levantine lessons in a Lebanese voice, a tutor who speaks Lebanese, and stories written the Lebanese way.'
		},
		features: [
			{
				title: 'Hi, kifak, ça va?',
				body: 'Lebanese mixes French and English into daily speech. Merci is how most people say thanks, and a greeting can switch language twice in one line.'
			},
			{
				title: 'Its own small words',
				body: 'هيدا and هيدي (hayda, hayde) for "this", where Damascus says هاد, and إيه (eh) for yes.'
			},
			{
				title: 'Heard everywhere',
				body: 'Fairuz, decades of Lebanese pop and a busy TV industry keep the accent familiar across the Arab world.'
			}
		],
		phrases: [
			{ arabic: 'كيفك؟', transliteration: 'kifak?', english: 'How are you?' },
			{ arabic: 'هيدا كتير طيب', transliteration: 'hayda kteer tayyeb', english: 'This is really tasty' },
			{ arabic: 'ميرسي كتير', transliteration: 'merci kteer', english: 'Thanks a lot' },
			{ arabic: 'شو في ما في؟', transliteration: 'shu fi ma fi?', english: "What's new? (lit. what is and isn't there)" }
		],
		faq: {
			question: 'Do I need to know French to learn Lebanese Arabic?',
			answer:
				'No. French words are sprinkled in, mostly greetings, thanks and a few everyday nouns. The grammar and most of the vocabulary are Arabic, and you will pick up the French bits as you go.'
		}
	},
	jordanian: {
		nativeName: 'اللهجة الأردنية',
		tagline: 'The Arabic of Amman, where hassa means now and qaf is often a hard g.',
		whereSpoken: 'Jordan: Amman, Irbid, Zarqa and Aqaba.',
		seo: {
			title: 'Learn Jordanian Arabic Online: Phrases, Tutor & Stories',
			description:
				'Learn Jordanian Arabic, the dialect of Amman: Levantine lessons in a Jordanian voice, a tutor who talks like Ammanis do, and stories written locally.'
		},
		features: [
			{
				title: 'هسّا, not هلّق',
				body: 'Ammanis say هسّا (hassa) for now and إشي (ishi) for thing, two of the first words you will notice.'
			},
			{
				title: 'The g sound',
				body: 'Many speakers say qaf as g, so بقول (I say) is bagool. It is still written with ق, as everywhere else.'
			},
			{
				title: 'A crossroads accent',
				body: 'Amman mixes Palestinian, Syrian and Bedouin speech, which makes Jordanian easy to follow across the whole Levant.'
			}
		],
		phrases: [
			{ arabic: 'كيف حالك؟', transliteration: 'keef 7alak?', english: 'How are you?' },
			{ arabic: 'هسّا جاي', transliteration: 'hassa jaay', english: "I'm coming now" },
			{ arabic: 'في إشي؟', transliteration: 'fi ishi?', english: 'Is something wrong?' },
			{ arabic: 'يا زلمة!', transliteration: 'ya zalameh!', english: 'Come on, man!' }
		],
		faq: {
			question: 'Is Jordanian Arabic close to Palestinian?',
			answer:
				'Very. Much of Jordan speaks a Palestinian variety, and the two share most words and grammar. The main differences are a few words like هسّا (now) and how often qaf is said as g.'
		}
	},
	palestinian: {
		nativeName: 'اللهجة الفلسطينية',
		tagline: 'The Arabic of Jerusalem, Ramallah, Nablus and Gaza.',
		whereSpoken: 'The West Bank, Gaza and Palestinian towns in Israel, plus large communities in Jordan, Lebanon, the Gulf and the Americas.',
		seo: {
			title: 'Learn Palestinian Arabic Online: Phrases, Tutor & Stories',
			description:
				'Learn Palestinian Arabic as spoken in Jerusalem and Ramallah: Levantine lessons in a Palestinian voice, a tutor who speaks Palestinian, and local stories.'
		},
		features: [
			{
				title: 'City, village and Bedouin',
				body: 'In the cities qaf is a glottal stop; in many villages ك becomes ch; Bedouin speech uses g. Our voice and tutor use the city accent.'
			},
			{
				title: 'Its own small words',
				body: 'هلقيت (halla2eet) for now, إيش (eesh) alongside شو for what, and هاي (hay) for "this" with feminine words.'
			},
			{
				title: 'Understood on both banks',
				body: 'Much of Jordan speaks a Palestinian variety too, so what you learn carries straight across.'
			}
		],
		phrases: [
			{ arabic: 'كيفك؟', transliteration: 'keefak?', english: 'How are you?' },
			{ arabic: 'إيش بدك تشرب؟', transliteration: 'eesh baddak tishrab?', english: 'What do you want to drink?' },
			{ arabic: 'هلقيت جاي', transliteration: "halla2eet jaay", english: "I'm coming now" },
			{ arabic: 'يسلموا إيديك', transliteration: 'yislamu ideek', english: 'Thank you (lit. bless your hands)' }
		],
		faq: {
			question: 'Which Palestinian accent will I learn?',
			answer:
				'The urban accent of Jerusalem and Ramallah, where qaf is a glottal stop. It is the one most widely understood, and the tutor can tell you how villages or Bedouin speakers say a word if you ask.'
		}
	},
	emirati: {
		nativeName: 'اللهجة الإماراتية',
		tagline: 'The Arabic of Abu Dhabi and Dubai, where you ask shu7aalak to say how are you.',
		whereSpoken: 'The United Arab Emirates: Abu Dhabi, Dubai, Sharjah, Al Ain and the northern emirates.',
		seo: {
			title: 'Learn Emirati Arabic Online: Phrases, Tutor & Stories',
			description:
				'Learn Emirati Arabic, the dialect of the UAE. Gulf Arabic lessons with an Emirati voice, a tutor who speaks Emirati, and stories written the way Emiratis talk.'
		},
		features: [
			{
				title: 'شحالك؟',
				body: 'Emiratis ask شحالك (sh7aalak) for how are you, say أبا (abaa) for I want and مب (mub) for not.'
			},
			{
				title: 'The Gulf core',
				body: 'الحين (now), وايد (a lot) and زين (good) are shared with Kuwait, Qatar and Bahrain, so Emirati carries across the Gulf.'
			},
			{
				title: 'Rare and noticed',
				body: 'Daily life in the UAE often runs in English, so even a few words of Emirati Arabic stand out with locals.'
			}
		],
		phrases: [
			{ arabic: 'شحالك؟', transliteration: 'sh7aalak?', english: 'How are you?' },
			{ arabic: 'شو تبا؟', transliteration: 'shu tibaa?', english: 'What do you want?' },
			{ arabic: 'وايد زين', transliteration: 'waayed zain', english: 'Very good' },
			{ arabic: 'مب مشكلة', transliteration: 'mub mushkila', english: 'No problem' }
		],
		faq: {
			question: 'Is Emirati Arabic useful in Dubai?',
			answer:
				'Yes, with Emiratis especially. Dubai is international and much of daily life runs in English, which is exactly why speaking some Emirati Arabic is noticed and appreciated.'
		}
	},
	kuwaiti: {
		nativeName: 'اللهجة الكويتية',
		tagline: 'The Arabic of Kuwait, and of half a century of Gulf TV.',
		whereSpoken: 'Kuwait, from Kuwait City to Jahra and Ahmadi.',
		seo: {
			title: 'Learn Kuwaiti Arabic Online: Phrases, Tutor & Stories',
			description:
				'Learn Kuwaiti Arabic. Gulf Arabic lessons with a Kuwaiti voice, a tutor who speaks Kuwaiti, and stories written the way Kuwaitis talk.'
		},
		features: [
			{
				title: 'شلونك and شنو',
				body: 'Kuwaitis ask شلونك (shlonak) for how are you and شنو (shino) for what, and say مو (mu) for not.'
			},
			{
				title: 'ch and g',
				body: 'ك is often said ch and ق often g: كذي (like this) is chithi. The spelling stays standard, so you can still type it.'
			},
			{
				title: 'The Gulf watched it',
				body: 'Kuwaiti plays and TV series were the Gulf’s entertainment for decades, so the accent is understood across the region.'
			}
		],
		phrases: [
			{ arabic: 'شلونك؟', transliteration: 'shlonak?', english: 'How are you?' },
			{ arabic: 'شنو تبي؟', transliteration: 'shino tibi?', english: 'What do you want?' },
			{ arabic: 'زين، الحمد لله', transliteration: 'zain, il7amdilla', english: 'Good, thank God' },
			{ arabic: 'وايد حلو', transliteration: 'waayed 7ilu', english: 'Really nice' }
		],
		faq: {
			question: 'Is Kuwaiti Arabic the same as Gulf Arabic?',
			answer:
				'It is one of the main Gulf varieties. It shares most words with Bahraini, Qatari and Emirati, with its own favourites like شنو (what) and a strong ch sound for ك.'
		}
	},
	qatari: {
		nativeName: 'اللهجة القطرية',
		tagline: 'The Arabic of Doha, close cousin of Bahraini and Emirati.',
		whereSpoken: 'Qatar: Doha, Al Rayyan, Al Wakrah and Al Khor.',
		seo: {
			title: 'Learn Qatari Arabic Online: Phrases, Tutor & Stories',
			description:
				'Learn Qatari Arabic, the dialect of Doha. Gulf Arabic lessons with a Qatari voice, a tutor who speaks Qatari, and stories written the way Qataris talk.'
		},
		features: [
			{
				title: 'g and y',
				body: 'ق is usually said g and ج often y, so رجّال (man) comes out rayyaal. The spelling stays standard.'
			},
			{
				title: 'The Gulf core',
				body: 'الحين (now), وايد (a lot), مب (not) and أبي (I want) are shared with its neighbours.'
			},
			{
				title: 'A warm welcome',
				body: 'هلا والله (hala walla) and the words around coffee and hospitality come up in almost every visit.'
			}
		],
		phrases: [
			{ arabic: 'شلونك؟', transliteration: 'shlonak?', english: 'How are you?' },
			{ arabic: 'هلا والله', transliteration: 'hala walla', english: 'Welcome! (a warm hello)' },
			{ arabic: 'وين بتروح الحين؟', transliteration: "wain bitroo7 il7ain?", english: 'Where are you going now?' },
			{ arabic: 'مب مشكلة', transliteration: 'mub mushkila', english: 'No problem' }
		],
		faq: {
			question: 'How different is Qatari from Emirati or Kuwaiti?',
			answer:
				'Not very. They share most vocabulary and grammar. Qatari leans on the g and y sounds and has its own favourite words, and the tutor will point those out as you talk.'
		}
	},
	bahraini: {
		nativeName: 'اللهجة البحرينية',
		tagline: 'The Arabic of Manama and the islands of Bahrain.',
		whereSpoken: 'Bahrain: Manama, Muharraq, Riffa and the villages of the islands.',
		seo: {
			title: 'Learn Bahraini Arabic Online: Phrases, Tutor & Stories',
			description:
				'Learn Bahraini Arabic. Gulf Arabic lessons with a Bahraini voice, a tutor who speaks Bahraini, and stories written the way people in Manama talk.'
		},
		features: [
			{
				title: 'شفيك؟',
				body: 'Bahrainis ask شفيك (shfeek) for what is wrong and شنهو (shinhu) for what.'
			},
			{
				title: 'More than one accent',
				body: 'Bahrain has more than one traditional accent. We use the everyday speech of Manama that everyone on the islands understands.'
			},
			{
				title: 'The Gulf core',
				body: 'الحين (now), وايد (a lot) and زين (good) work in Kuwait, Qatar and the UAE too.'
			}
		],
		phrases: [
			{ arabic: 'شلونك؟', transliteration: 'shlonak?', english: 'How are you?' },
			{ arabic: 'شفيك؟', transliteration: 'shfeek?', english: "What's wrong?" },
			{ arabic: 'شنهو هذا؟', transliteration: 'shinhu hatha?', english: "What's this?" },
			{ arabic: 'زين وايد', transliteration: 'zain waayed', english: 'Very good' }
		],
		faq: {
			question: 'Which Bahraini accent will I learn?',
			answer:
				'The everyday speech of Manama, understood across Bahrain. Ask the tutor and it will tell you when another part of the islands says a word differently.'
		}
	},
	omani: {
		nativeName: 'اللهجة العمانية',
		tagline: 'The Arabic of Muscat: Gulf Arabic with its own words and a gentler pace.',
		whereSpoken: 'Oman: Muscat, Sohar, Nizwa and Salalah.',
		seo: {
			title: 'Learn Omani Arabic Online: Phrases, Tutor & Stories',
			description:
				'Learn Omani Arabic, the dialect of Muscat. Gulf Arabic lessons with an Omani voice, a tutor who speaks Omani, and stories written the way Omanis talk.'
		},
		features: [
			{
				title: 'شحالك and إيش',
				body: 'Omanis ask شحالك (sh7aalak) for how are you and إيش (eesh) for what.'
			},
			{
				title: 'Closer to Fusha',
				body: 'Omani keeps more classical words and sounds than its neighbours, so learners with some Modern Standard Arabic find it easy to follow.'
			},
			{
				title: 'Its own words',
				body: 'واجد (waajid) for a lot, where most of the Gulf says وايد (waayed).'
			}
		],
		phrases: [
			{ arabic: 'شحالك؟', transliteration: 'sh7aalak?', english: 'How are you?' },
			{ arabic: 'إيش تبا؟', transliteration: 'eesh tibaa?', english: 'What do you want?' },
			{ arabic: 'زين واجد', transliteration: 'zain waajid', english: 'Very good' },
			{ arabic: 'الله يسلمك', transliteration: 'allah ysalmak', english: 'God keep you (a reply to thanks)' }
		],
		faq: {
			question: 'Is Omani Arabic hard to understand for other Gulf speakers?',
			answer:
				'No. Muscat speech is understood across the Gulf. It has some words of its own, like واجد for a lot, and a slower, clearer delivery many learners find easier.'
		}
	}
};
