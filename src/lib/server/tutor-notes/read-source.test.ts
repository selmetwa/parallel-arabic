import { describe, expect, it } from 'vitest';
import { htmlToText, sourceKind, SourceError } from './read-source';

describe('htmlToText', () => {
	it('keeps each table row on one line, even when cells hold paragraphs (as mammoth writes them)', () => {
		const html =
			'<table><tr><td><p>Missing</p></td><td><p>ناقِص</p></td></tr>' +
			'<tr><td><p>Tool</p><p>Tools</p></td><td><p>اداة</p></td></tr></table>' +
			'<p>بعت to send</p><p>إتبعت to be sent</p>';
		expect(htmlToText(html)).toBe('Missing | ناقِص\nTool Tools | اداة\nبعت to send\nإتبعت to be sent');
	});

	it('decodes entities and drops other tags', () => {
		expect(htmlToText('<p><strong>Data &amp; database</strong> = بيانات</p>')).toBe('Data & database = بيانات');
	});
});

describe('sourceKind', () => {
	it('accepts .docx and .pdf by extension or MIME type', () => {
		expect(sourceKind('Lesson 3.DOCX', '')).toBe('docx');
		expect(sourceKind('notes', 'application/pdf')).toBe('pdf');
	});

	it('explains how to fix old .doc files and other types', () => {
		expect(() => sourceKind('notes.doc', '')).toThrow(SourceError);
		expect(() => sourceKind('notes.doc', '')).toThrow(/\.docx or PDF/);
		expect(() => sourceKind('notes.txt', 'text/plain')).toThrow(/paste the text/);
	});
});
