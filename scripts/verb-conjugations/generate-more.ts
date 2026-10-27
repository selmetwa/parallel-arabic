/**
 * Generates the second batch of verb tables (new-verbs.ts) for one dialect
 * with Gemini, then rebuilds that dialect's index.json and forms.json.
 *
 * Gemini supplies only the Arabic, transliteration, root, class and form; the
 * English and file shape come from engine.ts, so the files match the
 * hand-built ones. Two of the dialect's existing tables go in the prompt as a
 * style reference. Existing files are skipped, so a run can be resumed.
 *
 * Usage:
 *   npx vite-node scripts/verb-conjugations/generate-more.ts -- --dialect=levantine
 *   … --limit=3        only the first few missing verbs (for spot checks)
 *   … --verb=katab     regenerate one verb
 *   npx vite-node scripts/verb-conjugations/generate-more.ts -- --merge-forms
 */
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import dotenv from 'dotenv';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileFor, PERSONS, table, type AT, type Person, type VerbMeta } from './engine';
import { NEW_VERBS, type NewVerb } from './new-verbs';
import { getDialectStyle, getDialectName } from '../../src/lib/data/dialect-rules-v2';
import { rebuildIndex } from './generate-more-index';

dotenv.config({ path: '.env.local' });
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
	console.error('GEMINI_API_KEY is required');
	process.exit(1);
}
const ai = new GoogleGenAI({ apiKey });

const DIR = 'src/lib/data/verb-conjugations';
const FORMS_FILE = join(DIR, 'forms.json');

const args = process.argv.slice(2);
const arg = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const dialect = arg('dialect');
const limit = Number(arg('limit') ?? Infinity);
const onlyVerb = arg('verb');
const merging = args.includes('--merge-forms');
if (!merging && (!dialect || !existsSync(join(DIR, dialect)))) {
	console.error('Pass --dialect=<an existing verb-conjugations folder>');
	process.exit(1);
}
const dialectDir = join(DIR, dialect ?? '');

// Gemini rejects schemas with many constrained states, so array lengths are
// checked after parsing rather than in the schema.
const formsSchema = z.array(z.object({ arabic: z.string(), transliteration: z.string() }));
const responseSchema = z.object({
	arabic: z.string(),
	transliteration: z.string(),
	rootLetters: z.string(),
	verbClass: z.enum(['sound', 'hollow', 'defective', 'irregular', 'doubled']),
	form: z.enum(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'Q']),
	notes: z.string(),
	pastAffirmative: formsSchema,
	pastNegative: formsSchema,
	presentAffirmative: formsSchema,
	presentNegative: formsSchema,
	futureAffirmative: formsSchema,
	futureNegative: formsSchema
});
type Response = z.infer<typeof responseSchema>;
const jsonSchema = zodToJsonSchema(responseSchema);

const PERSON_LABELS = 'ana (I), enta (you m), enti (you f), howa (he), heya (she), ehna (we), entu (you pl), homma (they)';

/** Two existing tables from this dialect, as a compact style reference. */
function styleReference(): string {
	const pick = ['kasar', 'kan', 'mi-i-ma3a'].filter((s) => existsSync(join(dialectDir, `${s}.json`))).slice(0, 2);
	return pick
		.map((slug) => {
			const file = JSON.parse(readFileSync(join(dialectDir, `${slug}.json`), 'utf8'));
			const lines = (['past', 'present', 'future'] as const).flatMap((tense) =>
				(['affirmative', 'negative'] as const).map(
					(pol) =>
						`  ${tense} ${pol}: ` +
						file.conjugations[tense][pol]
							.map((f: { arabic: string; transliteration: string }) => `${f.arabic} (${f.transliteration})`)
							.join('; ')
				)
			);
			return `"${file.english}" = ${file.arabic} (${file.transliteration}):\n${lines.join('\n')}`;
		})
		.join('\n\n');
}

const STYLE = merging ? '' : styleReference();

function prompt(verb: NewVerb): string {
	const name = getDialectName(dialect!);
	return `Write the full ${name} conjugation of the everyday ${name} verb meaning "${verb.english.base}".
For reference, the Egyptian Arabic verb is ${verb.egyptian} (${verb.egyptianTranslit}); use whichever verb ${name} speakers actually say for this meaning, which may be a different word.

${getDialectStyle(dialect!)}

Give 8 forms per list, in this exact person order: ${PERSON_LABELS}.
Lists: past, present (the normal present as used in ${name}, with its usual present marker if the dialect has one), and future, each affirmative and negative.
If the meaning needs a preposition or a fixed word after the verb (e.g. "look for"), include it in every form.

Follow the spelling, prefixes, negation and transliteration style of these existing ${name} tables exactly:

${STYLE}

Transliteration: plain ASCII letters only, with 3 for ع, 7 for ح, 2 for ء, gh, kh, sh, and otherwise exactly the conventions of the tables above (how they write long vowels, ق, the present prefixes); no accents or capitals. Arabic: standard Arabic letters only (no پ چ گ ڤ).

Also give: arabic and transliteration (the "he" past form, as a dictionary would list it), rootLetters (space-separated Arabic root letters), verbClass, form (the derived-verb pattern I to X, or Q for four-letter roots), and notes (one short sentence for a learner about anything irregular or the pattern).`;
}

