import { describe, expect, it } from 'vitest';
import { scrambleSentences, tryContent } from './onboarding-try';
import { onboardingLines, onboardingScenario } from './tutor-scenarios';
import { stripArabicDiacritics } from '$lib/utils/arabic-normalization';

const DIALECTS = ['egyptian-arabic', 'levantine', 'fusha', 'darija', 'iraqi', 'khaleeji', 'saudi'] as const;
const REASONS = ['Work', 'Travel', 'Heritage'];

describe('tryContent', () => {
	for (const reason of REASONS) {
		for (const dialect of DIALECTS) {
			it(`fits the ${reason} dialog in ${dialect}`, () => {
				const scenario = onboardingScenario(reason, dialect);
				const content = tryContent(scenario, dialect);
				expect(content).toBeTruthy();
				const lines = scenario!.dialogs[dialect]!.lines;
				const conversation = onboardingLines(scenario, dialect);
				const read = content!.readLines.map((i) => lines[i]);

				// Read ends on the line the conversation starts with.
				expect(read.at(-1)).toEqual(conversation[0]);

				const dialogText = stripArabicDiacritics(lines.map((l) => l.arabic).join(' '));
				expect(content!.trace.arabic.length).toBeLessThanOrEqual(3);
				expect(dialogText).toContain(stripArabicDiacritics(content!.trace.arabic));
			});
		}
	}
});

describe('scrambleSentences', () => {
	it("rebuilds the learner's own lines", () => {
		for (const reason of REASONS) {
			for (const dialect of DIALECTS) {
				const sentences = scrambleSentences(onboardingLines(onboardingScenario(reason, dialect), dialect));
				expect(sentences).toHaveLength(2);
				for (const s of sentences) {
					// Two different words at least, or there's nothing to put in order.
					expect(new Set(s.words).size).toBeGreaterThanOrEqual(2);
				}
			}
		}
	});
});
