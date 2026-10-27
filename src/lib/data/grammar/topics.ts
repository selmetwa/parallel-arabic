/**
 * The grammar reference: one topic list shared by every dialect, with a body
 * per dialect in `./{dialect}/{slug}.md`. A dialect has a grammar guide once
 * it has a body for every topic.
 */

export type GrammarLevel = 'A1' | 'A2' | 'B1';

export interface GrammarTopic {
	slug: string;
	title: string;
	level: GrammarLevel;
	summary: string;
	related: string[];
	/** The custom-lesson focus area that practises this topic, if one fits. */
	practiceTopic?: string;
	/** The page title, phrased the way people search; {D} is the dialect's name. */
	searchTitle: string;
}

export const GRAMMAR_DIALECTS = ['egyptian-arabic', 'levantine', 'darija', 'fusha'] as const;

export function hasGrammar(dialect: string): boolean {
	return (GRAMMAR_DIALECTS as readonly string[]).includes(dialect);
}

export const GRAMMAR_LEVELS: { level: GrammarLevel; label: string }[] = [
	{ level: 'A1', label: 'Foundations' },
	{ level: 'A2', label: 'Building sentences' },
	{ level: 'B1', label: 'Going further' }
];

export const GRAMMAR_TOPICS: GrammarTopic[] = [
	{
		slug: 'pronouns',
		searchTitle: '{D} Pronouns: I, You, He, She, We, They',
		title: 'Personal pronouns',
		level: 'A1',
		summary: 'I, you, he, she, we, they, and the masculine/feminine "you".',
		related: ['possessive-suffixes', 'present-tense']
	},
	{
		slug: 'demonstratives',
		searchTitle: 'This and That in {D} (Demonstratives)',
		title: 'This and that',
		level: 'A1',
		summary: 'Pointing words, and where they sit in the sentence.',
		related: ['noun-gender', 'adjectives']
	},
	{
		slug: 'noun-gender',
		searchTitle: 'Masculine and Feminine Nouns in {D}',
		title: 'Masculine and feminine nouns',
		level: 'A1',
		summary: 'How to tell a noun\'s gender, and why it matters.',
		related: ['adjectives', 'plurals']
	},
	{
		slug: 'plurals',
		searchTitle: '{D} Plurals: Sound and Broken Plurals',
		title: 'Plurals',
		level: 'A1',
		summary: 'Sound plurals with endings, and "broken" plurals that change shape.',
		related: ['dual', 'numbers-counting'],
		practiceTopic: 'noun plurals'
	},
	{
		slug: 'dual',
		searchTitle: 'The Dual in {D}: How to Say "Two" of Something',
		title: 'The dual: two of something',
		level: 'A1',
		summary: 'A special ending for exactly two.',
		related: ['plurals', 'numbers-counting']
	},
	{
		slug: 'possessive-suffixes',
		searchTitle: '{D} Possessive Suffixes: My, Your, His, Her',
		title: 'Possessive suffixes (my, your, his…)',
		level: 'A1',
		summary: 'The endings ـي، ـك، ـه… for possession, objects and prepositions.',
		related: ['pronouns', 'possession'],
		practiceTopic: 'possessive suffixes'
	},
	{
		slug: 'possession',
		searchTitle: 'Possession in {D}: Saying "Of" and "Mine"',
		title: 'Possession: "of" and "own"',
		level: 'A1',
		summary: 'Putting two nouns together (iḍāfa) and the word for "belonging to".',
		related: ['possessive-suffixes', 'noun-gender']
	},
	{
		slug: 'adjectives',
		searchTitle: '{D} Adjectives: Word Order and Agreement',
		title: 'Adjectives and agreement',
		level: 'A1',
		summary: 'Adjectives come after the noun and match it.',
		related: ['noun-gender', 'comparatives']
	},
	{
		slug: 'numbers-1-10',
		searchTitle: '{D} Numbers 1 to 10',
		title: 'Numbers 1 to 10',
		level: 'A1',
		summary: 'The numbers themselves, and their short forms before a noun.',
		related: ['numbers-counting', 'dual'],
		practiceTopic: 'numbers'
	},
	{
		slug: 'numbers-counting',
		searchTitle: 'Counting in {D}: Numbers 11 to 1,000 and the Singular Rule',
		title: 'Counting things: 11 and up',
		level: 'A1',
		summary: 'Why "30 apple" is correct Arabic: which noun form follows each number.',
		related: ['numbers-1-10', 'plurals'],
		practiceTopic: 'numbers'
	},
	{
		slug: 'question-words',
		searchTitle: '{D} Question Words: What, Where, When, Why, How',
		title: 'Question words',
		level: 'A1',
		summary: 'What, where, when, why, how, who, how much.',
		related: ['negation', 'present-tense']
	},
	{
		slug: 'present-tense',
		searchTitle: '{D} Present Tense Conjugation',
		title: 'The present tense',
		level: 'A1',
		summary: 'Person prefixes, plus the dialect\'s marker for "now" or "usually".',
		related: ['past-tense', 'future', 'verb-forms'],
		practiceTopic: 'present tense'
	},
	{
		slug: 'past-tense',
		searchTitle: '{D} Past Tense Conjugation',
		title: 'The past tense',
		level: 'A1',
		summary: 'One stem, eight endings.',
		related: ['present-tense', 'verb-classes'],
		practiceTopic: 'past tense'
	},
	{
		slug: 'future',
		searchTitle: 'Future Tense in {D}',
		title: 'The future',
		level: 'A2',
		summary: 'One small prefix or word in front of the present.',
		related: ['present-tense', 'negation'],
		practiceTopic: 'future tense'
	},
	{
		slug: 'negation',
		searchTitle: 'Negation in {D}: How to Say "Not"',
		title: 'Saying "not"',
		level: 'A2',
		summary: 'Negating verbs, nouns and adjectives.',
		related: ['past-tense', 'present-tense']
	},
	{
		slug: 'imperative',
		searchTitle: '{D} Imperative: How to Give Commands',
		title: 'Commands (the imperative)',
		level: 'A2',
		summary: 'Telling one man, one woman or a group to do something.',
		related: ['present-tense', 'negation']
	},
	{
		slug: 'verb-forms',
		searchTitle: 'Arabic Verb Forms I to X, Explained for {D}',
		title: 'Roots and verb forms (Form I–X)',
		level: 'A2',
		summary: 'How three root letters and a pattern make a verb.',
		related: ['verb-classes', 'present-tense'],
		practiceTopic: 'verb conjugation'
	},
	{
		slug: 'verb-classes',
		searchTitle: '{D} Verb Types: Sound, Hollow, Defective and Doubled',
		title: 'Verb classes: sound, hollow, defective, doubled',
		level: 'A2',
		summary: 'Why some verbs change shape when they conjugate.',
		related: ['verb-forms', 'past-tense'],
		practiceTopic: 'verb conjugation'
	},
	{
		slug: 'conditional',
		searchTitle: '"If" in {D}: Conditional Sentences',
		title: 'If… (conditionals)',
		level: 'B1',
		summary: 'Real and imagined conditions.',
		related: ['past-tense', 'future']
	},
	{
		slug: 'comparatives',
		searchTitle: '{D} Comparatives and Superlatives',
		title: 'Comparing: bigger, the biggest',
		level: 'B1',
		summary: 'One pattern for both "bigger" and "biggest".',
		related: ['adjectives']
	}
];

/** "Egyptian Arabic Possessive Suffixes: My, Your, His, Her" */
export function grammarSearchTitle(topic: GrammarTopic, dialectName: string): string {
	return topic.searchTitle.replace('{D}', dialectName);
}

export function getGrammarTopic(slug: string): GrammarTopic | undefined {
	return GRAMMAR_TOPICS.find((t) => t.slug === slug);
}
