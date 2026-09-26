import { describe, expect, it } from 'vitest';
import { buildPool, cleanWord, isLetterWord, type WordRow } from './word-pool';

let nextId = 1;
function row(
	arabic: string,
	english: string,
	transliteration = '',
	audio: string | null = null
): WordRow {
	return {
		id: nextId++,
		arabic_word: arabic,
		english_word: english,
		transliterated_word: transliteration,
		audio_url: audio
	};
}

describe('cleanWord', () => {
	it('drops a plural in parentheses but keeps the tashkeel for display', () => {
		const word = cleanWord(row('كلِب (كْلاب)', 'dog', 'kálib (klēb)'));
		expect(word?.arabic).toBe('كلِب');
		expect(word?.plain).toBe('كلب');
		expect(word?.transliteration).toBe('kálib');
	});

	it('keeps the first form of a verb pair', () => {
		expect(cleanWord(row('درّب، يْدرِّب', 'to train'))?.plain).toBe('درب');
		expect(cleanWord(row('اتردد - يتردد ', 'to hesitate'))?.plain).toBe('اتردد');
	});

	it('cleans English and transliteration notes', () => {
		expect(cleanWord(row('أكْل', '(pet) food, feed'))?.english).toBe('food');
		expect(cleanWord(row('كل', 'to eat', 'kal [i3]'))?.transliteration).toBe('kal');
	});

	it('rejects sentences, questions and long glosses', () => {
		expect(cleanWord(row('تِحِبّ تاكُل أيْه؟', 'What do you feel like eating?'))).toBeNull();
		expect(cleanWord(row('أنا بْحِبّ الِبْسيْنات.', 'I like cats.'))).toBeNull();
		expect(cleanWord(row('خد قطْمة مِن', 'to take a bite of'))).toBeNull();
	});

	it('rejects templates, Latin and empty rows', () => {
		expect(cleanWord(row('MP3 بْلايِر', 'MP3 player'))).toBeNull();
		expect(cleanWord(row('ابن/بنت اخ/اخت', 'nephew/niece'))).toBeNull();
		expect(cleanWord(row('__ـي بْيِوْجعْني', 'my __ hurts'))).toBeNull();
		expect(cleanWord(row('', 'note about the list'))).toBeNull();
	});

	it('upgrades recorded audio to https', () => {
		expect(cleanWord(row('بْسيْنِة', 'cat', '', 'http://media.example.com/a.mp3'))?.audioUrl).toBe(
			'https://media.example.com/a.mp3'
		);
	});
});

describe('isLetterWord', () => {
	it('allows only single words of 3–7 plain Arabic letters', () => {
		const word = (arabic: string) => cleanWord(row(arabic, 'x'))!;
		expect(isLetterWord(word('كل'))).toBe(false);
		expect(isLetterWord(word('كلِب'))).toBe(true);
		expect(isLetterWord(word('حَيَوان أليف'))).toBe(false);
		expect(isLetterWord(word('ڭاميلة'))).toBe(false);
	});
});

describe('buildPool', () => {
	it('keeps one word per meaning, so a board never has two right answers', () => {
		const pool = buildPool([
			row('قطْمة', 'a bite'),
			row('حِتّة (حِتت)', 'a bite'),
			row('غزال', 'deer'),
			row('غزلان', 'deer'),
			row('حوت', 'whale'),
			row('حيتان', 'whales')
		]);
		expect(pool.map((w) => w.plain)).toEqual(['قطمة', 'غزال', 'حوت']);
	});

	it('keeps one word per spelling', () => {
		const pool = buildPool([row('أسد', 'lion'), row('اسد', 'lion (big cat)')]);
		expect(pool).toHaveLength(1);
	});
});
