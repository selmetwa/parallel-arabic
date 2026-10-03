import { existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { GAME_DIALECTS } from '$lib/games/themes';
import { CONCEPTS, ROOMS, getRoom } from './rooms';
import {
	BATCH_SIZE,
	CHOICES,
	HINT_AFTER,
	PRACTICE_SIZE,
	REQUEUE_GAP,
	REVIEW_SIZE,
	VOCAB,
	answer,
	batches,
	createRound,
	currentPrompt,
	isDone,
	learnedCount,
	missed,
	nameChoices,
	nextToLearn,
	planSession,
	tally,
	wordFor
} from './round';
import { addLearned, readAllLearned, readLearned } from './progress';

const room = ROOMS[0];
const ids = room.objects.map((o) => o.id);

describe('room data', () => {
	it('names every object in every dialect, with gender and a question', () => {
		for (const r of ROOMS) {
			for (const object of r.objects) {
				expect(CONCEPTS[object.id], object.id).toBeDefined();
				for (const dialect of GAME_DIALECTS) {
					const entry = VOCAB[object.id]?.[dialect];
					const where = `${object.id}/${dialect}`;
					expect(entry?.arabic, where).toBeTruthy();
					expect(entry?.transliteration, where).toBeTruthy();
					expect(['m', 'f'], where).toContain(entry?.gender);
					expect(entry?.question, where).toMatch(/؟$/);
					expect(entry?.questionTransliteration, where).toBeTruthy();
				}
			}
		}
	});

	it('has a recording of every word and question', () => {
		const dir = join(process.cwd(), 'static');
		for (const r of ROOMS) {
			for (const object of r.objects) {
				for (const dialect of GAME_DIALECTS) {
					const word = wordFor(object.id, dialect);
					expect(existsSync(join(dir, word.audioUrl)), word.audioUrl).toBe(true);
					expect(existsSync(join(dir, word.questionAudioUrl)), word.questionAudioUrl).toBe(true);
				}
			}
		}
	});

	it('gives each object in a room its own id and its own word', () => {
		for (const r of ROOMS) {
			const roomIds = r.objects.map((o) => o.id);
			expect(new Set(roomIds).size, r.id).toBe(roomIds.length);
			// Two objects with the same word would make one prompt with two answers.
			for (const dialect of GAME_DIALECTS) {
				const words = roomIds.map((id) => wordFor(id, dialect).plain);
				expect(new Set(words).size, `${r.id}/${dialect}`).toBe(words.length);
			}
		}
	});

	it('has enough objects for a practice round in every room', () => {
		for (const r of ROOMS) expect(r.objects.length, r.id).toBeGreaterThanOrEqual(PRACTICE_SIZE);
	});

	it('falls back to the first room for an unknown id', () => {
		expect(getRoom('attic').id).toBe(ROOMS[0].id);
	});
});

describe('lessons', () => {
	it('splits a room into batches in room order', () => {
		expect(batches(room).flat()).toEqual(ids);
		expect(batches(room)[0]).toHaveLength(BATCH_SIZE);
	});

	it('teaches the first batch first, with nothing to review yet', () => {
		const session = planSession(room, new Set());
		expect(session.learn).toEqual(ids.slice(0, BATCH_SIZE));
		expect([...session.round.prompts].sort()).toEqual([...session.learn].sort());
	});

	it('mixes in a few learned words once some are known', () => {
		const learned = new Set(ids.slice(0, BATCH_SIZE * 2));
		const session = planSession(room, learned);
		expect(session.learn).toEqual(ids.slice(BATCH_SIZE * 2, BATCH_SIZE * 3));
		const review = session.round.prompts.filter((id) => !session.learn.includes(id));
		expect(review).toHaveLength(REVIEW_SIZE);
		for (const id of review) expect(learned.has(id)).toBe(true);
	});

	it('finishes a half-done batch before starting the next', () => {
		expect(nextToLearn(room, new Set([ids[0], ids[2]]))).toEqual([ids[1], ids[3]]);
	});

	it('gives a practice round once the room is learned', () => {
		const session = planSession(room, new Set(ids));
		expect(session.learn).toEqual([]);
		expect(session.round.prompts).toHaveLength(PRACTICE_SIZE);
		expect(learnedCount(room, new Set(ids))).toBe(ids.length);
	});
});

describe('a round', () => {
	it('moves on after a right answer and earns XP', () => {
		const round = createRound(ids.slice(0, 5));
		expect(answer(round, ids[0])).toEqual({ result: 'correct', xp: true });
		expect(round.outcomes[ids[0]]).toBe('first');
		expect(currentPrompt(round)).toBe(ids[1]);
	});

	it('keeps the prompt after a wrong answer, then hints', () => {
		const round = createRound(ids.slice(0, 5));
		for (let i = 1; i < HINT_AFTER; i++) expect(answer(round, ids[4]).result).toBe('wrong');
		expect(currentPrompt(round)).toBe(ids[0]);
		expect(answer(round, ids[4]).result).toBe('hint');
		expect(answer(round, ids[0])).toEqual({ result: 'correct', xp: false });
		expect(round.outcomes[ids[0]]).toBe('hinted');
	});

	it('brings a missed word back once, a few prompts later, without more XP', () => {
		const round = createRound(ids.slice(0, 8));
		answer(round, ids[7]);
		expect(answer(round, ids[0])).toEqual({ result: 'correct', xp: true });
		expect(round.outcomes[ids[0]]).toBe('retry');
		expect(round.prompts).toHaveLength(9);
		expect(round.prompts[REQUEUE_GAP + 1]).toBe(ids[0]);

		while (currentPrompt(round) !== ids[0]) answer(round, currentPrompt(round)!);
		answer(round, ids[7]);
		expect(answer(round, ids[0]).xp).toBe(false);
		// The first outcome stands, and it doesn't come back a third time.
		expect(round.outcomes[ids[0]]).toBe('retry');
		expect(round.prompts.filter((id) => id === ids[0])).toHaveLength(2);
	});

	it('puts a late miss at the end rather than past it', () => {
		const round = createRound(ids.slice(0, 2));
		answer(round, ids[0]);
		answer(round, ids[0]);
		answer(round, ids[1]);
		expect(round.prompts).toEqual([ids[0], ids[1], ids[1]]);
	});

	it('ends after the last prompt and tallies the outcomes', () => {
		const round = createRound(ids.slice(0, 3));
		answer(round, ids[2]);
		for (const id of ids.slice(0, 3)) answer(round, id);
		while (!isDone(round)) answer(round, currentPrompt(round)!);
		expect(tally(round)).toEqual({ asked: 3, first: 2, retry: 1, hinted: 0 });
		expect(missed(round)).toEqual([ids[0]]);
		expect(() => answer(round, ids[0])).toThrow();
	});

	it('offers distinct name choices that include the answer', () => {
		const choices = nameChoices(room, ids[3]);
		expect(choices).toHaveLength(CHOICES);
		expect(new Set(choices).size).toBe(CHOICES);
		expect(choices).toContain(ids[3]);
	});
});

describe('progress', () => {
	function memoryStorage(): Storage {
		const data = new Map<string, string>();
		return {
			getItem: (k) => data.get(k) ?? null,
			setItem: (k, v) => void data.set(k, v),
			removeItem: (k) => void data.delete(k),
			clear: () => data.clear(),
			key: () => null,
			get length() {
				return data.size;
			}
		};
	}

	it('remembers learned words per room and dialect', () => {
		const storage = memoryStorage();
		addLearned(storage, 'kitchen', 'levantine', ['fridge', 'stove']);
		addLearned(storage, 'kitchen', 'levantine', ['stove', 'sink']);
		addLearned(storage, 'bathroom', 'darija', ['toilet']);
		expect([...readLearned(storage, 'kitchen', 'levantine')].sort()).toEqual([
			'fridge',
			'sink',
			'stove'
		]);
		expect(readLearned(storage, 'kitchen', 'darija').size).toBe(0);
		expect(Object.keys(readAllLearned(storage, 'darija'))).toEqual(['bathroom']);
	});

	it('survives missing or broken storage', () => {
		expect(readLearned(null, 'kitchen', 'fusha').size).toBe(0);
		const storage = memoryStorage();
		storage.setItem('pa-room-hunt-learned', '{not json');
		expect(readLearned(storage, 'kitchen', 'fusha').size).toBe(0);
		expect(addLearned(storage, 'kitchen', 'fusha', ['pot']).has('pot')).toBe(true);
	});
});
