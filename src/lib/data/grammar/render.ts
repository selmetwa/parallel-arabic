/**
 * A small Markdown renderer for the grammar articles. They are written in the
 * repo (never user input), so this covers only what they use:
 *
 *   ## Heading / ### Subheading
 *   - bullet lists
 *   | tables | with a header row |
 *   > tip callouts
 *   ```ex
 *   arabic | transliteration | english
 *   ```
 *   **bold**, *italic*, [links](/path)
 */

function escape(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const ARABIC_RUN = /([؀-ۿݐ-ݿ][؀-ۿݐ-ݿ\s،ـ]*[؀-ۿݐ-ݿـ]|[؀-ۿ])/g;

function inline(text: string): string {
	return escape(text)
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.+?)\*/g, '<em>$1</em>')
		.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
		.replace(ARABIC_RUN, '<bdi class="ar" dir="rtl">$1</bdi>');
}

function cells(row: string): string[] {
	return row
		.trim()
		.replace(/^\||\|$/g, '')
		.split('|')
		.map((c) => c.trim());
}

function examples(lines: string[]): string {
	const rows = lines
		.filter((l) => l.trim())
		.map((l) => {
			const [ar = '', tr = '', en = ''] = l.split('|').map((c) => c.trim());
			return `<li class="ex"><span class="ex-ar" dir="rtl" lang="ar">${escape(ar)}</span><span class="ex-tr">${escape(tr)}</span><span class="ex-en">${inline(en)}</span></li>`;
		});
	return `<ul class="examples">${rows.join('')}</ul>`;
}

export function renderGrammar(markdown: string): string {
	const lines = markdown.replace(/\r\n/g, '\n').split('\n');
	const out: string[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];

		if (!line.trim()) {
			i++;
			continue;
		}

		if (line.startsWith('```')) {
			const block: string[] = [];
			i++;
			while (i < lines.length && !lines[i].startsWith('```')) block.push(lines[i++]);
			i++;
			out.push(examples(block));
			continue;
		}

		const heading = line.match(/^(#{2,3})\s+(.*)$/);
		if (heading) {
			const tag = heading[1].length === 2 ? 'h2' : 'h3';
			out.push(`<${tag}>${inline(heading[2])}</${tag}>`);
			i++;
			continue;
		}

		if (line.startsWith('|')) {
			const rows: string[] = [];
			while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
			const [head, , ...body] = rows;
			const th = cells(head).map((c) => `<th>${inline(c)}</th>`).join('');
			const trs = body
				.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
				.join('');
			out.push(`<div class="table-wrap"><table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></div>`);
			continue;
		}

		if (line.startsWith('- ')) {
			const items: string[] = [];
			while (i < lines.length && lines[i].startsWith('- ')) items.push(lines[i++].slice(2));
			out.push(`<ul>${items.map((it) => `<li>${inline(it)}</li>`).join('')}</ul>`);
			continue;
		}

		if (line.startsWith('> ')) {
			const quote: string[] = [];
			while (i < lines.length && lines[i].startsWith('> ')) quote.push(lines[i++].slice(2));
			out.push(`<aside class="tip">${inline(quote.join(' '))}</aside>`);
			continue;
		}

		const para: string[] = [];
		while (
			i < lines.length &&
			lines[i].trim() &&
			!/^(#{2,3}\s|```|\||- |> )/.test(lines[i])
		) {
			para.push(lines[i++]);
		}
		out.push(`<p>${inline(para.join(' '))}</p>`);
	}

	return out.join('\n');
}

/** The first paragraph as plain text, for meta descriptions. */
export function grammarExcerpt(markdown: string, max = 160): string {
	const para = markdown
		.split(/\n\s*\n/)
		.map((p) => p.trim())
		.find((p) => p && !/^(#|```|\||- |> )/.test(p));
	const text = (para ?? '').replace(/\*\*|\*|\[|\]\([^)]*\)/g, '').replace(/\s+/g, ' ');
	return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text;
}
