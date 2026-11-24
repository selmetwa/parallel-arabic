import { describe, expect, it } from 'vitest';
import { NO_ACTIVITY } from './daily-goal';
import { pickQuests, questProgress, weekStartKey, type QuestEligibility } from './quests';

const open: QuestEligibility = {
	reviewable: 40,
	lessonHref: '/lessons/structured/levantine?lessonId=base-a1-u02',
	goalKinds: []
};
const counts = { ...NO_ACTIVITY, saved: 0, tutorMessages: 0 };

describe('pickQuests', () => {
	it('picks three, the same for the same user and day', () => {
		const a = pickQuests('u1', '2026-11-24', open).map((q) => q.id);
		expect(a).toHaveLength(3);
		expect(pickQuests('u1', '2026-11-24', open).map((q) => q.id)).toEqual(a);
	});

	it('changes from day to day', () => {
		const days = ['2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28'];
		const picks = new Set(days.map((d) => pickQuests('u1', d, open).map((q) => q.id).join()));
		expect(picks.size).toBeGreaterThan(1);
	});

	it('leaves out quests they cannot do', () => {
		const closed = { ...open, reviewable: 5, lessonHref: null };
		for (const day of ['2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27']) {
			const ids = pickQuests('u2', day, closed).map((q) => q.id);
			expect(ids).not.toContain('review');
			expect(ids).not.toContain('lesson');
		}
	});

	it('avoids repeating what is on their path', () => {
		const e = { ...open, goalKinds: ['review', 'game', 'lesson'] as QuestEligibility['goalKinds'] };
		for (const day of ['2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27']) {
			const ids = pickQuests('u3', day, e).map((q) => q.id);
			expect(ids).not.toContain('review');
			expect(ids).not.toContain('games');
			expect(ids).not.toContain('lesson');
		}
	});

	it('sends the lesson quest to the lesson the path would open', () => {
		const e = { ...open, goalKinds: [] };
		for (let i = 1; i <= 28; i++) {
			const quest = pickQuests('u4', `2026-11-${String(i).padStart(2, '0')}`, e).find(
				(q) => q.id === 'lesson'
			);
			if (quest) {
				expect(quest.href).toBe(open.lessonHref);
				return;
			}
		}
		throw new Error('lesson quest never picked in 28 days');
	});
});

describe('questProgress', () => {
	it('counts each quest from its own activity, capped at the target', () => {
		const picked = pickQuests('u1', '2026-11-24', open);
		const progress = questProgress(picked, {
			...counts,
			review: 30,
			saved: 1,
			speak: 5,
			write: 3,
			game: 9,
			lesson: 1,
			tutorMessages: 6,
			story: 1
		});
		for (const p of progress) {
			expect(p.done).toBeLessThanOrEqual(p.target);
			expect(p.complete).toBe(p.id !== 'save');
		}
	});
});

describe('weekStartKey', () => {
	it('finds the Monday', () => {
		expect(weekStartKey('2026-11-24')).toBe('2026-11-23'); // Tuesday
		expect(weekStartKey('2026-11-23')).toBe('2026-11-23'); // Monday
		expect(weekStartKey('2026-11-29')).toBe('2026-11-23'); // Sunday
		expect(weekStartKey('2026-12-01')).toBe('2026-11-30');
	});
});
