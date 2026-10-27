/**
 * Which grammar articles a structured lesson leans on. The lesson shows the
 * first article's summary before step 1 and keeps all of them one tap away,
 * so the explanation lives in one place: the grammar reference.
 *
 * v2 topics are matched on their unit (`a1-u06`), which the Egyptian
 * (`eg-a1-u06`) and shared base (`base-a1-u06`) curricula have in common.
 * Legacy topics (Darija's path) are matched on their full id.
 */
import { getGrammarTopic, hasGrammar, type GrammarTopic } from './topics';

const BY_UNIT: Record<string, string[]> = {
	'a1-u03': ['pronouns'],
	'a1-u04': ['demonstratives'],
	'a1-u05': ['numbers-1-10', 'dual'],
	'a1-u06': ['numbers-counting', 'numbers-1-10'],
	'a1-u07': ['possessive-suffixes', 'possession'],
	'a1-u08': ['adjectives', 'noun-gender'],
	'a1-u10': ['question-words'],
	'a1-u11': ['negation'],
	'a1-u12': ['noun-gender'],
	'a1-u16': ['plurals', 'dual'],
	'a1-u18': ['present-tense', 'verb-forms'],
	'a1-u19': ['past-tense', 'verb-classes'],
	'a1-u20': ['adjectives'],
	'a2-u01': ['present-tense'],
	'a2-u04': ['imperative'],
	'a2-u10': ['numbers-counting'],
	'a2-u18': ['comparatives'],
	'b1-u01': ['future'],
	'b1-u02': ['conditional'],
	'b1-u10': ['conditional']
};

const BY_LEGACY_ID: Record<string, string[]> = {
	'm-v2-1-t4': ['adjectives'],
	'm-v2-1-t5': ['possessive-suffixes', 'possession'],
	'm-v2-1-t9': ['numbers-1-10', 'numbers-counting'],
	'm-v2-2-t8': ['numbers-counting'],
	'm-v2-3-t4': ['past-tense', 'verb-classes'],
	'm-v2-4-t3': ['present-tense'],
	'm-v2-4-t5': ['future'],
	'm-v2-5-t2': ['negation'],
	'm-v2-5-t5': ['comparatives'],
	'm-v2-6-t6': ['conditional'],
	'm-v2-9-t6': ['imperative'],
	'm-grammar-t3': ['pronouns'],
	'm-grammar-t4': ['possessive-suffixes'],
	'm-grammar-t5': ['possessive-suffixes'],
	'm-grammar-t6': ['present-tense'],
	'm-grammar-t7': ['past-tense']
};

/** The grammar topics behind a lesson, or none if its dialect has no guide yet. */
export function grammarForLesson(topicId: string | undefined, dialect: string): GrammarTopic[] {
	if (!topicId || !hasGrammar(dialect)) return [];
	const unit = topicId.match(/([abc][12]-u\d+)$/)?.[1];
	const slugs = (unit && BY_UNIT[unit]) || BY_LEGACY_ID[topicId] || [];
	return slugs.map((slug) => getGrammarTopic(slug)).filter((t) => t !== undefined);
}
