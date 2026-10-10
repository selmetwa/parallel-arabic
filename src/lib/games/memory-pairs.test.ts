import { describe, expect, it } from 'vitest';
import { PAIRS_PER_BOARD, buildBoard, canPlayMode, isPair } from './memory-pairs';
import type { GameWord } from './word-pool';

function word(id: number, audio = true): GameWord {
	return {
		id: String(id),
		arabic: `كلمة${id}`,
		plain: `كلمة${id}`,
		english: `word ${id}`,
		transliteration: `kilma ${id}`,
		audioUrl: audio ? `https://audio/${id}.mp3` : null
	};
}

const pool = Array.from({ length: 10 }, (_, i) => word(i, i < 7));

describe('buildBoard', () => {
	it('lays out two cards per word, each word once in each face', () => {
		const board = buildBoard(pool, 'read');
		expect(board).toHaveLength(PAIRS_PER_BOARD * 2);
		const ids = new Set(board.map((c) => c.word.id));
		expect(ids.size).toBe(PAIRS_PER_BOARD);
		for (const id of ids) {
			const faces = board.filter((c) => c.word.id === id).map((c) => c.face);
			expect(faces.sort()).toEqual(['arabic', 'english']);
		}
		expect(new Set(board.map((c) => c.id)).size).toBe(board.length);
	});

	it('only uses recorded words in listen mode', () => {
		const board = buildBoard(pool, 'listen');
		expect(board.every((c) => c.word.audioUrl)).toBe(true);
		expect(board.some((c) => c.face === 'audio')).toBe(true);
	});

	it('prefers words that were not on the last board', () => {
		const avoid = new Set(['0', '1', '2', '3']);
		const board = buildBoard(pool, 'read', { avoid });
		expect(board.some((c) => avoid.has(c.word.id))).toBe(false);
	});
});

describe('canPlayMode', () => {
	it('needs enough recorded words for listen mode', () => {
		expect(canPlayMode(pool, 'listen')).toBe(true);
		expect(canPlayMode(pool.slice(0, 5), 'listen')).toBe(false);
	});
});

describe('isPair', () => {
	it('matches two different cards for the same word only', () => {
		const [a, b] = buildBoard(pool, 'read').sort((x, y) => x.word.id.localeCompare(y.word.id));
		expect(isPair(a, b)).toBe(true);
		expect(isPair(a, a)).toBe(false);
	});
});
