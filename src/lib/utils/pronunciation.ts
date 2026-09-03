/**
 * Speaking-practice scoring, shared by the vocabulary game and the public
 * vocabulary pages.
 *
 * Lifted out of `src/routes/learn/game/play/+page.svelte`, which had the only
 * version that normalizes both sides before comparing. `PronunciationTestModal`
 * and `SpeakSentence` still run levenshtein against raw text and score correct
 * answers far too low; they should move onto this eventually.
 */
import levenshtein from 'fast-levenshtein';
import { normalizeArabicText } from '$lib/utils/arabic-normalization';

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

/** 0–100, how close the transcript is to what the learner was asked to say. */
export function scorePronunciation(target: string, spoken: string): number {
	const normalizedSpoken = normalizeArabicText(spoken.replace(/\./g, ''));
	const normalizedTarget = normalizeArabicText(target);
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
