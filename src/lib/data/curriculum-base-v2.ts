/**
 * Dialect-neutral BASE curriculum (A1–B2) for v2 lessons.
 *
 * This is the reusable scaffold for dialects OTHER than Egyptian. It stops at B2
 * on purpose — C1/C2 in the source framework are heavily Egypt/literary-specific
 * (colloquial poetry, Al-Azhar, the Nile, Saidi culture…), so higher levels are
 * authored per dialect rather than shared.
 *
 * Titles and descriptions here are region-neutral; the actual dialect-specific
 * vocabulary/sentences are produced at generation time from `getDialectRules`.
 * Egyptian keeps its own bespoke `curriculum-egyptian-v2.ts` (full A1–C2).
 *
 * To give a dialect the A1–B2 path, register it in `curriculum-v2.ts`:
 *   curriculumV2['levantine'] = baseCurriculumV2A1B2;
 */

import type { CurriculumV2Module } from './curriculum-egyptian-v2';

export const baseCurriculumV2A1B2: CurriculumV2Module[] = [
	{
		id: 'base-a1',
		title: 'A1 — Beginner',
		level: 'A1',
		objectives: [
			'Acquire basic vocabulary covering immediate daily needs (introductions, family, numbers, colors, time).',
			'Build simple sentences for everyday use.',
			'Develop accurate pronunciation.',
			'Understand very simple familiar phrases related to concrete needs.'
		],
		topics: [
			{ id: 'base-a1-u02', title: 'Greetings and Introductions', description: 'Phrases for greeting, welcoming, and introducing oneself: name, nationality, occupation.' },
			{ id: 'base-a1-u03', title: 'Subject Pronouns', description: 'Independent subject pronouns (I, you, he, she, we, they) and their use in simple introductory sentences.' },
			{ id: 'base-a1-u04', title: 'Demonstratives', description: 'This, that, these — pointing to people and things.' },
			{ id: 'base-a1-u05', title: 'Numbers from 1 to 10', description: 'Pronouncing and writing numbers and using them in simple counting and prices.' },
			{ id: 'base-a1-u06', title: 'Numbers from 11 to 100', description: 'Forming tens and compound numbers, and using them in everyday contexts.' },
			{ id: 'base-a1-u07', title: 'Family Members', description: 'Family vocabulary: father, mother, brother, sister, grandparents, aunts, uncles, cousins.' },
			{ id: 'base-a1-u08', title: 'Colors and Basic Adjectives', description: 'Names of colors and their agreement with the noun in masculine and feminine.' },
			{ id: 'base-a1-u09', title: 'Days of the Week and Months', description: 'Names of days and months and their use in setting appointments.' },
			{ id: 'base-a1-u10', title: 'Question Words', description: 'Basic question words (what, where, how, when) and forming simple questions and answers.' },
			{ id: 'base-a1-u11', title: 'Common Answers and Reactions', description: 'Everyday answers: yes, no, maybe, sure, God willing, and other common short responses.' },
			{ id: 'base-a1-u12', title: 'At Home', description: 'Vocabulary for home furniture and rooms.' },
			{ id: 'base-a1-u13', title: 'Adverbs of Place and Directions', description: 'Location of things (on, under, beside, above, right, left, inside, in front, behind).' },
			{ id: 'base-a1-u14', title: 'At School', description: 'Classroom vocabulary and school supplies, and simple sentences about daily activity.' },
			{ id: 'base-a1-u15', title: 'Food and Drink', description: 'Names of common foods and drinks.' },
			{ id: 'base-a1-u16', title: 'Singular and Plural', description: 'Singular and plural of the most common everyday words.' },
			{ id: 'base-a1-u17', title: 'Time and the Clock', description: 'Reading the clock and expressing time (morning, noon, evening, night).' },
			{ id: 'base-a1-u18', title: 'The Present Tense', description: 'Conjugating the present tense with singular pronouns in everyday verbs.' },
			{ id: 'base-a1-u19', title: 'The Past Tense', description: 'Conjugating the simple past with singular pronouns to express completed events.' },
			{ id: 'base-a1-u20', title: 'Describing Personal Appearance', description: 'Simple body and face adjectives and briefly describing a person.' },
			{ id: 'base-a1-u21', title: 'Final Review and Assessment A1', description: 'A1-level assessment.' }
		]
	},
	{
		id: 'base-a2',
		title: 'A2 — Lower Intermediate',
		level: 'A2',
		objectives: [
			'Expand the lexicon to cover broader areas of daily life (travel, work, services).',
			'Master the conjugation of past and present verbs with all pronouns.',
			'Describe experiences, past events, and near-future plans in a simplified manner.',
			'Interact in short routine dialogues requiring a direct exchange of information.'
		],
		topics: [
			{ id: 'base-a2-u01', title: 'Daily Routine and Everyday Verbs', description: 'Daily routine and daily activities.' },
			{ id: 'base-a2-u02', title: 'Clothing', description: 'Clothing for men, women, and children.' },
			{ id: 'base-a2-u03', title: 'The Kitchen and Its Tools', description: 'Describing the kitchen, kitchen tools, and cooking.' },
			{ id: 'base-a2-u04', title: 'The Imperative', description: 'Forming and using commands (run, play, wait, stand here, go).' },
			{ id: 'base-a2-u05', title: 'Sports', description: 'Different types of sports (football, basketball, tennis, swimming, etc.).' },
			{ id: 'base-a2-u06', title: 'The Body and Health', description: 'Names of body parts and expressing simple pain (I have a headache).' },
			{ id: 'base-a2-u07', title: 'Weather and Seasons', description: 'Weather vocabulary, the four seasons, and expressing weather conditions.' },
			{ id: 'base-a2-u08', title: 'Means of Transportation', description: 'Names of transportation and expressing how to get to a place.' },
			{ id: 'base-a2-u09', title: 'Asking for Directions', description: 'Phrases for asking the way and understanding simple instructions.' },
			{ id: 'base-a2-u10', title: 'Shopping', description: 'Shopping at the supermarket or mall.' },
			{ id: 'base-a2-u11', title: 'Favorite Hobbies', description: 'Expressing simple hobbies using "I like / I don’t like".' },
			{ id: 'base-a2-u12', title: 'Animals', description: 'Talking about wild animals.' },
			{ id: 'base-a2-u13', title: 'The Farm', description: 'Talking about the farm and farm animals and birds.' },
			{ id: 'base-a2-u14', title: 'Vegetables, Fruits, and Dishes', description: 'Vegetables, fruits, and common dishes.' },
			{ id: 'base-a2-u15', title: 'Health and Illness', description: 'Describing simple symptoms, a dialogue with the doctor, and asking for medicine.' },
			{ id: 'base-a2-u16', title: 'Job Interview 1', description: 'The job interview, qualifications, and experience.' },
			{ id: 'base-a2-u17', title: 'At the Restaurant', description: 'A short dialogue for ordering food and drink and paying, with polite phrases.' },
			{ id: 'base-a2-u18', title: 'Preferences', description: 'Preference and comparative adjectives (more than, less than, taller than…).' },
			{ id: 'base-a2-u19', title: 'Adverbs of Time and Place', description: 'Using adverbs such as today, yesterday, tomorrow, here, there in simple sentences.' },
			{ id: 'base-a2-u20', title: 'Directions and Transport in the City', description: 'Giving detailed instructions to reach a place using different means of transport.' },
			{ id: 'base-a2-u21', title: 'Test and Assessment A2', description: 'A2-level assessment.' }
		]
	},
	{
		id: 'base-b1',
		title: 'B1 — Intermediate',
		level: 'B1',
		objectives: [
			'Produce coherent texts on familiar topics or topics of personal interest.',
			'Understand the main ideas in clear texts in simplified language.',
			'Participate in dialogues on general topics without prior preparation.',
			'Justify opinions and briefly explain plans, giving reasons and explanations.'
		],
		topics: [
			{ id: 'base-b1-u01', title: 'Trips and Entertainment', description: 'Trips, entertainment venues, and vacation.' },
			{ id: 'base-b1-u02', title: 'The Conditional', description: 'Conditional particles (if, unless) and forming conditional sentences; relative pronouns.' },
			{ id: 'base-b1-u03', title: 'Travel and Camping', description: 'Travel, trips, and camping.' },
			{ id: 'base-b1-u04', title: 'Travel and Booking Tickets', description: 'Airport and train vocabulary, booking a ticket, and asking about schedules.' },
			{ id: 'base-b1-u05', title: 'Exclamations and Emphasis', description: 'Exclamatory expressions and emphatic phrases used in everyday speech.' },
			{ id: 'base-b1-u06', title: 'Talking About Daily Life', description: 'A model of a day in a person’s life.' },
			{ id: 'base-b1-u07', title: 'Customs and Religious Practices', description: 'Everyday customs and religious practices.' },
			{ id: 'base-b1-u08', title: 'Feelings and Emotions', description: 'Talking about feelings and emotions.' },
			{ id: 'base-b1-u09', title: 'At the Hotel', description: 'Booking, inquiring about hotel services, and making a simple complaint.' },
			{ id: 'base-b1-u10', title: 'Expressing Wishes and Hopes', description: 'Using "I wish / hopefully / when I grow up" to express desires and ambitions.' },
			{ id: 'base-b1-u11', title: 'Professions and Jobs', description: 'Vocabulary for professions and expressing the workplace and its nature.' },
			{ id: 'base-b1-u12', title: 'Electrical and Household Appliances', description: 'Electrical appliances, home furnishings, and household devices.' },
			{ id: 'base-b1-u13', title: 'Drama', description: 'Cinema, films, and TV series.' },
			{ id: 'base-b1-u14', title: 'The News Bulletin', description: 'Following and summarizing a news bulletin.' },
			{ id: 'base-b1-u15', title: 'Invitations and Occasions', description: 'An invitation to a social occasion and replying with acceptance or apology.' },
			{ id: 'base-b1-u16', title: 'Expressing a Simple Opinion', description: 'Phrases for giving a simple opinion (I think, in my opinion) about familiar topics.' },
			{ id: 'base-b1-u17', title: 'Suggestions and Reasons', description: 'Making suggestions, giving reasons, and expressing opinion.' },
			{ id: 'base-b1-u18', title: 'Eating Habits', description: 'Eating habits.' },
			{ id: 'base-b1-u19', title: 'Certainty, Probability, and Doubt', description: 'Expressing degrees of certainty and probability (probably, maybe, definitely).' },
			{ id: 'base-b1-u20', title: 'Social Life and Relationships', description: 'Social relationships, neighbors, and renting accommodation.' },
			{ id: 'base-b1-u21', title: 'Test and Assessment B1', description: 'B1-level assessment.' }
		]
	},
	{
		id: 'base-b2',
		title: 'B2 — Upper Intermediate',
		level: 'B2',
		objectives: [
			'Understand more specialized texts on a range of topics.',
			'Interact fluently and spontaneously with native speakers.',
			'Explain different points of view on contemporary issues.',
			'Produce clear, detailed text and argue a position.'
		],
		topics: [
			{ id: 'base-b2-u01', title: 'A Visit to the Country', description: 'Visiting a country where the dialect is spoken: landmarks, weather, and the warmth of the people.' },
			{ id: 'base-b2-u02', title: 'Geography and Regions', description: 'Cities and regions, their geography, and the nature of life in them.' },
			{ id: 'base-b2-u03', title: 'Ramadan and Holidays', description: 'Ramadan and the major religious and cultural holidays.' },
			{ id: 'base-b2-u04', title: 'Arab Countries and Their Cultures', description: 'Arab countries and cultures, their customs, clothing, and holidays.' },
			{ id: 'base-b2-u05', title: 'History and Heritage', description: 'Historical sites and cultural heritage of the region.' },
			{ id: 'base-b2-u06', title: 'Modern History', description: 'Modern history of the region and notable events.' },
			{ id: 'base-b2-u07', title: 'Describing Personal Experiences', description: 'Narrating a relatively long story with sequential events and precise time links.' },
			{ id: 'base-b2-u08', title: 'Job Interview 2', description: 'More professions and advanced job interviews.' },
			{ id: 'base-b2-u09', title: 'Technology and the Internet', description: 'Modern technology vocabulary, and discussing the pros and cons of its use.' },
			{ id: 'base-b2-u10', title: 'Media', description: 'Vocabulary for the press, radio, and television, and summarizing a news item.' },
			{ id: 'base-b2-u11', title: 'Education and Its Systems', description: 'Discussing the education system and comparing learning methods.' },
			{ id: 'base-b2-u12', title: 'Travel and Cultures', description: 'Describing a cultural travel experience and comparing customs between two countries.' },
			{ id: 'base-b2-u13', title: 'The Environment and Its Issues', description: 'Environment and pollution vocabulary, and proposals for preservation.' },
			{ id: 'base-b2-u14', title: 'Science and Innovation', description: 'Reading a popular-science text and discussing modern inventions.' },
			{ id: 'base-b2-u15', title: 'Fashion', description: 'Gifts, accessories, makeup, and fashion.' },
			{ id: 'base-b2-u16', title: 'Law, Order, and Rights', description: 'A story about law, rights, and order.' },
			{ id: 'base-b2-u17', title: 'The Work Environment and Presentations', description: 'Operating within the work environment, discussions, and presentations.' },
			{ id: 'base-b2-u18', title: 'Secondary and University Study', description: 'Secondary and university study and related topics: graduation, grades, admissions.' },
			{ id: 'base-b2-u19', title: 'The Economy', description: 'Economic matters: money, the stock exchange, shares, gold, and the exchange rate.' },
			{ id: 'base-b2-u20', title: 'Entrepreneurship', description: 'Entrepreneurship, projects, profits, feasibility studies, costs, and needs.' },
			{ id: 'base-b2-u21', title: 'Final Review and Assessment B2', description: 'A comprehensive B2-level assessment.' }
		]
	}
];
