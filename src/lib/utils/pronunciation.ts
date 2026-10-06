/**
 * Speaking-practice scoring, shared by the vocabulary game and the public
 * vocabulary pages.
 *
 * Lifted out of `src/routes/learn/game/play/+page.svelte`, which had the only
 * version that normalizes both sides before comparing. `SpeakSentence` still
 * runs levenshtein against raw text and scores correct answers far too low; it
 * should move onto this eventually.
 */
import levenshtein from 'fast-levenshtein';
import { normalizeArabicText } from '$lib/utils/arabic-normalization';
import { foldForMatch } from '$lib/utils/spoken-match';

/**
 * Levenshtein is unforgiving on short strings, so a single word needs a higher
 * bar than a sentence to mean the same thing.
 */
export const PASS_THRESHOLD = { word: 60, sentence: 50 } as const;

/** Whether this browser can record at all. */
export function checkMediaRecorderSupport(): boolean {
	return !!navigator.mediaDevices?.getUserMedia;
}

/** Send a recording to Chirp 3 and get back what it heard. */
export async function transcribe(blob: Blob, dialect: string): Promise<string> {
	const formData = new FormData();
	formData.append('audio', blob, 'recording.webm');
	formData.append('dialect', dialect);

	const res = await fetch('/api/speech-to-text', { method: 'POST', body: formData });

	if (!res.ok) {
		const errorData = await res.json().catch(() => ({}));
		throw new Error(errorData.error || 'Transcription failed');
	}

	const result = await res.json();
	return result.text || '';
}

/**
 * 0–100, how close the transcript is to what the learner was asked to say.
 * With a dialect, both sides are folded first (spoken-match.ts): digits the
 * recognizer wrote become the dialect's number words, and formal spellings
 * like قوي match the dialect's أوي.
 */
export function scorePronunciation(target: string, spoken: string, dialect?: string): number {
	const normalizedSpoken = dialect
		? foldForMatch(spoken, dialect)
		: normalizeArabicText(spoken.replace(/\./g, ''));
	const normalizedTarget = dialect ? foldForMatch(target, dialect) : normalizeArabicText(target);
	const distance = levenshtein.get(normalizedTarget, normalizedSpoken);
	const maxLength = Math.max(normalizedTarget.length, normalizedSpoken.length);

	return maxLength > 0 ? Math.round((1 - distance / maxLength) * 100) : 0;
}

/** Turn a mic failure into something worth showing the learner. */
export function describeRecordingError(e: unknown): string {
	if (e instanceof DOMException && e.name === 'NotAllowedError') {
		return 'Microphone access denied. Please allow microphone access and try again.';
	}
	return 'Failed to start recording. Please try again.';
}
