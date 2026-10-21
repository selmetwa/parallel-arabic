import { describe, expect, it } from 'vitest';
import { firstLesson } from './first-lesson';
import { getCurriculumV2 } from '$lib/data/curriculum-v2';
import { onboardingLines, onboardingScenario } from '$lib/constants/tutor-scenarios';

describe('firstLesson', () => {
	it('starts beginners on the alphabet', () => {
		expect(firstLesson('levantine', 'A1').href).toBe('/alphabet/learn');
		expect(firstLesson('levantine', null).href).toBe('/alphabet/learn');
	});

	it('deep-links free accounts to the one free lesson', () => {
		const first = getCurriculumV2('levantine')![0].topics[0];
		expect(firstLesson('levantine', 'B1')).toEqual({
			href: `/lessons/structured/levantine?lessonId=${first.id}`,
			title: first.title
		});
	});

	it('deep-links subscribers to the first lesson at their level', () => {
		const b1 = getCurriculumV2('egyptian-arabic')!.find((m) => m.level === 'B1')!;
		expect(firstLesson('egyptian-arabic', 'B1', true).href).toBe(
			`/lessons/structured/egyptian-arabic?lessonId=${b1.topics[0].id}`
		);
	});

	it('falls back to the lesson path for dialects without a v2 curriculum', () => {
		expect(firstLesson('darija', 'A2').href).toBe('/lessons/structured/darija');
	});
});

describe('onboardingScenario', () => {
	it('picks the conversation from the learning reason', () => {
		expect(onboardingScenario('Travel', 'egyptian-arabic')?.id).toBe('ordering-coffee');
		expect(onboardingScenario('Heritage', 'darija')?.id).toBe('talking-about-family');
		expect(onboardingScenario('Work', 'levantine')?.id).toBe('introducing-yourself');
		expect(onboardingScenario(null, 'fusha')?.id).toBe('introducing-yourself');
	});

	it('has a dialog for every dialect onboarding offers', () => {
		for (const reason of ['Travel', 'Heritage', 'Work']) {
			for (const dialect of ['egyptian-arabic', 'levantine', 'fusha', 'darija'] as const) {
				expect(onboardingScenario(reason, dialect)?.dialogs[dialect]).toBeTruthy();
			}
		}
	});
});

describe('onboardingLines', () => {
	it('plays you, them, you, ending on an answer, in every dialect', () => {
		for (const reason of ['Work', 'Travel', 'Heritage']) {
			for (const dialect of ['egyptian-arabic', 'levantine', 'fusha', 'darija'] as const) {
				const lines = onboardingLines(onboardingScenario(reason, dialect), dialect);
				expect(lines.map((l) => l.speaker)).toEqual(['student', 'other', 'student']);
				expect(lines.at(-1)?.english).not.toMatch(/\?$/);
			}
		}
	});
});
