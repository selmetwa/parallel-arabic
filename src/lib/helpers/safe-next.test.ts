import { describe, expect, it } from 'vitest';
import { safeNext, withNewSignup } from './safe-next';

describe('safeNext', () => {
	it('keeps same-site paths', () => {
		expect(safeNext('/learn/game/speed-round?dialect=levantine')).toBe(
			'/learn/game/speed-round?dialect=levantine'
		);
	});

	it('falls back for anything else', () => {
		for (const bad of [null, undefined, '', 'learn', 'https://evil.com', '//evil.com', '/\\evil.com']) {
			expect(safeNext(bad)).toBe('/');
		}
		expect(safeNext('//evil.com', '/home')).toBe('/home');
	});
});

describe('withNewSignup', () => {
	it('adds the flag with the right separator', () => {
		expect(withNewSignup('/')).toBe('/?newSignup=true');
		expect(withNewSignup('/learn/game?dialect=fusha')).toBe('/learn/game?dialect=fusha&newSignup=true');
	});
});
