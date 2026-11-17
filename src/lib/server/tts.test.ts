import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ nur: true, env: { EESI_API_KEY: 'k', ELEVENLABS_API_KEY: 'e' } as Record<string, string | undefined> }));

vi.mock('$lib/constants/feature-flags', () => ({
	get NUR_ENABLED() {
		return state.nur;
	}
}));
vi.mock('$env/dynamic/private', () => ({
	get env() {
		return state.env;
	}
}));
const generate = vi.fn(async function* () {
	yield new Uint8Array([9, 9]);
});
vi.mock('elevenlabs', () => ({
	ElevenLabsClient: class {
		generate = async () => generate();
	}
}));

const { synthesizeSpeech } = await import('./tts');

const speak = () => synthesizeSpeech({ text: 'هلا', dialect: 'levantine' });

describe('synthesizeSpeech', () => {
	beforeEach(() => {
		state.nur = true;
		state.env = { EESI_API_KEY: 'k', ELEVENLABS_API_KEY: 'e' };
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	it('uses Nur when it answers', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([1, 2, 3]))));
		const { audio, provider } = await speak();
		expect(provider).toBe('nur');
		expect([...audio]).toEqual([1, 2, 3]);
	});

	it('falls back to ElevenLabs when Nur is out of credits', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":{"code":"free_tier_daily_limit"}}', { status: 429 })));
		const { audio, provider } = await speak();
		expect(provider).toBe('elevenlabs');
		expect([...audio]).toEqual([9, 9]);
	});

	it('falls back when Nur is unreachable', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('ECONNRESET'))));
		expect((await speak()).provider).toBe('elevenlabs');
	});

	it('falls back when there is no EESI key', async () => {
		state.env = { ELEVENLABS_API_KEY: 'e' };
		expect((await speak()).provider).toBe('elevenlabs');
	});

	it('uses ElevenLabs with the flag off', async () => {
		state.nur = false;
		const fetchSpy = vi.fn();
		vi.stubGlobal('fetch', fetchSpy);
		expect((await speak()).provider).toBe('elevenlabs');
		expect(fetchSpy).not.toHaveBeenCalled();
	});
});
