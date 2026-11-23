import { describe, expect, it, vi } from 'vitest';
import type { GoogleGenAI } from '@google/genai';
import { generateContentWithRetry } from './gemini-api-retry';

function fakeAi() {
	const generateContent = vi.fn().mockResolvedValue({ text: '{}' });
	return { ai: { models: { generateContent } } as unknown as GoogleGenAI, generateContent };
}

describe('generateContentWithRetry thinking default', () => {
	it('turns thinking off for gemini-2.5-flash when not specified', async () => {
		const { ai, generateContent } = fakeAi();
		await generateContentWithRetry(ai, {
			model: 'gemini-2.5-flash',
			contents: 'hi',
			config: { temperature: 0.5 }
		});
		expect(generateContent.mock.calls[0][0].config).toEqual({
			temperature: 0.5,
			thinkingConfig: { thinkingBudget: 0 }
		});
	});

	it('keeps a caller-supplied thinkingConfig', async () => {
		const { ai, generateContent } = fakeAi();
		await generateContentWithRetry(ai, {
			model: 'gemini-2.5-flash',
			contents: 'hi',
			config: { thinkingConfig: { thinkingBudget: 512 } }
		});
		expect(generateContent.mock.calls[0][0].config.thinkingConfig).toEqual({ thinkingBudget: 512 });
	});

	it('leaves other models unchanged', async () => {
		const { ai, generateContent } = fakeAi();
		const params = { model: 'gemini-3.1-flash-lite-preview', contents: 'hi', config: {} };
		await generateContentWithRetry(ai, params);
		expect(generateContent.mock.calls[0][0]).toBe(params);
	});
});
