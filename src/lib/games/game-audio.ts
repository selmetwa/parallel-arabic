/**
 * Audio for game content that has no recording: a URL to /api/game-audio,
 * which speaks the text in the dialect's voice, spelled the way the dialect
 * says it (see speech-spelling.ts). The response is cached on the CDN, so each
 * word is generated once and then served like a static file.
 */
import { isGameDialect } from './themes';

export const MAX_GAME_AUDIO_CHARS = 200;

export function gameAudioUrl(text: string, dialect: string): string {
	const params = new URLSearchParams({ d: dialect, t: text.trim() });
	return `/api/game-audio?${params}`;
}

/** Whether /api/game-audio can speak this: one of the four game dialects, and not too long. */
export function canSpeak(text: string, dialect: string): boolean {
	const t = text.trim();
	return isGameDialect(dialect) && t.length > 0 && t.length <= MAX_GAME_AUDIO_CHARS;
}

/** The recording if there is one, otherwise the spoken version (null if it can't be spoken). */
export function audioFor(text: string, dialect: string, recorded?: string | null): string | null {
	if (recorded) return recorded;
	return canSpeak(text, dialect) ? gameAudioUrl(text, dialect) : null;
}
