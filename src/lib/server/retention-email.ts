/**
 * What the weekly recap and comeback emails say (docs/retention-daily-goal-plan.md).
 * Pure, so the copy can be tested; the crons fetch the numbers and send.
 */
import type { ActivityCounts } from '$lib/constants/daily-goal';
import type { BrandedEmail } from './email';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Where "keep going" leads: their unfinished lesson, or home. */
export interface NextStep {
	label: string;
	path: string;
}

export const HOME_STEP: NextStep = { label: 'Pick up where you left off', path: '/' };

/** Their unfinished lesson, from the same "last content" the home page resumes. */
export function nextStep(user: {
	last_content_type?: string | null;
	last_content_id?: string | null;
	last_content_dialect?: string | null;
	last_content_position?: number | null;
}): NextStep {
	if (user.last_content_type === 'lessons' && user.last_content_id && user.last_content_dialect) {
		const params = new URLSearchParams({
			lessonId: user.last_content_id,
			step: String(user.last_content_position ?? 0)
		});
		return {
			label: 'Finish your lesson',
			path: `/lessons/structured/${user.last_content_dialect}?${params}`
		};
	}
	return HOME_STEP;
}

export interface WeekRecap {
	daysActive: number;
	counts: ActivityCounts;
	wordsSaved: number;
	streak: number;
	longestStreak: number;
	deckSize: number;
	dueWords: number;
	totalLessons: number;
	isSubscriber: boolean;
	/** "review 10 words and play a game", if they set a daily goal. */
	goalText: string | null;
	next: NextStep;
}

function reviewOr(dueWords: number, next: NextStep): BrandedEmail['cta'] {
	return dueWords > 0
		? { label: `Review ${plural(dueWords, 'word', 'words')}`, path: '/review' }
		: next;
}

/** The Sunday email. Null for a free learner who didn't practise: the comeback emails cover them. */
export function weeklyRecapEmail(r: WeekRecap): BrandedEmail | null {
	if (r.daysActive > 0) {
		const c = r.counts;
		const stats = [
			c.review && `${plural(c.review, 'word', 'words')} reviewed`,
			r.wordsSaved && `${plural(r.wordsSaved, 'new word', 'new words')} saved`,
			c.lesson && `${plural(c.lesson, 'lesson', 'lessons')} finished`,
			c.story && `${plural(c.story, 'story', 'stories')} read`,
			c.game && `${plural(c.game, 'game', 'games')} played`,
			c.speak && `${plural(c.speak, 'sentence', 'sentences')} said out loud`,
			c.tutor && `${plural(c.tutor, 'conversation', 'conversations')} with your tutor`
		].filter((s): s is string => !!s);

		const streak = r.streak > 1 ? `, and you're on a ${r.streak}-day streak` : '';
		const paragraphs = [
			`You practised on ${plural(
				r.daysActive,
				'day',
				'days'
			)} this week${streak}. Here's what you did:`
		];
		if (r.deckSize > 0)
			paragraphs.push(`Your review deck now holds ${plural(r.deckSize, 'word', 'words')}.`);
		paragraphs.push(
			r.goalText
				? `Your daily goal: ${r.goalText}. Same again this week?`
				: 'Want a target for next week? Set a daily goal on your home page: a game, a chat with your tutor, a few sentences out loud.'
		);

		return {
			subject: `Your week in Arabic: ${plural(r.daysActive, 'day', 'days')} of practice`,
			heading: 'Your week in Arabic',
			paragraphs,
			stats,
			cta: reviewOr(r.dueWords, r.next)
		};
	}

	if (!r.isSubscriber) return null;

	const stats = [
		r.deckSize > 0 && `${plural(r.deckSize, 'word', 'words')} in your review deck`,
		r.totalLessons > 0 && `${plural(r.totalLessons, 'lesson', 'lessons')} done`,
		r.longestStreak > 1 && `A best streak of ${r.longestStreak} days`
	].filter((s): s is string => !!s);

	return {
		subject:
			r.dueWords > 0
				? `${plural(r.dueWords, 'word is', 'words are')} waiting for you`
				: 'Your Arabic is waiting for you',
		heading: 'We missed you this week',
		paragraphs: [
			stats.length > 0
				? "You didn't practise this week, but everything you've built is still here:"
				: "You didn't practise this week. Your plan is ready when you are.",
			'Your plan includes the tutor, every lesson and story, and unlimited games. Ten minutes is enough to pick it back up.'
		],
		stats,
		cta: reviewOr(r.dueWords, r.next)
	};
}

export interface Comeback {
	/** Days since they were last active: 3 or 7. */
	day: number;
	dueWords: number;
	deckSize: number;
	totalLessons: number;
	goalText: string | null;
	next: NextStep;
}

export function comebackEmail(c: Comeback): BrandedEmail {
	const goal = c.goalText ? [`Your daily goal is still set: ${c.goalText}.`] : [];

	if (c.dueWords > 0) {
		return {
			subject: `${plural(c.dueWords, 'word is', 'words are')} waiting in your deck`,
			heading: `${plural(c.dueWords, 'word is', 'words are')} ready for review`,
			paragraphs: [
				'You saved them, and now they’re due. Going over them now, while you still half-remember them, is what makes them stick.',
				...goal
			],
			cta: { label: `Review ${plural(c.dueWords, 'word', 'words')}`, path: '/review' }
		};
	}

	const built = [
		c.totalLessons > 0 && plural(c.totalLessons, 'lesson', 'lessons'),
		c.deckSize > 0 && `${plural(c.deckSize, 'saved word', 'saved words')}`
	].filter(Boolean);

	return {
		subject: c.day >= 7 ? 'Still learning Arabic?' : 'Pick your Arabic back up',
		heading: c.day >= 7 ? 'Still learning Arabic?' : 'Pick up where you left off',
		paragraphs: [
			built.length > 0
				? `It's been ${c.day} days. You have ${built.join(' and ')}, and it's all still here.`
				: `It's been ${c.day} days. One short session gets you going again.`,
			...goal
		],
		cta: c.next
	};
}
