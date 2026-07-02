/**
 * Egyptian Arabic curriculum (v2) — CEFR A1–C2.
 *
 * Encodes the professional curriculum framework in
 * docs/curriculum/curriculum-framework-a1-c2.en.md. Topic IDs are namespaced
 * `eg-{level}-u{NN}` so they never collide with the legacy curriculum
 * (src/lib/data/curriculum.ts), which is left untouched for other dialects.
 *
 * Module-level `objectives` come from each level's "Learning Objectives"; each
 * topic's `description` is its "What the Student Will Study" cell. The v2 lesson
 * generator uses module.objectives + topic.description to build the lesson.
 */

export interface CurriculumV2Topic {
	id: string;
	title: string;
	description: string;
}

export interface CurriculumV2Module {
	id: string;
	title: string;
	level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
	objectives: string[];
	topics: CurriculumV2Topic[];
}

export const curriculumEgyptianV2: CurriculumV2Module[] = [
	{
		id: 'eg-a1',
		title: 'A1 — Beginner',
		level: 'A1',
		objectives: [
			'Acquire basic vocabulary covering immediate daily needs (introductions, family, numbers, colors, time).',
			'Build simple sentences for everyday use.',
			'Develop accurate pronunciation of letters and their points of articulation.',
			'Understand very simple familiar phrases related to concrete needs.'
		],
		topics: [
			{ id: 'eg-a1-u02', title: 'Greetings and Introductions', description: 'Phrases for greeting, welcoming, and introducing oneself: name, nationality, occupation.' },
			{ id: 'eg-a1-u03', title: 'Colloquial Independent Pronouns', description: 'ana, inta, inti, huwwa, hiyya, ihna, humma and their use in simple introductory sentences.' },
			{ id: 'eg-a1-u04', title: 'Colloquial Demonstratives', description: 'da, di, dool and their use in pointing to people and things.' },
			{ id: 'eg-a1-u05', title: 'Numbers from 1 to 10', description: 'Pronouncing and writing numbers and using them in simple counting and prices.' },
			{ id: 'eg-a1-u06', title: 'Numbers from 11 to 100', description: 'Forming compound numbers and tens, and using them in everyday contexts.' },
			{ id: 'eg-a1-u07', title: 'Family Members', description: 'Family vocabulary: father, mother, brother, sister, grandpa, grandma, uncle, aunt, cousin, etc.' },
			{ id: 'eg-a1-u08', title: 'Colors and Basic Adjectives', description: 'Names of colors and their agreement with the noun in masculine and feminine.' },
			{ id: 'eg-a1-u09', title: 'Days of the Week and Months', description: 'Names of days and the Gregorian and Hijri months, and their use in setting appointments.' },
			{ id: 'eg-a1-u10', title: 'Question Words (eh, fenak, kifak, imta)', description: 'Basic question words and forming simple questions and answering them.' },
			{ id: 'eg-a1-u11', title: 'Answers to Common Questions', description: 'Answering with ah, laa, mumkin, hashoof, gayiz, ihtimaal, bi-izn illah.' },
			{ id: 'eg-a1-u12', title: 'At Home', description: 'Vocabulary for home furniture and rooms.' },
			{ id: 'eg-a1-u13', title: 'Adverbs of Place and Directions', description: 'Location of things using adverbs of place (on, under, beside, above, right, left, inside, in, in front, behind).' },
			{ id: 'eg-a1-u14', title: 'At School', description: 'Classroom vocabulary and school supplies, and simple sentences about daily activity.' },
			{ id: 'eg-a1-u15', title: 'Food and Drink', description: 'Names of common foods and drinks.' },
			{ id: 'eg-a1-u16', title: 'Singular and Plural', description: 'Singular and plural of the most common Egyptian words.' },
			{ id: 'eg-a1-u17', title: 'Time and the Clock', description: 'Reading the clock and expressing time (morning, noon, evening, night, afternoon, sunset).' },
			{ id: 'eg-a1-u18', title: 'The Present Tense', description: 'Conjugating the present tense with singular pronouns in everyday verbs, beginning with b- (barooh / bitrooh, rayih, rayhin).' },
			{ id: 'eg-a1-u19', title: 'The Past Tense', description: 'Conjugating the simple past tense with singular pronouns to express completed events.' },
			{ id: 'eg-a1-u20', title: 'Describing Personal Appearance', description: 'Simple body and face adjectives and briefly describing a person.' },
			{ id: 'eg-a1-u21', title: 'Final Review and Assessment A1', description: 'A1-level test.' }
		]
	},
	{
		id: 'eg-a2',
		title: 'A2 — Lower Intermediate',
		level: 'A2',
		objectives: [
			'Expand the lexicon to cover broader areas of daily life (travel, work, services).',
			'Master the conjugation of past and present verbs with all pronouns.',
			'Describe experiences, past events, and near-future plans in a simplified manner.',
			'Interact in short routine dialogues requiring a direct exchange of information.'
		],
		topics: [
			{ id: 'eg-a2-u01', title: 'Daily Routine and Everyday Verbs', description: 'Daily routine and daily activities.' },
			{ id: 'eg-a2-u02', title: 'Clothing', description: 'A lesson on clothing for men, women, and children.' },
			{ id: 'eg-a2-u03', title: 'The Kitchen and Its Tools', description: 'Describing the kitchen, kitchen tools, and cooking.' },
			{ id: 'eg-a2-u04', title: 'The Imperative Verb', description: 'Forming the imperative (run, play, watch out, stand here, walk/go).' },
			{ id: 'eg-a2-u05', title: 'Sports', description: 'Different types of sports (football, basketball, handball, tennis, squash, padel, etc.).' },
			{ id: 'eg-a2-u06', title: 'The Body and Health', description: 'Names of body parts and expressing simple pain (I have a headache).' },
			{ id: 'eg-a2-u07', title: 'Weather and Seasons', description: 'Weather vocabulary, the four seasons, and expressing weather conditions.' },
			{ id: 'eg-a2-u08', title: 'Means of Transportation', description: 'Names of transportation and means of transit, and expressing how to get to a place.' },
			{ id: 'eg-a2-u09', title: 'Asking for Directions', description: 'Phrases for asking the way and understanding simple instructions (right, left, in front).' },
			{ id: 'eg-a2-u10', title: 'Shopping', description: 'Shopping at the supermarket or mall.' },
			{ id: 'eg-a2-u11', title: 'Favorite Hobbies', description: 'Expressing simple hobbies using bahibb / ma bahibbish (I like / I don’t like).' },
			{ id: 'eg-a2-u12', title: 'Animals', description: 'Talking about predatory animals in the jungle.' },
			{ id: 'eg-a2-u13', title: 'The Farm', description: 'Talking about the farm and farm animals and birds.' },
			{ id: 'eg-a2-u14', title: 'Vegetables, Fruits, and Dishes', description: 'Vegetables, fruits, and Egyptian dishes.' },
			{ id: 'eg-a2-u15', title: 'Health and Illness', description: 'Describing simple symptoms, a dialogue with the doctor, and asking for medicine at the pharmacy.' },
			{ id: 'eg-a2-u16', title: 'Job Interview 1', description: 'The job interview, qualifications, and experience.' },
			{ id: 'eg-a2-u17', title: 'At the Restaurant', description: 'A short dialogue for ordering food and drink and paying, with polite phrases, and expressing desire using aayiz (I want).' },
			{ id: 'eg-a2-u18', title: 'Preferences', description: 'Preference and comparative adjectives (more than / less than / taller than / more beautiful than).' },
			{ id: 'eg-a2-u19', title: 'Adverbs of Time and Place', description: 'Using adverbs such as today, yesterday, tomorrow, the day after tomorrow, here, there in simple sentences.' },
			{ id: 'eg-a2-u20', title: 'Directions and Transportation in the City', description: 'Giving detailed instructions to reach a place using different means of transport.' },
			{ id: 'eg-a2-u21', title: 'Test and Assessment A2', description: 'A2-level test and assessment.' }
		]
	},
	{
		id: 'eg-b1',
		title: 'B1 — Intermediate',
		level: 'B1',
		objectives: [
			'Produce coherent texts on familiar topics or topics of personal interest.',
			'Understand the main ideas in clear texts in simplified colloquial language.',
			'Participate in dialogues on general topics without prior preparation.',
			'Justify opinions and briefly explain plans, giving reasons and explanations.'
		],
		topics: [
			{ id: 'eg-b1-u01', title: 'Trips and Entertainment', description: 'Trips, entertainment venues, and vacation.' },
			{ id: 'eg-b1-u02', title: 'The Conditional', description: 'Conditional particles (in, illa iza, law) and forming the conditional sentence / relative pronouns (illi).' },
			{ id: 'eg-b1-u03', title: 'Trips and Travel', description: 'Travel, trips, and camping.' },
			{ id: 'eg-b1-u04', title: 'Travel and Booking Tickets', description: 'Airport and train vocabulary, a dialogue for booking a ticket, and asking about schedules.' },
			{ id: 'eg-b1-u05', title: 'The Exclamatory Style', description: 'Exclamatory sentences (eh il-gamal da, eh il-halawa di, da ana gamid awi) and oaths.' },
			{ id: 'eg-b1-u06', title: 'Talking About Daily Life', description: 'A model of a day in a person’s life.' },
			{ id: 'eg-b1-u07', title: 'Rituals and Worship', description: 'Rituals and acts of worship.' },
			{ id: 'eg-b1-u08', title: 'Feelings and Emotions', description: 'Talking about feelings and emotions.' },
			{ id: 'eg-b1-u09', title: 'At the Hotel', description: 'A dialogue for booking, inquiring about hotel services, and making a simple complaint.' },
			{ id: 'eg-b1-u10', title: 'Expressing Wishes and Hopes', description: 'Using atmanna, yaret, in shaa allah, lamma akbar to express desires and ambitions.' },
			{ id: 'eg-b1-u11', title: 'Professions and Jobs', description: 'Vocabulary for professions and expressing the workplace and its nature.' },
			{ id: 'eg-b1-u12', title: 'Electrical and Household Appliances', description: 'Electrical appliances, home furnishings, and household devices.' },
			{ id: 'eg-b1-u13', title: 'Drama', description: 'Cinema, films, and TV series.' },
			{ id: 'eg-b1-u14', title: 'The News Bulletin', description: 'The news bulletin.' },
			{ id: 'eg-b1-u15', title: 'Invitations and Occasions', description: 'An invitation to a social occasion and replying with acceptance or apology.' },
			{ id: 'eg-b1-u16', title: 'Expressing a Simple Opinion', description: 'Phrases for giving a simple opinion (aaqtaqid inn, fi raayi, ana shayif) about familiar topics.' },
			{ id: 'eg-b1-u17', title: 'Suggestions and Reasons', description: 'Making suggestions, giving reasons, and expressing opinion.' },
			{ id: 'eg-b1-u18', title: 'Eating Habits', description: 'Eating habits.' },
			{ id: 'eg-b1-u19', title: 'Certainty, Probability, and Doubt', description: 'Forms for expressing degrees of certainty and probability (ihtimal, mumkin, gayiz, ma aaqtaqidsh, akeed, 100%).' },
			{ id: 'eg-b1-u20', title: 'Social Life and Relationships', description: 'Social relationships, neighbors, and renting accommodation.' },
			{ id: 'eg-b1-u21', title: 'Test and Assessment B1', description: 'B1-level assessment test.' }
		]
	},
	{
		id: 'eg-b2',
		title: 'B2 — Upper Intermediate',
		level: 'B2',
		objectives: [
			'Understand more specialized texts on topics specific to the Egyptian environment.',
			'Interact fluently and spontaneously with native speakers.',
			'Explain different points of view on contemporary issues.',
			'Learn the particularities of the Egyptian environment — social life, antiquities, and more.'
		],
		topics: [
			{ id: 'eg-b2-u01', title: 'A Visit to Egypt', description: 'A visit to Egypt, the Pyramids, the Sphinx, the weather, and the kindness of the people.' },
			{ id: 'eg-b2-u02', title: 'Geography of Egypt', description: 'The cities and governorates of Egypt, their geography, and the nature of life in them.' },
			{ id: 'eg-b2-u03', title: 'The Month of Ramadan', description: 'The month of Ramadan in Egypt.' },
			{ id: 'eg-b2-u04', title: 'Arab Countries and Their Culture', description: 'Arab cultures and countries, their religion, customs, clothing, and holidays.' },
			{ id: 'eg-b2-u05', title: 'The Ancient Egyptians', description: 'Antiquities and the ancient Egyptians.' },
			{ id: 'eg-b2-u06', title: 'Modern History of Egypt', description: 'Modern Egyptian history, its presidents, and the wars it fought.' },
			{ id: 'eg-b2-u07', title: 'Describing Personal Experiences', description: 'Narrating a relatively long story with sequential events and precise temporal connection.' },
			{ id: 'eg-b2-u08', title: 'Job Interview 2', description: 'More professions and advanced job interviews.' },
			{ id: 'eg-b2-u09', title: 'Technology and the Internet', description: 'Modern technology vocabulary, and discussing the pros and cons of its use.' },
			{ id: 'eg-b2-u10', title: 'Media', description: 'Vocabulary for the press, radio, and television, and summarizing a simple news item.' },
			{ id: 'eg-b2-u11', title: 'Education and Its Systems', description: 'Discussing the education system and comparing different learning methods.' },
			{ id: 'eg-b2-u12', title: 'Travel and Cultures', description: 'Describing a cultural travel experience and comparing customs between two countries.' },
			{ id: 'eg-b2-u13', title: 'The Environment and Its Issues', description: 'Vocabulary for the environment and pollution, and proposals for its preservation.' },
			{ id: 'eg-b2-u14', title: 'Science and Innovation', description: 'Reading a popular science text and discussing the impact of modern inventions.' },
			{ id: 'eg-b2-u15', title: 'Fashion', description: 'Gifts, accessories, makeup, and fashion.' },
			{ id: 'eg-b2-u16', title: 'Law, Order, and Rights', description: 'A story about law, rights, and order.' },
			{ id: 'eg-b2-u17', title: 'The Work Environment, Presentations, and Discussions', description: 'Operating within the work environment, discussions, presentations, and what they involve.' },
			{ id: 'eg-b2-u18', title: 'Secondary and University Study', description: 'Secondary and university study and related topics: graduation, the total grade (magmoo), and placement (tanseeq).' },
			{ id: 'eg-b2-u19', title: 'The Economy', description: 'Talking about economic matters: money, the stock exchange, shares, bonds, gold, and the exchange rate.' },
			{ id: 'eg-b2-u20', title: 'Entrepreneurship', description: 'Talking about entrepreneurship, projects, profits, feasibility studies, costs, and needs.' },
			{ id: 'eg-b2-u21', title: 'Final Review and Assessment B2', description: 'A comprehensive B2-level assessment test.' }
		]
	},
	{
		id: 'eg-c1',
		title: 'C1 — Advanced',
		level: 'C1',
		objectives: [
			'Master colloquial language in advanced topics and apply it in oral speech.',
			'Understand a wide range of long texts and grasp their implicit meanings.',
			'Express oneself fluently and spontaneously without obvious searching for expressions.',
			'Use the language flexibly and effectively for social, academic, professional, and specialized purposes.'
		],
		topics: [
			{ id: 'eg-c1-u01', title: 'Social Media', description: 'A topic on social media and social networking platforms.' },
			{ id: 'eg-c1-u02', title: 'E-Commerce', description: 'A topic on e-commerce, marketing, and working in this field.' },
			{ id: 'eg-c1-u03', title: 'Folk Literature Stories', description: 'Folk literature stories: Goha and his donkey.' },
			{ id: 'eg-c1-u04', title: 'Contemporary Social Issues', description: 'Discussing globalization, its impact on societies, and its changes to Egyptian culture.' },
			{ id: 'eg-c1-u05', title: 'Tourism', description: 'Tourism in Egypt and the most important tourist landmarks.' },
			{ id: 'eg-c1-u06', title: 'Politics', description: 'Topics on different systems of government in an objective, balanced style; parties and elections.' },
			{ id: 'eg-c1-u07', title: 'Proverbs and Idiomatic Expressions', description: 'Studying common proverbs and expressions and their cultural contexts of use.' },
			{ id: 'eg-c1-u08', title: 'Migration and Cultural Diversity', description: 'Topics on migration issues, cultural coexistence, and Egyptians abroad.' },
			{ id: 'eg-c1-u09', title: 'International Relations', description: 'Talking about war, peace, and regional events.' },
			{ id: 'eg-c1-u10', title: 'Egyptian Heritage', description: 'Music such as the simsimiyya, cultural heritage within Egypt’s governorates (Nubia and others), and Khan el-Khalili.' },
			{ id: 'eg-c1-u11', title: 'Folk Literature Stories 2', description: 'Ali Baba and the Forty Thieves.' },
			{ id: 'eg-c1-u12', title: 'Work Behaviors', description: 'Planning, negotiation, leadership skills, and cooperation.' },
			{ id: 'eg-c1-u13', title: 'Raising Children', description: 'Raising children, parenthood, family planning, and parenting skills.' },
			{ id: 'eg-c1-u14', title: 'Friends and Phone Conversations', description: 'Phone calls, past memories, friends, appointments, and meeting up.' },
			{ id: 'eg-c1-u15', title: 'Food and Energy Security', description: 'Food and energy security.' },
			{ id: 'eg-c1-u16', title: 'Diplomacy', description: 'The field of diplomacy, embassies, consulates, and what is associated with it.' },
			{ id: 'eg-c1-u17', title: 'Freelancing and Artificial Intelligence', description: 'Freelancing and artificial intelligence and its impact on jobs.' },
			{ id: 'eg-c1-u18', title: 'Marriage in Egypt', description: 'The customs of marriage in Egypt, its costs, and its steps.' },
			{ id: 'eg-c1-u19', title: 'A Day at the Cafe', description: 'A day at the cafe in Egypt and its associated customs.' },
			{ id: 'eg-c1-u20', title: 'The Work Environment and Critical Thinking', description: 'Making suggestions, solving problems, and critiquing ideas in the work environment.' },
			{ id: 'eg-c1-u21', title: 'C1-Level Test', description: 'C1-level assessment.' }
		]
	},
	{
		id: 'eg-c2',
		title: 'C2 — Mastery',
		level: 'C2',
		objectives: [
			'Understand almost everything read or heard with complete ease and virtually no effort.',
			'Distinguish fine semantic nuances in different situations (sarcasm / criticism / humor).',
			'Summarize information and reformulate it in a coherent presentation.',
			'Express oneself spontaneously with high accuracy.'
		],
		topics: [
			{ id: 'eg-c2-u01', title: 'Various Colloquial Styles', description: 'Colloquial rhetoric and the difference between styles of sarcasm, humor, and mockery (tireeqa).' },
			{ id: 'eg-c2-u02', title: 'Egyptian Proverbs', description: 'Various common colloquial proverbs and their meanings.' },
			{ id: 'eg-c2-u03', title: 'Colloquial Poetry: Salah Jahin', description: 'Example of colloquial poetry — "On the name of Egypt" by Salah Jahin.' },
			{ id: 'eg-c2-u04', title: 'Colloquial Poetry: Bayram al-Tunsi', description: 'Example of colloquial poetry — "Ya Halawet el-Dunia" by Bayram al-Tunsi.' },
			{ id: 'eg-c2-u05', title: 'Freedom and Responsibility', description: 'Freedom and responsibility in society.' },
			{ id: 'eg-c2-u06', title: 'Ethics in the Modern Era', description: 'Ethics in the age of technology.' },
			{ id: 'eg-c2-u07', title: 'Colloquial Poetry: Fouad Haddad', description: 'Example of colloquial poetry — "Al-Mesaharati" by Fouad Haddad.' },
			{ id: 'eg-c2-u08', title: 'Colloquial Poetry: Ahmed Fouad Negm', description: 'Example of satirical colloquial poetry — "Nuayyid Siyadtak" by Ahmed Fouad Negm.' },
			{ id: 'eg-c2-u09', title: 'A Philosophical Topic', description: 'Philosophical topics: the concept of happiness in life.' },
			{ id: 'eg-c2-u10', title: 'The Philosophies of Egyptians', description: 'Egyptian philosophies: gadaana, ibn il-balad, azoomaat, fahlawa, ibn nukta.' },
			{ id: 'eg-c2-u11', title: 'The Saidis (Upper Egyptians)', description: 'Upper Egypt (Saaid) in Egyptian culture, the culture of the Saidis, and their jokes.' },
			{ id: 'eg-c2-u12', title: 'Press and Media', description: 'Press ethics, news production, rumors, media bias, and types of media.' },
			{ id: 'eg-c2-u13', title: 'The Generation Gap', description: 'The generation gap between inherited customs and adopted ones.' },
			{ id: 'eg-c2-u14', title: 'Egyptian Society and Its Classes', description: 'Managing disputes within society (a look at the anatomy of Egyptian society).' },
			{ id: 'eg-c2-u15', title: 'The Generosity of Egyptians', description: 'Volunteering and community work in Egypt and the generosity of Egyptians.' },
			{ id: 'eg-c2-u16', title: 'Egyptian Heritage: Nubia and Siwa', description: 'Egyptian heritage: Nubia and Siwa.' },
			{ id: 'eg-c2-u17', title: 'Jokes and Food', description: 'Jokes and food in the lives of Egyptians and how Egyptians deal with crises through jokes.' },
			{ id: 'eg-c2-u18', title: 'The Egyptian Nile', description: 'The Nile River in the lives of Egyptians, past and present, and its impact on the Egyptian character.' },
			{ id: 'eg-c2-u19', title: 'Al-Azhar and Its Role', description: 'Al-Azhar and its role in Egyptian life and the religiosity of the Egyptian character.' },
			{ id: 'eg-c2-u20', title: 'Egypt’s Identity and Globalization', description: 'Egyptian identity in the age of globalization.' },
			{ id: 'eg-c2-u21', title: 'Final Review and Assessment C2', description: 'A comprehensive cumulative activity testing full mastery, and a final accredited assessment test.' }
		]
	}
];

/** Flattened helper: find a topic and its module by topic id. */
export function findEgyptianV2Topic(topicId: string):
	| { module: CurriculumV2Module; topic: CurriculumV2Topic }
	| null {
	for (const module of curriculumEgyptianV2) {
		const topic = module.topics.find((t) => t.id === topicId);
		if (topic) return { module, topic };
	}
	return null;
}
