/**
 * Deterministic lesson assembler (v2).
 *
 * Turns the flat AI-generated building blocks (vocab list, practice-sentence
 * pool, reading passage, tutor scenario) into an ordered `steps[]` lesson.
 *
 * This is where the pedagogy lives — NOT in the model. It guarantees:
 *  - every vocab word is recycled at least MIN_RECURRENCE times,
 *  - exercise types are interleaved (recognition → production → speaking),
 *  - new words are introduced in small chunks and immediately reinforced,
 *  - older words keep coming back (spaced review),
 *  - CRITICAL: a word is NEVER used in a quiz, distractor, or practice
 *    sentence before its own `vocab-intro` step. Everything is gated on the
 *    running "introduced" set.
 *
 * It is pure, synchronous, and deterministic (no RNG) so it is trivially
 * testable and the guarantees above are verifiable.
 */

import type {
	GeneratedLessonV2,
	LessonStepV2,
	PracticeItem,
	SentenceItem,
	VocabItem
} from '$lib/schemas/lesson-v2-schema';

const MIN_RECURRENCE = 8; // hard floor per word (the headline requirement)
const CHUNK_SIZE = 4; // new words introduced per vocab-intro step
const MAX_PRACTICE_STEPS = 600; // safety cap

// Production exercise types the quota-fill phase rotates through.
type CycleType = 'reorder' | 'typing' | 'translate' | 'speaking' | 'multiple-choice';

/**
 * Per-CEFR-level exercise mix. Lower levels lean on recognition, reordering and
 * speaking (low typing burden); higher levels add free typing and translation.
 * `target` is the soft per-word recurrence we aim for.
 */
const LEVEL_MIX: Record<string, { typeCycle: CycleType[]; target: number }> = {
	// NOTE: recognition MCQs are emitted per vocab chunk and in the final
	// assessment, so the production cycle stays purely productive.
	A1: { typeCycle: ['reorder', 'speaking', 'translate'], target: 10 },
	A2: { typeCycle: ['reorder', 'speaking', 'translate', 'typing'], target: 10 },
	B1: { typeCycle: ['reorder', 'typing', 'translate', 'speaking'], target: 11 },
	B2: { typeCycle: ['typing', 'translate', 'reorder', 'speaking'], target: 11 },
	C1: { typeCycle: ['typing', 'translate', 'speaking', 'reorder'], target: 12 },
	C2: { typeCycle: ['typing', 'translate', 'speaking', 'reorder'], target: 12 }
};

export interface AssembleParams {
	topicId: string;
	title: string;
	dialect: string;
	level: string;
	objectives: string[];
	vocab: VocabItem[];
	pool: PracticeItem[];
	passages: { title: string; sentences: SentenceItem[] }[];
	scenario: {
		situation: string;
		studentRole: string;
		otherRole: string;
		goalEnglish: string;
		targetWords: string[];
	} | null;
}

/** Strip metadata so a VocabItem/PracticeItem can render as a plain SentenceItem. */
function toSentence(item: VocabItem | PracticeItem | SentenceItem): SentenceItem {
	return {
		arabic: item.arabic,
		arabicTashkeel: item.arabicTashkeel,
		english: item.english,
		transliteration: item.transliteration,
		wordAlignments: item.wordAlignments
	};
}

