/**
 * Content for the four dialect landing pages.
 *
 * These pages ranked at positions 20-27 for their own dialect names on a
 * single shared boilerplate description, which made them near-duplicates of
 * each other. Each one needs to say something true and specific about its
 * dialect that the other three do not.
 */
export interface DialectLandingLink {
	href: string;
	title: string;
	description: string;
}

export interface DialectFaq {
	question: string;
	answer: string;
}

export interface DialectLandingContent {
	heading: string;
	nativeName: string;
	tagline: string;
	whereSpoken: string;
	/** 3-5 things that actually distinguish this dialect from the others. */
	features: { title: string; body: string }[];
	faqs: DialectFaq[];
	extraLinks?: DialectLandingLink[];
}

export const DIALECT_LANDING: Record<string, DialectLandingContent> = {
	'egyptian-arabic': {
		heading: 'Egyptian Arabic',
		nativeName: 'المصري',
		tagline:
			'The most widely understood dialect in the Arab world, thanks to a century of Egyptian film, television and music.',
		whereSpoken:
			'Spoken by around 100 million people in Egypt, and understood almost everywhere else in the Arab world because of how much Egyptian media the region has watched. If you only learn one dialect and want to be understood broadly, this is usually the one.',
		features: [
			{
				title: 'ج is pronounced "g", not "j"',
				body: 'The word for "beautiful" is gamiil, not jamiil. This single sound is the fastest way to identify an Egyptian speaker, and it applies across the whole vocabulary.'
			},
			{
				title: 'ق usually becomes a glottal stop',
				body: 'qahwa (coffee) is said as ahwa, and qalb (heart) as alb. The letter is still written, just not pronounced as a q outside formal speech and some rural varieties.'
			},
			{
				title: 'Present tense takes a b- prefix',
				body: 'baktib means "I write" or "I am writing", where Fusha would use aktub. The bare form without b- is reserved for things like "I want to write".'
			},
			{
				title: 'Negation wraps the verb',
				body: 'ma...sh goes around the verb: makatabtish, "I did not write". It is one of the first patterns that stops sounding strange and starts sounding natural.'
			}
		],
		faqs: [
			{
				question: 'Should I learn Egyptian Arabic or Modern Standard Arabic first?',
				answer:
					'If your goal is to talk to people, start with Egyptian Arabic. Modern Standard Arabic is the language of news, books and formal writing, and almost nobody speaks it conversationally. If your goal is to read Arabic literature or the Quran, start with Fusha.'
			},
			{
				question: 'Will Egyptian Arabic be understood outside Egypt?',
				answer:
					'Largely yes. Decades of Egyptian cinema and music mean most Arabic speakers can follow Egyptian Arabic even when they do not speak it themselves. The reverse is not always true.'
			},
			{
				question: 'How different is Egyptian Arabic from Levantine?',
				answer:
					'Close enough that speakers understand each other with a little effort. The vocabulary overlaps heavily; the pronunciation of ج and ق, the question words, and some everyday verbs are the main differences.'
			}
		],
		extraLinks: [
			{
				href: '/egyptian-arabic/beginners',
				title: 'Start Here',
				description:
					'The order to learn Egyptian Arabic in, from the alphabet to your first conversation.'
			},
			{
				href: '/egyptian-arabic/vocabulary',
				title: 'Vocabulary by Topic',
				description:
					'Word lists for numbers, food, family and more, each with audio and free practice.'
			},
			{
				href: '/egyptian-arabic/pronunciation',
				title: 'Pronunciation',
				description:
					'The six sound changes that separate Egyptian Arabic from what textbooks teach.'
			}
		]
	},
	levantine: {
		heading: 'Levantine Arabic',
		nativeName: 'الشامي',
		tagline:
			'The Arabic of Syria, Lebanon, Jordan and Palestine — often the first dialect learners find easy to listen to.',
		whereSpoken:
			'Spoken by roughly 40 million people across Syria, Lebanon, Jordan and Palestine, and by large diaspora communities. Syrian and Lebanese television has made it the second most widely recognised dialect after Egyptian.',
		features: [
			{
				title: 'marhaba and keefak',
				body: 'The everyday greeting is marhaba, answered with marhabtayn ("two hellos"). "How are you" is keefak to a man and keefik to a woman — the endings do the work that separate words do in English.'
			},
			{
				title: 'ق is a glottal stop in the cities',
				body: 'In Damascus, Beirut and Amman, qalb (heart) is said as albe. Rural and Druze varieties keep the q, and Bedouin varieties turn it into a g.'
			},
			{
				title: 'The future uses rah or ha-',
				body: 'rah rooh or harooh both mean "I will go". This is one of the clearest splits from Egyptian, which uses ha- exclusively.'
			},
			{
				title: 'Imaala bends the long a',
				body: 'In much of Lebanon and northern Syria the long a leans towards an e sound, so baab (door) comes out closer to beeb. It is a large part of what people mean when they call Levantine melodic.'
			}
		],
		faqs: [
			{
				question: 'Is Levantine Arabic one dialect or several?',
				answer:
					'Several closely related ones. Syrian, Lebanese, Jordanian and Palestinian Arabic differ in accent and some vocabulary, but speakers understand each other without difficulty. Material taught as "Levantine" is usually based on Damascus or Beirut speech.'
			},
			{
				question: 'How do you say hello in Levantine Arabic?',
				answer:
					'marhaba (مرحبا) is the standard greeting and works in any situation. as-salamu 3alaykum is more formal or traditional, and ahlan or hay are casual.'
			},
			{
				question: 'Is Levantine harder than Egyptian Arabic?',
				answer:
					'Not harder, but there is less learning material and less media exposure, so it can take more effort to find good listening practice. The grammar is very close to Egyptian.'
			}
		],
		extraLinks: [
			{
				href: '/blog/how-to-learn-levantine-arabic',
				title: 'Start Here',
				description:
					'How to learn Levantine Arabic: what to do first, which accent to pick, and how long each stage takes.'
			}
		]
	},
	darija: {
		heading: 'Moroccan Darija',
		nativeName: 'الدارجة',
		tagline:
			'The Arabic of Morocco — the most distinctive of the major dialects, and the hardest to find good material for.',
		whereSpoken:
			'Spoken by around 30 million people in Morocco, with close relatives in Algeria and Tunisia. Moroccans generally understand Egyptian and Levantine from media exposure, while the reverse is much less common.',
		features: [
			{
				title: 'Short vowels get dropped',
				body: 'Words compress in a way no other dialect does: "I wrote" is ktebt, "market" is sooq but "in the market" is fessooq. Consonant clusters that look unpronounceable on the page are normal here.'
			},
			{
				title: 'Amazigh, French and Spanish vocabulary',
				body: 'Everyday words come from Tamazight (the indigenous Berber languages) and from French and Spanish: tomobil for car, forshita for fork, semana in the north for week.'
			},
			{
				title: 'Present tense uses ka-',
				body: 'kanktib is "I write", where Egyptian says baktib. The prefix is ka- or ta- depending on the region.'
			},
			{
				title: 'Negation with ma...sh',
				body: 'The same wrap-around negation as Egyptian and Levantine: maktebtsh, "I did not write". This much, at least, is familiar.'
			}
		],
		faqs: [
			{
				question: 'Can other Arabic speakers understand Darija?',
				answer:
					'Often not without effort. The dropped vowels, the Amazigh and French vocabulary, and the distinctive rhythm make Darija the hardest dialect for speakers of eastern varieties to follow.'
			},
			{
				question: 'Is Darija worth learning?',
				answer:
					'If you are going to Morocco or have Moroccan family, yes — it is what people actually speak, and Moroccans respond warmly to learners who use it. If you want broad regional reach, Egyptian or Levantine will travel further.'
			},
			{
				question: 'Do Moroccans understand Modern Standard Arabic?',
				answer:
					'Yes, from schooling and news media, but they do not use it conversationally. Speaking Fusha in a Moroccan café will be understood and will also mark you as a foreigner.'
			}
		],
		extraLinks: [
			{
				href: '/blog/how-to-learn-moroccan-arabic',
				title: 'Start Here',
				description:
					'How to learn Moroccan Arabic: the order that works, what makes Darija different, and where to find practice.'
			}
		]
	},
	fusha: {
		heading: 'Fusha (Modern Standard Arabic)',
		nativeName: 'الفصحى',
		tagline:
			'The written and formal Arabic shared across the entire Arab world — the language of news, books, and the Quran.',
		whereSpoken:
			'Not the native dialect of anyone, but the common written standard across all 22 Arab countries. Newspapers, novels, official documents, news broadcasts and formal speeches use it. Classical Arabic, the language of the Quran, is its older form.',
		features: [
			{
				title: 'Every letter is pronounced as written',
				body: 'ق stays a q, ج stays a j, and ث stays a th. Where the dialects simplify or shift these sounds, Fusha keeps them, which makes it a useful starting point for pronunciation.'
			},
			{
				title: 'Case endings (i3raab)',
				body: 'Nouns take endings that mark their grammatical role — -u for subjects, -a for objects, -i after prepositions. In practice these are written but usually dropped in speech outside formal recitation.'
			},
			{
				title: 'The dual number',
				body: 'Arabic has a separate form for exactly two of something: kitaab (book), kitaabaan (two books), kutub (books). The dialects have mostly kept this only for a handful of words.'
			},
			{
				title: 'Verb-first word order',
				body: 'The neutral sentence order is verb-subject-object: kataba l-waladu risaalatan, "wrote the-boy a-letter". The dialects have largely shifted to subject-first.'
			}
		],
		faqs: [
			{
				question: 'Can I have a conversation in Fusha?',
				answer:
					'You will be understood, but it will sound like speaking in the register of a news anchor. Arabic speakers switch to a dialect for everyday conversation. Fusha is best for reading, writing, and formal or academic settings.'
			},
			{
				question: 'What is the difference between Fusha and Classical Arabic?',
				answer:
					'Modern Standard Arabic is the contemporary form: same grammar, updated vocabulary for modern life. Classical Arabic is the language of the Quran and pre-modern literature. Someone comfortable in one can read the other.'
			},
			{
				question: 'Should I learn Fusha before a dialect?',
				answer:
					'It depends on your goal. Fusha first makes reading and formal study easier and gives you the full sound system. A dialect first gets you talking to people sooner. Neither order is wrong.'
			}
		]
	},
	iraqi: {
		heading: 'Iraqi Arabic',
		nativeName: 'العراقي',
		tagline:
			'The Arabic of Baghdad and the two rivers — direct, warm, and full of words borrowed from Persian, Turkish and English.',
		whereSpoken:
			'Spoken by over 40 million people in Iraq and by large communities abroad. What is taught as Iraqi Arabic is usually Baghdadi, the variety heard on Iraqi television and understood across the country.',
		features: [
			{
				title: 'ك often becomes "ch"',
				body: 'kalb (dog) is said chalib, and "you (f)" endings are -ich instead of -ik: shloonich? (how are you, to a woman). It is one of the most recognisable Iraqi sounds.'
			},
			{
				title: 'ق becomes "g"',
				body: 'qahwa (coffee) is gahwa and qalb (heart) is galub. Iraqi keeps a hard g where Egyptian and city Levantine use a glottal stop.'
			},
			{
				title: 'aku and maku',
				body: 'aku means "there is" and maku "there isn\'t". shaku maku? ("what\'s there, what\'s not?") is the classic Iraqi "what\'s up?".'
			},
			{
				title: 'Its own everyday words',
				body: 'hassa (now), shlon (how), shgadd (how much), baachir (tomorrow) and hwaaya (a lot) set Iraqi apart from its neighbours from the first conversation.'
			}
		],
		faqs: [
			{
				question: 'Is Iraqi Arabic hard to understand for other Arabs?',
				answer:
					'It is less familiar than Egyptian or Levantine because less Iraqi media is watched abroad, but Gulf speakers understand it easily and most Arabs can follow it with a little exposure.'
			},
			{
				question: 'How do you say "how are you" in Iraqi Arabic?',
				answer:
					'shloonak? (شلونك) to a man, shloonich? to a woman and shloonkum? to a group. It literally asks "what is your colour?".'
			},
			{
				question: 'Should I learn Iraqi or Gulf Arabic?',
				answer:
					'They are close cousins and share many words and sounds. Learn Iraqi if you have family, friends or work connected to Iraq; Gulf Arabic if your life is in the UAE, Kuwait or Qatar.'
			}
		],
		extraLinks: [
			{
				href: '/blog/how-to-learn-iraqi-arabic',
				title: 'Start Here',
				description:
					'How to learn Iraqi Arabic: the sounds to get right first, the words that carry every sentence, and how long each stage takes.'
			}
		]
	},
	khaleeji: {
		heading: 'Gulf Arabic (Khaleeji)',
		nativeName: 'الخليجي',
		tagline:
			'The Arabic of the UAE, Kuwait, Qatar and Bahrain — the language of the majlis, the souk and the fast-growing Gulf cities.',
		whereSpoken:
			'Spoken by the citizens of the UAE, Kuwait, Qatar, Bahrain and parts of Oman and eastern Saudi Arabia. What is taught as Khaleeji is a shared Gulf koine, closest to Emirati and Kuwaiti speech.',
		features: [
			{
				title: 'ج often becomes "y"',
				body: 'jadeed (new) is said yideed, and dijaaj (chicken) is diyaay. Not every speaker does it every time, but it is the clearest Gulf sound.'
			},
			{
				title: 'ق is "g" and ك can be "ch"',
				body: 'gahwa (coffee) keeps a hard g, and kaif (how) can become chaif. "You (f)" endings are -ich: shloonich?'
			},
			{
				title: 'abi, wayid and il-7een',
				body: 'abi means "I want", waayid "a lot" and il-7een "now". These three alone make a sentence sound Gulf: abi gahwa il-7een.'
			},
			{
				title: 'Hospitality has its own language',
				body: '7ayyaak alla (God greet you) welcomes a guest, and coffee from the dalla comes with its own etiquette: shake the cup gently when you have had enough.'
			}
		],
		faqs: [
			{
				question: 'Is Khaleeji the same in every Gulf country?',
				answer:
					'Not exactly. Emirati, Kuwaiti, Qatari and Bahraini Arabic differ in accent and some words, but Gulf speakers understand each other easily. Learning the shared Gulf forms prepares you for all of them.'
			},
			{
				question: 'Do I need Arabic in Dubai if everyone speaks English?',
				answer:
					'You can get by in English, but even a little Khaleeji changes how people respond to you — at work, in the majlis, and with Emirati colleagues and neighbours.'
			},
			{
				question: 'How do you say "I want" in Gulf Arabic?',
				answer:
					'abi (أبي), as in abi gahwa (I want coffee). Saudis say abgha, Egyptians 3aayiz and Levantines biddi.'
			}
		],
		extraLinks: [
			{
				href: '/blog/how-to-learn-gulf-arabic',
				title: 'Start Here',
				description:
					'How to learn Gulf Arabic: which Gulf accent to aim for, what to learn first, and how long each stage takes.'
			}
		]
	},
	saudi: {
		heading: 'Saudi Arabic (Hijazi)',
		nativeName: 'الحجازي',
		tagline:
			'The Arabic of Jeddah, Mecca and Medina — a crossroads dialect shaped by centuries of pilgrims and traders.',
		whereSpoken:
			'Hijazi is spoken in the western region of Saudi Arabia, in Jeddah, Mecca, Medina and Taif. Because Jeddah has always welcomed people from everywhere, Hijazi is one of the easiest Saudi varieties for other Arabs to understand.',
		features: [
			{
				title: 'ث and ذ become ت and د',
				body: 'thalaatha (three) is talaata and haadha (this) is haada. Hijazis also write them that way in casual messages.'
			},
			{
				title: 'b- for the present, 7a- for the future',
				body: 'baktub means "I write" and 7aktub "I will write", much like Egyptian. That makes Hijazi a natural step for anyone who already knows some Egyptian Arabic.'
			},
			{
				title: 'da7een, eesh and abgha',
				body: 'da7een (now), eesh (what), feen (where) and abgha (I want) are the everyday words you hear first in Jeddah.'
			},
			{
				title: 'marra means "very"',
				body: '7ilu marra means "very nice". The word that means "once" elsewhere is the Hijazi intensifier, and you will hear it in almost every conversation.'
			}
		],
		faqs: [
			{
				question: 'Is Hijazi the same as Saudi Arabic?',
				answer:
					'Saudi Arabia has several dialects. Hijazi is spoken in the west (Jeddah, Mecca, Medina); Najdi in the centre around Riyadh; and Gulf-style dialects in the east. Hijazi is the most widely understood outside the country.'
			},
			{
				question: 'Is Hijazi close to Egyptian Arabic?',
				answer:
					'In some ways, yes: both use b- for the present and ha-/7a- for the future, and many words overlap. Hijazi keeps ق as a "g" and has its own vocabulary like da7een and eesh.'
			},
			{
				question: 'How do you say "how are you" in Saudi Hijazi?',
				answer:
					'kaifak? (كيفك) to a man and kaifik? to a woman. The answer is usually il-7amdulillah, tamaam (praise God, fine).'
			}
		],
		extraLinks: [
			{
				href: '/blog/how-to-learn-saudi-arabic',
				title: 'Start Here',
				description:
					'How to learn Saudi Arabic: why Hijazi is the place to start, what to learn first, and how long each stage takes.'
			}
		]
	}
};