const ASCII = /^[a-z0-9 ]+$/;
const ARABIC = /^[؀-ۿ ]+$/;

function validate(r: Response): string | null {
	const lists = [r.pastAffirmative, r.pastNegative, r.presentAffirmative, r.presentNegative, r.futureAffirmative, r.futureNegative];
	for (const list of lists) {
		if (list.length !== 8) return `a list has ${list.length} forms`;
		for (const f of list) {
			if (!ARABIC.test(f.arabic.trim()) || /[گچپڤ]/.test(f.arabic)) return `bad arabic "${f.arabic}"`;
			if (!ASCII.test(f.transliteration.trim())) return `bad transliteration "${f.transliteration}"`;
		}
	}
	if (!ARABIC.test(r.arabic.trim()) || !ASCII.test(r.transliteration.trim())) return 'bad citation form';
	return null;
}

const toPersons = (list: { arabic: string; transliteration: string }[]): Record<Person, AT> =>
	Object.fromEntries(PERSONS.map((p, i) => [p, [list[i].arabic.trim(), list[i].transliteration.trim()]])) as Record<Person, AT>;

async function generate(verb: NewVerb): Promise<Response> {
	let lastError = '';
	for (let attempt = 1; attempt <= 3; attempt++) {
		const response = await ai.models.generateContent({
			model: 'gemini-3.1-pro-preview',
			contents: lastError ? `${prompt(verb)}\n\nA previous answer was rejected: ${lastError}. Fix that.` : prompt(verb),
			config: { temperature: 0.2, responseMimeType: 'application/json', responseJsonSchema: jsonSchema }
		});
		try {
			const parsed = responseSchema.parse(JSON.parse(response.text ?? ''));
			const problem = validate(parsed);
			if (!problem) return parsed;
			lastError = problem;
		} catch (e) {
			lastError = e instanceof Error ? e.message.slice(0, 200) : 'invalid JSON';
		}
		console.warn(`  retry ${attempt} for ${verb.slug}: ${lastError}`);
	}
	throw new Error(lastError);
}

function writeVerb(verb: NewVerb, r: Response) {
	const meta: VerbMeta = { slug: verb.slug, english: verb.english, root: r.rootLetters, verbClass: r.verbClass, notes: r.notes };
	const conjugations = {
		past: table(meta, 'past', toPersons(r.pastAffirmative), toPersons(r.pastNegative)),
		present: table(meta, 'present', toPersons(r.presentAffirmative), toPersons(r.presentNegative)),
		future: table(meta, 'future', toPersons(r.futureAffirmative), toPersons(r.futureNegative))
	};
	const file = { ...fileFor(meta, [r.arabic.trim(), r.transliteration.trim()], conjugations), form: r.form, source: 'generated' };
	writeFileSync(join(dialectDir, `${verb.slug}.json`), JSON.stringify(file, null, 2) + '\n');
}

/**
 * Copies each generated table's form into forms.json. Run once after the
 * dialects finish (they run in parallel, so they don't write it themselves).
 */
function mergeForms() {
	const forms = JSON.parse(readFileSync(FORMS_FILE, 'utf8'));
	for (const d of readdirSync(DIR, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)) {
		for (const f of readdirSync(join(DIR, d)).filter((f) => f.endsWith('.json') && f !== 'index.json')) {
			const v = JSON.parse(readFileSync(join(DIR, d, f), 'utf8'));
			if (v.form) forms[d] = { ...forms[d], [v.slug]: v.form };
		}
		if (forms[d]) forms[d] = Object.fromEntries(Object.entries(forms[d]).sort(([a], [b]) => a.localeCompare(b)));
	}
	writeFileSync(FORMS_FILE, JSON.stringify(forms, null, '\t') + '\n');
	console.log('forms.json updated');
}

async function main() {
	if (merging) return mergeForms();
	const todo = NEW_VERBS.filter((v) => (onlyVerb ? v.slug === onlyVerb : !existsSync(join(dialectDir, `${v.slug}.json`)))).slice(0, limit);
	console.log(`${dialect}: ${todo.length} verbs to generate`);
	let failed = 0;
	// A few at a time: each call takes a while, and the API rate-limits bursts.
	const queue = [...todo];
	await Promise.all(
		Array.from({ length: 3 }, async () => {
			for (let verb = queue.shift(); verb; verb = queue.shift()) {
				try {
					writeVerb(verb, await generate(verb));
					console.log(`  ✓ ${verb.slug}`);
				} catch (e) {
					failed++;
					console.error(`  ✗ ${verb.slug}: ${e instanceof Error ? e.message : e}`);
				}
			}
		})
	);
	const total = rebuildIndex(dialectDir, dialect!);
	console.log(`${dialect}: index has ${total} verbs; ${failed} failed`);
}

main();