export function assembleLessonV2(params: AssembleParams): GeneratedLessonV2 {
	const { vocab, pool } = params;
	const mix = LEVEL_MIX[params.level] ?? LEVEL_MIX.A1;
	const steps: LessonStepV2[] = [];

	// Recurrence counter keyed by english gloss (vocab is tagged by english).
	const counts = new Map<string, number>();
	vocab.forEach((v) => counts.set(v.english, 0));
	const bump = (words: string[]) =>
		words.forEach((w) => counts.set(w, (counts.get(w) ?? 0) + 1));

	// Words that have been formally introduced via a vocab-intro step. Nothing
	// may reference a word before it is in here.
	const introducedSet = new Set<string>();
	const introduced: VocabItem[] = [];

	// Pool bookkeeping: usage count + index by target word.
	const poolUsage = new Map<number, number>();
	pool.forEach((_, i) => poolUsage.set(i, 0));
	const poolByWord = new Map<string, number[]>();
	pool.forEach((p, i) => {
		p.targetWords.forEach((w) => {
			if (!poolByWord.has(w)) poolByWord.set(w, []);
			poolByWord.get(w)!.push(i);
		});
	});

	// A pool sentence is usable only when EVERY vocab word it targets is already
	// introduced (untagged/non-vocab words are ignored).
	const poolUsable = (idx: number) =>
		pool[idx].targetWords.every((w) => !counts.has(w) || introducedSet.has(w));

	let mcqOffset = 0;
	let translateOffset = 0;
	let cycleIdx = 0;

	/** Build a word-recognition MCQ using ONLY already-introduced words. */
	function vocabMcq(correct: VocabItem): LessonStepV2 {
		const others = introduced.filter((v) => v.arabic !== correct.arabic);
		const distractors: VocabItem[] = [];
		const seen = new Set<string>([correct.arabic]);
		for (let i = 0; i < others.length && distractors.length < 3; i++) {
			const cand = others[(mcqOffset + i) % others.length];
			if (seen.has(cand.arabic)) continue;
			seen.add(cand.arabic);
			distractors.push(cand);
		}
		const opts = [correct, ...distractors];
		const correctPos = mcqOffset % opts.length;
		[opts[0], opts[correctPos]] = [opts[correctPos], opts[0]];
		mcqOffset++;
		return {
			type: 'multiple-choice',
			prompt: `Which one means “${correct.english}”?`,
			options: opts.map((o) => ({ ...toSentence(o), isCorrect: o.arabic === correct.arabic })),
			correctIndex: opts.findIndex((o) => o.arabic === correct.arabic),
			targetWords: [correct.english]
		};
	}

	/** Reverse (AR→EN) MCQ from a usable pool sentence; distractors are other usable sentences. */
	function translateStep(correctIdx: number): LessonStepV2 | null {
		const correct = pool[correctIdx];
		const usable = pool.filter((_, i) => i !== correctIdx && poolUsable(i));
		if (usable.length < 3) return null; // not enough material yet
		const distractors: PracticeItem[] = [];
		const seen = new Set<string>([correct.english]);
		for (let i = 0; i < usable.length && distractors.length < 3; i++) {
			const cand = usable[(translateOffset + i * 5) % usable.length];
			if (seen.has(cand.english)) continue;
			seen.add(cand.english);
			distractors.push(cand);
		}
		const opts = [correct, ...distractors];
		const correctPos = translateOffset % opts.length;
		[opts[0], opts[correctPos]] = [opts[correctPos], opts[0]];
		translateOffset++;
		return {
			type: 'translate',
			sentence: toSentence(correct),
			options: opts.map((o) => ({ ...toSentence(o), isCorrect: o.english === correct.english })),
			correctIndex: opts.findIndex((o) => o.english === correct.english),
			targetWords: correct.targetWords.filter((w) => counts.has(w))
		};
	}

	/** Least-used usable pool sentence drilling `word`, or null. */
	function pickPoolFor(word: string): number | null {
		const candidates = (poolByWord.get(word) ?? []).filter(poolUsable);
		if (candidates.length === 0) return null;
		let best = candidates[0];
		for (const idx of candidates) {
			if ((poolUsage.get(idx) ?? 0) < (poolUsage.get(best) ?? 0)) best = idx;
		}
		return best;
	}

	/** Emit one production step drilling `word`, following the level's type mix. */
	function productionStep(word: VocabItem): LessonStepV2 {
		const type: CycleType = mix.typeCycle[cycleIdx % mix.typeCycle.length];
		cycleIdx++;

		// Recognition MCQ needs no pool sentence (introduced-only distractors).
		if (type === 'multiple-choice') {
			bump([word.english]);
			return vocabMcq(word);
		}

		const poolIdx = pickPoolFor(word.english);
		if (poolIdx === null) {
			// No usable pool sentence yet — fall back to a recognition MCQ rather
			// than piling on more typing.
			bump([word.english]);
			return vocabMcq(word);
		}

		if (type === 'translate') {
			const t = translateStep(poolIdx);
			if (t) {
				poolUsage.set(poolIdx, (poolUsage.get(poolIdx) ?? 0) + 1);
				bump((t as { targetWords: string[] }).targetWords);
				return t;
			}
			// translate not ready (too little material) — fall through to reorder
		}

		const sent = pool[poolIdx];
		poolUsage.set(poolIdx, (poolUsage.get(poolIdx) ?? 0) + 1);
		const credited = sent.targetWords.filter((w) => counts.has(w));
		bump(credited.length ? credited : [word.english]);
		const ptype: 'reorder' | 'typing' | 'speaking' = type === 'translate' ? 'reorder' : type;
		return { type: ptype, sentence: toSentence(sent), targetWords: credited };
	}

	// --- 0. Intro ---------------------------------------------------------
	steps.push({
		type: 'content',
		title: params.title,
		text:
			'In this lesson you will learn and heavily practice new words and phrases. ' +
			'Each new word comes back many times across reading, listening, speaking, ' +
			'building sentences, and translating — so it really sticks.',
		examples: []
	});
	if (params.objectives.length) {
		steps.push({
			type: 'content',
			title: 'What you will be able to do',
			text: params.objectives.map((o) => `• ${o}`).join('\n')
		});
	}

	// --- 1. Interleave: introduce a chunk, then practice introduced words ---
	const chunks: VocabItem[][] = [];
	for (let i = 0; i < vocab.length; i += CHUNK_SIZE) {
		chunks.push(vocab.slice(i, i + CHUNK_SIZE));
	}

	chunks.forEach((chunk) => {
		steps.push({ type: 'vocab-intro', items: chunk });
		chunk.forEach((v) => {
			introduced.push(v);
			introducedSet.add(v.english);
			bump([v.english]); // the introduction itself counts once
		});
		// Immediate recognition for each new word (distractors are introduced-only).
		chunk.forEach((v) => steps.push(vocabMcq(v)));
		// One production rep per new word, reviewing as material allows.
		chunk.forEach((v) => steps.push(productionStep(v)));
	});

	// --- 2. Spaced quota-fill until every word hits the target -------------
	const belowMin = () => introduced.some((v) => (counts.get(v.english) ?? 0) < MIN_RECURRENCE);
	const aimReached = () => introduced.every((v) => (counts.get(v.english) ?? 0) >= mix.target);
	const lowestWord = (): VocabItem => {
		let best = introduced[0];
		for (const v of introduced) {
			if ((counts.get(v.english) ?? 0) < (counts.get(best.english) ?? 0)) best = v;
		}
		return best;
	};

	const practiceSteps: LessonStepV2[] = [];
	let guard = 0;
	while ((belowMin() || !aimReached()) && guard < MAX_PRACTICE_STEPS) {
		guard++;
		const word = lowestWord();
		if (!belowMin() && (counts.get(word.english) ?? 0) >= mix.target) break;
		practiceSteps.push(productionStep(word));
	}

	// --- 3. Intersperse the reading-comprehension segments evenly ----------
	const passages = params.passages.filter((p) => p.sentences.length);
	if (passages.length) {
		const base = practiceSteps.length;
		const n = passages.length;
		// Compute insert positions on the original length, then insert descending
		// so earlier splices don't shift later positions.
		const inserts = passages.map((p, k) => ({
			pos: Math.floor((base * (k + 1)) / (n + 1)),
			step: { type: 'reading' as const, title: p.title, sentences: p.sentences }
		}));
		for (let k = inserts.length - 1; k >= 0; k--) {
			practiceSteps.splice(inserts[k].pos, 0, inserts[k].step);
		}
	}
	steps.push(...practiceSteps);

	// --- 4. Live tutor mini-conversation ----------------------------------
	if (params.scenario) {
		steps.push({
			type: 'tutor-conversation',
			situation: params.scenario.situation,
			studentRole: params.scenario.studentRole,
			otherRole: params.scenario.otherRole,
			goalEnglish: params.scenario.goalEnglish,
			targetWords: params.scenario.targetWords
		});
	}

	// --- 5. Final assessment: a few mixed recognition MCQs (all introduced) -
	const assessCount = Math.min(5, vocab.length);
	for (let i = 0; i < assessCount; i++) {
		const v = vocab[(i * 3) % vocab.length];
		const step = vocabMcq(v);
		steps.push({ ...step, prompt: `Final check — which one means “${v.english}”?` });
	}

	return {
		schemaVersion: 2,
		topicId: params.topicId,
		title: params.title,
		dialect: params.dialect,
		level: params.level,
		objectives: params.objectives,
		vocab,
		steps
	};
}

/** Diagnostic: per-word recurrence histogram across the assembled steps. */
export function recurrenceHistogram(lesson: GeneratedLessonV2): Record<string, number> {
	const counts: Record<string, number> = {};
	lesson.vocab.forEach((v) => (counts[v.english] = 0));
	for (const step of lesson.steps) {
		if ('targetWords' in step && Array.isArray(step.targetWords)) {
			step.targetWords.forEach((w) => {
				if (w in counts) counts[w] += 1;
			});
		}
		if (step.type === 'vocab-intro') {
			step.items.forEach((it) => {
				if (it.english in counts) counts[it.english] += 1;
			});
		}
	}
	return counts;
}
