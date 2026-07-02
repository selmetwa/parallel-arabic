/**
 * Cumulative end-of-level ASSESSMENT assembler (v2).
 *
 * Unlike the lesson assembler, this produces a TEST — no teaching, no
 * vocab-intro, no per-word recurrence padding. It draws on the vocabulary and
 * practice sentences already generated for the whole level, and weaves a mix of
 * recognition (MCQ), comprehension (AR→EN translate), sentence-building
 * (reorder) and speaking, capped off with a live tutor "capstone" conversation.
 *
 * Pure, synchronous, deterministic.
 */

import type {
	GeneratedLessonV2,
	LessonStepV2,
	SentenceItem,
	VocabItem
} from '$lib/schemas/lesson-v2-schema';

export interface HarvestedSentence extends SentenceItem {
	targetWords: string[];
}

export interface AssembleAssessmentParams {
	topicId: string;
	title: string;
	dialect: string;
	level: string;
	/** Sampled vocab that this assessment actually tests. */
	vocab: VocabItem[];
	/** All level vocab — used only as a distractor bank. */
	fullVocab: VocabItem[];
	/** Practice sentences harvested from the level's lessons. */
	pool: HarvestedSentence[];
	/** Reading passages harvested from the level's lessons. */
	passages: { title: string; sentences: SentenceItem[] }[];
	scenario: {
		situation: string;
		studentRole: string;
		otherRole: string;
		goalEnglish: string;
		targetWords: string[];
	} | null;
}

function toSentence(item: VocabItem | HarvestedSentence | SentenceItem): SentenceItem {
	return {
		arabic: item.arabic,
		arabicTashkeel: item.arabicTashkeel,
		english: item.english,
		transliteration: item.transliteration,
		wordAlignments: item.wordAlignments
	};
}

export function assembleAssessmentV2(params: AssembleAssessmentParams): GeneratedLessonV2 {
	const { vocab, fullVocab, pool } = params;

	let mcqOffset = 0;
	let translateOffset = 0;

	function vocabMcq(correct: VocabItem): LessonStepV2 {
		const others = fullVocab.filter((v) => v.arabic !== correct.arabic);
		const distractors: VocabItem[] = [];
		const seen = new Set<string>([correct.arabic]);
		for (let i = 0; i < others.length && distractors.length < 3; i++) {
			const cand = others[(mcqOffset * 3 + i) % others.length];
			if (seen.has(cand.arabic)) continue;
			seen.add(cand.arabic);
			distractors.push(cand);
		}
		const opts = [correct, ...distractors];
		const pos = mcqOffset % opts.length;
		[opts[0], opts[pos]] = [opts[pos], opts[0]];
		mcqOffset++;
		return {
			type: 'multiple-choice',
			prompt: `Which one means “${correct.english}”?`,
			options: opts.map((o) => ({ ...toSentence(o), isCorrect: o.arabic === correct.arabic })),
			correctIndex: opts.findIndex((o) => o.arabic === correct.arabic),
			targetWords: [correct.english]
		};
	}

	function translateStep(
		correct: SentenceItem & { targetWords?: string[] }
	): LessonStepV2 | null {
		const others = pool.filter((p) => p.english !== correct.english);
		if (others.length < 3) return null;
		const distractors: HarvestedSentence[] = [];
		const seen = new Set<string>([correct.english]);
		for (let i = 0; i < others.length && distractors.length < 3; i++) {
			const cand = others[(translateOffset + i * 5) % others.length];
			if (seen.has(cand.english)) continue;
			seen.add(cand.english);
			distractors.push(cand);
		}
		const opts = [correct, ...distractors];
		const pos = translateOffset % opts.length;
		[opts[0], opts[pos]] = [opts[pos], opts[0]];
		translateOffset++;
		return {
			type: 'translate',
			sentence: toSentence(correct),
			options: opts.map((o) => ({ ...toSentence(o), isCorrect: o.english === correct.english })),
			correctIndex: opts.findIndex((o) => o.english === correct.english),
			targetWords: correct.targetWords ?? []
		};
	}

	/** A reading-comprehension block: a passage, then AR→EN questions from it. */
	function comprehensionBlock(): LessonStepV2[] {
		const passage = params.passages.find((p) => p.sentences.length >= 2);
		if (!passage) return [];
		const block: LessonStepV2[] = [
			{ type: 'reading', title: passage.title, sentences: passage.sentences }
		];
		// Up to 2 comprehension questions drawn from the passage's own sentences.
		const qs = passage.sentences.slice(0, 2);
		for (const s of qs) {
			const q = translateStep(s);
			if (q) block.push(q);
		}
		return block;
	}

	// Recognition items — one per sampled vocab word.
	const recognition: LessonStepV2[] = vocab.map((v) => vocabMcq(v));

	// Production items — cycle through translate / reorder / speaking using the
	// harvested pool (least-repeated first via simple striding).
	const production: LessonStepV2[] = [];
	const prodTarget = Math.min(pool.length, Math.max(12, Math.round(vocab.length * 0.8)));
	const prodTypes = ['translate', 'reorder', 'speaking'] as const;
	for (let i = 0; i < prodTarget; i++) {
		const sent = pool[(i * 7) % pool.length];
		const type = prodTypes[i % prodTypes.length];
		if (type === 'translate') {
			const t = translateStep(sent);
			if (t) {
				production.push(t);
				continue;
			}
		}
		production.push({
			type: type === 'translate' ? 'reorder' : type,
			sentence: toSentence(sent),
			targetWords: sent.targetWords
		});
	}

	// Weave recognition and production together.
	const woven: LessonStepV2[] = [];
	const maxLen = Math.max(recognition.length, production.length);
	for (let i = 0; i < maxLen; i++) {
		if (i < recognition.length) woven.push(recognition[i]);
		if (i < production.length) woven.push(production[i]);
	}

	// Insert the reading-comprehension block partway through the exam.
	const comprehension = comprehensionBlock();
	if (comprehension.length) {
		woven.splice(Math.floor(woven.length * 0.5), 0, ...comprehension);
	}

	const steps: LessonStepV2[] = [
		{
			type: 'content',
			title: `${params.level} Assessment — ${params.title}`,
			text:
				`This is a cumulative check for everything in ${params.level}. ` +
				'There is no teaching here — just show what you know across the whole level. ' +
				'Recognise words, translate sentences, build them, and say them out loud.',
			examples: []
		},
		...woven
	];

	// Live tutor capstone.
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

	return {
		schemaVersion: 2,
		topicId: params.topicId,
		title: params.title,
		dialect: params.dialect,
		level: params.level,
		objectives: [`Demonstrate mastery of the ${params.level} vocabulary and structures.`],
		vocab,
		steps
	};
}
