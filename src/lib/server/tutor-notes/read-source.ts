/**
 * Turns a learner's tutor notes (pasted text, .docx or .pdf) into plain text,
 * with table rows kept as "cell | cell" lines so word pairs stay together.
 */
import mammoth from 'mammoth';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { GoogleGenAI } from '@google/genai';
import { callGemini } from '$lib/server/lesson-v2-generation';

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_SOURCE_CHARS = 30_000;

export class SourceError extends Error {}

const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** Which kind of upload this is, by extension or MIME type. */
export function sourceKind(name: string, type: string): 'docx' | 'pdf' {
	const lower = name.toLowerCase();
	if (lower.endsWith('.docx') || type === DOCX_TYPE) return 'docx';
	if (lower.endsWith('.pdf') || type === 'application/pdf') return 'pdf';
	if (lower.endsWith('.doc')) throw new SourceError('Old .doc files are not supported. Save it as .docx or PDF and upload again.');
	throw new SourceError('Upload a .docx or .pdf file, or paste the text.');
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

/** Flattens mammoth's HTML: table cells become "a | b" rows, block elements become lines. */
export function htmlToText(html: string): string {
	return html
		// Paragraphs inside a cell would otherwise split the row across lines.
		.replace(/<t([dh])([^>]*)>([\s\S]*?)<\/t\1>/gi, (_, d, attrs, inner: string) =>
			`<t${d}${attrs}>${inner.replace(/<\/?p[^>]*>|<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim()}</t${d}>`
		)
		.replace(/<\/t[dh]>\s*<t[dh][^>]*>/gi, ' | ')
		.replace(/<\/tr>/gi, '\n')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/(p|h[1-6]|li|div)>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e] ?? e)
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

const transcriptSchema = z.object({ text: z.string() });

/** PDFs go to Gemini to transcribe; it reads right-to-left text more reliably than PDF text extraction. */
async function transcribePdf(ai: GoogleGenAI, bytes: Uint8Array): Promise<string> {
	const result = await callGemini(
		ai,
		'You transcribe language-lesson notes exactly.',
		[
			{
				role: 'user',
				parts: [
					{ inlineData: { mimeType: 'application/pdf', data: Buffer.from(bytes).toString('base64') } },
					{
						text: `Transcribe every word of this document as plain text, in reading order.
- Copy Arabic EXACTLY as written: same letters, same diacritics, same slashes and "=" signs, even where the spelling looks wrong or colloquial (e.g. keep التانية, keep معتمد/ة).
- Put each table row and each line of the document on its own line (use \\n between lines). Separate table cells with " | ".
- Do not translate, correct, summarise or add anything.
Return JSON: { "text": "..." }`
					}
				]
			}
		],
		transcriptSchema,
		zodToJsonSchema(transcriptSchema),
		16384
	);
	return result.text;
}

/** Reads an upload or pasted text into plain text. Throws SourceError for anything the learner can fix. */
export async function readSource(
	ai: GoogleGenAI,
	input: { text: string } | { name: string; type: string; bytes: Uint8Array }
): Promise<string> {
	let text: string;
	if ('text' in input) {
		text = input.text;
	} else {
		if (input.bytes.byteLength > MAX_UPLOAD_BYTES) throw new SourceError('That file is over 4 MB.');
		const kind = sourceKind(input.name, input.type);
		text =
			kind === 'docx'
				? htmlToText((await mammoth.convertToHtml({ buffer: Buffer.from(input.bytes) })).value)
				: await transcribePdf(ai, input.bytes);
	}

	text = text.trim();
	if (!/[؀-ۿ]/.test(text)) throw new SourceError("We couldn't find any Arabic in those notes.");
	if (text.length > MAX_SOURCE_CHARS) throw new SourceError('Those notes are too long. Split them into a few smaller uploads.');
	return text;
}
