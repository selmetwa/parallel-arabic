import { describe, expect, it, vi } from 'vitest';
import { NO_ACTIVITY } from '$lib/constants/daily-goal';

vi.mock('./email', () => ({}));
const { comebackEmail, weeklyRecapEmail } = await import('./retention-email');

const home = { label: 'Pick up where you left off', path: '/' };
const recap = {
	daysActive: 0,
	counts: NO_ACTIVITY,
	wordsSaved: 0,
	streak: 0,
	longestStreak: 0,
	deckSize: 0,
	dueWords: 0,
	totalLessons: 0,
	isSubscriber: false,
	goalText: null,
	next: home
};

describe('weeklyRecapEmail', () => {
	it('lists only what they did, and sends them to their due words', () => {
		const email = weeklyRecapEmail({
			...recap,
			daysActive: 3,
			counts: { ...NO_ACTIVITY, review: 12, game: 1 },
			streak: 3,
			dueWords: 5
		});
		expect(email?.subject).toBe('Your week in Arabic: 3 days of practice');
		expect(email?.stats).toEqual(['12 words reviewed', '1 game played']);
		expect(email?.paragraphs[0]).toContain('3-day streak');
		expect(email?.cta).toEqual({ label: 'Review 5 words', path: '/review' });
	});

	it('reminds a quiet subscriber what they have, and skips a quiet free learner', () => {
		expect(weeklyRecapEmail(recap)).toBeNull();
		const email = weeklyRecapEmail({ ...recap, isSubscriber: true, deckSize: 40, totalLessons: 6 });
		expect(email?.heading).toBe('We missed you this week');
		expect(email?.stats).toEqual(['40 words in your review deck', '6 lessons done']);
		expect(email?.cta).toBe(home);
	});
});

describe('comebackEmail', () => {
	it('leads with due words when there are any', () => {
		const email = comebackEmail({
			day: 3,
			dueWords: 1,
			deckSize: 9,
			totalLessons: 0,
			goalText: null,
			next: home
		});
		expect(email.subject).toBe('1 word is waiting in your deck');
		expect(email.cta.path).toBe('/review');
	});

	it('otherwise reminds them what they built', () => {
		const email = comebackEmail({
			day: 7,
			dueWords: 0,
			deckSize: 0,
			totalLessons: 4,
			goalText: 'play a game',
			next: home
		});
		expect(email.subject).toBe('Still learning Arabic?');
		expect(email.paragraphs).toEqual([
			"It's been 7 days. You have 4 lessons, and it's all still here.",
			'Your daily goal is still set: play a game.'
		]);
	});
});
