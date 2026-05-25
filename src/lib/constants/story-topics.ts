export type TopicSection = 'start-here' | 'topics';

export interface StoryTopic {
	id: string;
	name: string;
	emoji: string;
	section: TopicSection;
	/** 1-sentence brief passed as `description` to the create-story API */
	promptTemplate: string;
}

export const STORY_TOPICS: StoryTopic[] = [
	// ── Start Here ─────────────────────────────────────────────────────────────
	{
		id: 'greetings',
		name: 'Greetings',
		emoji: '👋',
		section: 'start-here',
		promptTemplate: 'TOPIC: Greetings. Every sentence must involve characters greeting each other, saying hello, goodbye, or asking how someone is doing. The entire story revolves around these greeting exchanges.'
	},
	{
		id: 'introducing-yourself',
		name: 'Introducing Yourself',
		emoji: '🤝',
		section: 'start-here',
		promptTemplate: 'TOPIC: Self-introduction. Every sentence must be about a character introducing themselves — their name, where they are from, what they do, and personal details. The story must stay entirely on the topic of meeting someone and sharing who you are.'
	},
	{
		id: 'ordering-food',
		name: 'Ordering Food',
		emoji: '🍽️',
		section: 'start-here',
		promptTemplate: 'TOPIC: Ordering food. The entire story must take place at a restaurant or café. Every sentence must relate to looking at a menu, asking the waiter questions, ordering dishes, and receiving the food. Do not stray from this setting.'
	},
	{
		id: 'asking-directions',
		name: 'Getting Around',
		emoji: '🗺️',
		section: 'start-here',
		promptTemplate: 'TOPIC: Asking for directions. Every sentence must involve someone asking for or giving directions in a city — street names, landmarks, left/right/straight, near/far. The story must stay entirely on the topic of navigating from one place to another.'
	},
	{
		id: 'shopping',
		name: 'Shopping',
		emoji: '🛍️',
		section: 'start-here',
		promptTemplate: 'TOPIC: Shopping. The entire story must be set in a market or shop. Every sentence must relate to browsing items, asking about prices, negotiating, and paying. Do not leave the shopping context.'
	},
	{
		id: 'numbers-counting',
		name: 'Numbers & Counting',
		emoji: '🔢',
		section: 'start-here',
		promptTemplate: 'TOPIC: Numbers and counting. Every sentence must contain at least one number — prices, quantities, ages, times, phone numbers, addresses, scores. Numbers and counting must be the central thread of the entire story.'
	},
	{
		id: 'days-and-time',
		name: 'Days & Time',
		emoji: '📅',
		section: 'start-here',
		promptTemplate: 'TOPIC: Days of the week and telling the time. Every sentence must mention a specific day, time, date, or scheduling detail. The story must be entirely about planning, appointments, or a schedule.'
	},
	{
		id: 'family',
		name: 'Family',
		emoji: '👨‍👩‍👧',
		section: 'start-here',
		promptTemplate: 'TOPIC: Family members. Every sentence must mention a family member by relationship (mother, father, brother, sister, grandmother, etc.) and what they are doing together. The story must revolve entirely around family interactions at home.'
	},
	{
		id: 'at-the-cafe',
		name: 'At the Café',
		emoji: '☕',
		section: 'start-here',
		promptTemplate: 'TOPIC: At a café. The entire story must be set inside a café. Every sentence must relate to drinks, pastries, the ambiance, the staff, or conversation happening at the café. Do not leave the café setting.'
	},
	{
		id: 'daily-routine',
		name: 'Daily Routine',
		emoji: '🌅',
		section: 'start-here',
		promptTemplate: 'TOPIC: Daily routine. Every sentence must describe a specific step in a character\'s morning or evening routine — waking up, washing, eating, getting dressed, commuting. Follow the routine in chronological order from start to finish.'
	},

	// ── All Topics ─────────────────────────────────────────────────────────────
	{
		id: 'travel',
		name: 'Travel',
		emoji: '✈️',
		section: 'topics',
		promptTemplate: 'TOPIC: Travel. The entire story must be about travelling — packing a bag, arriving at an airport or train station, boarding, landing, and arriving somewhere new. Every sentence must relate directly to the travel experience.'
	},
	{
		id: 'work-career',
		name: 'Work & Career',
		emoji: '💼',
		section: 'topics',
		promptTemplate: 'TOPIC: Work and career. The entire story must be set in a workplace. Every sentence must relate to work tasks, colleagues, a meeting, a job interview, or a professional challenge. Do not leave the work context.'
	},
	{
		id: 'food-cooking',
		name: 'Food & Cooking',
		emoji: '🍳',
		section: 'topics',
		promptTemplate: 'TOPIC: Cooking. The entire story must be set in a kitchen. Every sentence must describe a step in cooking a dish — chopping, mixing, heating, tasting, and serving. Stay in the kitchen from start to finish.'
	},
	{
		id: 'health',
		name: 'Health & Body',
		emoji: '🏥',
		section: 'topics',
		promptTemplate: 'TOPIC: Health and the doctor. The entire story must be set in a clinic or pharmacy. Every sentence must relate to symptoms, the doctor\'s examination, a diagnosis, medicine, or health advice. Stay entirely in the medical context.'
	},
	{
		id: 'education',
		name: 'Education',
		emoji: '📚',
		section: 'topics',
		promptTemplate: 'TOPIC: Education and school. The entire story must be set in a classroom, school, or university. Every sentence must relate to studying, a lesson, homework, exams, or a teacher-student interaction.'
	},
	{
		id: 'weather',
		name: 'Weather & Seasons',
		emoji: '🌤️',
		section: 'topics',
		promptTemplate: 'TOPIC: Weather. Every sentence must describe or react to the weather — rain, heat, wind, clouds, temperature, or a seasonal change. The weather must drive everything that happens in the story.'
	},
	{
		id: 'home',
		name: 'Home Life',
		emoji: '🏠',
		section: 'topics',
		promptTemplate: 'TOPIC: Life at home. The entire story must be set inside a home. Every sentence must describe a domestic activity — cleaning, cooking, watching TV, having guests, or a conversation between housemates or family members.'
	},
	{
		id: 'entertainment',
		name: 'Entertainment',
		emoji: '🎬',
		section: 'topics',
		promptTemplate: 'TOPIC: Entertainment. The entire story must be about going to the cinema, watching a film, attending a show, or listening to music. Every sentence must relate to the entertainment experience — the venue, the performance, and the reactions.'
	},
	{
		id: 'sports-fitness',
		name: 'Sports & Fitness',
		emoji: '🏃',
		section: 'topics',
		promptTemplate: 'TOPIC: Sports and exercise. The entire story must be set on a sports field, gym, or court. Every sentence must relate to physical activity — training, competing, scoring, or discussing a sport.'
	},
	{
		id: 'nature-animals',
		name: 'Nature & Animals',
		emoji: '🌿',
		section: 'topics',
		promptTemplate: 'TOPIC: Nature and animals. The entire story must be set outdoors in nature. Every sentence must describe the natural environment — plants, animals, the landscape, sounds, and smells of the natural world.'
	},
	{
		id: 'emotions',
		name: 'Emotions & Feelings',
		emoji: '😊',
		section: 'topics',
		promptTemplate: 'TOPIC: Emotions and feelings. Every sentence must explicitly name or describe an emotion a character is experiencing and explain why they feel that way. Happiness, sadness, fear, excitement, and surprise must be central to every sentence.'
	},
	{
		id: 'celebrations',
		name: 'Culture & Celebrations',
		emoji: '🎉',
		section: 'topics',
		promptTemplate: 'TOPIC: Celebrations. The entire story must take place during a cultural celebration or festival. Every sentence must relate to the festivities — decorations, food, music, family gathering, traditions, and the occasion being celebrated.'
	},
	{
		id: 'technology',
		name: 'Technology',
		emoji: '📱',
		section: 'topics',
		promptTemplate: 'TOPIC: Technology. Every sentence must involve a specific piece of technology — a phone, computer, app, or device. The story must revolve entirely around using, troubleshooting, or discovering technology.'
	},
	{
		id: 'history-traditions',
		name: 'History & Traditions',
		emoji: '🏛️',
		section: 'topics',
		promptTemplate: 'TOPIC: History and Arab traditions. The entire story must be set at a historical site or involve a traditional cultural practice. Every sentence must reference history, heritage, or a long-standing tradition from the Arab world.'
	},
	{
		id: 'music-arts',
		name: 'Music & Arts',
		emoji: '🎵',
		section: 'topics',
		promptTemplate: 'TOPIC: Music and art. The entire story must be about creating, performing, or experiencing music or visual art. Every sentence must relate to an instrument, a song, a painting, a concert, or an artistic process.'
	},
	{
		id: 'friendship',
		name: 'Friendship',
		emoji: '🫂',
		section: 'topics',
		promptTemplate: 'TOPIC: Friendship. Every sentence must be about the relationship between two or more friends — spending time together, helping each other, resolving a disagreement, or reminiscing about shared memories. Stay entirely on the theme of friendship.'
	},
	{
		id: 'business-economy',
		name: 'Business',
		emoji: '💰',
		section: 'topics',
		promptTemplate: 'TOPIC: Business and money. The entire story must be about a business situation — negotiating a deal, managing a shop, discussing prices, or starting a small venture. Every sentence must relate directly to commerce or money.'
	},
	{
		id: 'humor',
		name: 'Humor & Comedy',
		emoji: '😄',
		section: 'topics',
		promptTemplate: 'TOPIC: Comedy and misunderstanding. Every sentence must build toward or be part of a funny situation — a misunderstanding, a mix-up, an embarrassing moment, or a comic reaction. The entire story must be lighthearted and amusing.'
	},
	{
		id: 'childhood-memories',
		name: 'Childhood',
		emoji: '🧒',
		section: 'topics',
		promptTemplate: 'TOPIC: Childhood memories. Every sentence must be a specific memory from childhood — a game, a school moment, a family trip, or a lesson learned as a child. The story must be told entirely from the perspective of remembering the past.'
	},
	{
		id: 'science-curiosity',
		name: 'Science & Discovery',
		emoji: '🔬',
		section: 'topics',
		promptTemplate: 'TOPIC: Science and discovery. Every sentence must describe a specific scientific observation, experiment, or discovery. The story must stay entirely on the topic of how something works or what someone learned through curiosity and investigation.'
	}
];

export const START_HERE_TOPICS = STORY_TOPICS.filter(t => t.section === 'start-here');
export const ALL_TOPICS = STORY_TOPICS.filter(t => t.section === 'topics');
