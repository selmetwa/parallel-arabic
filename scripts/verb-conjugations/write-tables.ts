/**
 * Writes hand-written second-batch verb tables (content/verbs/batch2/<dialect>.txt)
 * to src/lib/data/verb-conjugations/<dialect>/, for the verbs generate-more.ts
 * didn't produce. Only the affirmative forms are written by hand; each
 * dialect's negatives follow its regular rule, matching the existing tables:
 *
 *   egyptian-arabic  past ما …ش, present ما…ش (joined), future مش …
 *   darija           past/present ما …ش, future ما غاديش …
 *   fusha            past مَا …, present لَا …, future لَنْ + the `subj:` line
 *   the rest         ما … in every tense
 *
 * Block format:
 *   ## slug
 *   cit: كتب/katab
 *   root: ك ت ب
 *   class: sound
 *   form: I
 *   note: one sentence for the learner
 *   past: ar/tr; … (8 persons: ana enta enti howa heya ehna entu homma)
 *   bare: …   the bare present ("I want to …" form); the present and future
 *             markers are added by fromBare(). pres:/fut: override them.
 *   pres: …   (Fusha: the indicative; its future is سَ + this)
 *   subj: …   (Fusha only: the subjunctive, used after لَنْ)
 *   tail: على/3la   a preposition after every form, placed after the negative ending
 *
 * Usage: npx vite-node scripts/verb-conjugations/write-tables.ts -- --dialect=iraqi
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileFor, PERSONS, table, type AT, type Person, type VerbMeta } from './engine';
import { NEW_VERBS } from './new-verbs';
import { rebuildIndex } from './generate-more-index';

const DIR = 'src/lib/data/verb-conjugations';
const dialect = process.argv.find((a) => a.startsWith('--dialect='))?.split('=')[1];
if (!dialect) throw new Error('Pass --dialect=<dialect>');
const src = join('content/verbs/batch2', `${dialect}.txt`);
if (!existsSync(src)) throw new Error(`No ${src}`);

const CLASSES = ['sound', 'hollow', 'defective', 'irregular', 'doubled'];
const FORMS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'Q'];

function pairs(line: string, where: string): AT[] {
	const out = line.split(';').map((p) => {
		const [ar, tr] = p.split('/').map((s) => s?.trim());
		if (!ar || !tr) throw new Error(`${where}: bad form "${p}"`);
		return [ar, tr] as AT;
	});
	if (out.length !== 8) throw new Error(`${where}: expected 8 forms, got ${out.length}`);
	return out;
}

const persons = (forms: AT[]): Record<Person, AT> =>
	Object.fromEntries(PERSONS.map((p, i) => [p, forms[i]])) as Record<Person, AT>;

/**
 * ma … -sh. Egyptian lengthens a final vowel (katabti → katabtiish) and puts
 * an i between two final consonants (nimt → nimtish); Darija does neither.
 */
function shNeg([ar, tr]: AT, joined: boolean, egyptian: boolean): AT {
	const arBase = (ar.endsWith('وا') ? ar.slice(0, -1) : ar).replace(/ى$/, 'ا');
	const last = tr.at(-1)!;
	const finalConsonants = tr.replace(/(sh|kh|gh)$/, 'X').slice(-2);
	let trBase = tr;
	if (egyptian && /[aiu]/.test(last)) trBase = `${tr}${last}`;
	else if (egyptian && /^[^aeiou][^aeiou]$/.test(finalConsonants)) trBase = `${tr}i`;
	return joined ? [`ما${arBase}ش`, `ma${trBase}sh`] : [`ما ${arBase}ش`, `ma ${trBase}sh`];
}

const prefix = (p: AT, [ar, tr]: AT): AT => [`${p[0]} ${ar}`, `${p[1]} ${tr}`];

/** Joins a prefix onto a word whose first letter may be ا (اكتب → هاكتب / باكسر). */
const join1 = (arPrefix: string, ar: string, keepAlif: boolean) =>
	ar.startsWith('ا') && !keepAlif ? arPrefix + ar.slice(1) : arPrefix + ar;

/**
 * The present and future from the bare present (the form after "want to"),
 * using each dialect's markers exactly as the existing tables do.
 */
function fromBare(bare: AT[]): { pres: AT[]; fut: AT[] } {
	const map = (f: (form: AT, i: number) => AT) => bare.map(f);
	switch (dialect) {
		case 'egyptian-arabic':
			return {
				// baktib, btiktib, biyiktib; bi- before a cluster (bitghayyar, binghayyar).
				pres: map(([ar, tr], i) =>
					i === 0
						? [join1('ب', ar, false), `b${tr}`]
						: i === 3 || i === 7 || /^[^aeiou]{2}/.test(tr)
							? [`ب${ar}`, `bi${tr}`]
							: [`ب${ar}`, `b${tr}`]
				),
				fut: map(([ar, tr]) => [`ه${ar}`, `ha${tr}`])
			};
		case 'levantine':
			return {
				pres: map(([ar, tr], i) => {
					if (i === 0) return [join1('ب', ar, false), `b${tr}`];
					if (i === 5) return [`م${ar}`, `m${tr}`];
					// he/they: byiksor, but bighayyir where the y is followed by a consonant.
					if ((i === 3 || i === 7) && /^y[^aeiou]/.test(tr)) return [`ب${ar}`, `bi${tr.slice(1)}`];
					return [`ب${ar}`, `b${tr}`];
				}),
				fut: map((f) => prefix(['رح', 'ra7'], f))
			};
		case 'saudi':
			return {
				pres: map(([ar, tr]) => [ar.startsWith('ا') ? `با${ar.slice(1)}` : `ب${ar}`, `b${tr}`]),
				fut: map(([ar, tr]) => [ar.startsWith('ا') ? `حا${ar.slice(1)}` : `ح${ar}`, tr.startsWith('a') ? `7${tr}` : `7a${tr}`])
			};
		case 'iraqi':
		case 'khaleeji':
			return { pres: bare, fut: map((f) => prefix(['راح', 'raa7'], f)) };
		case 'darija':
			return { pres: map(([ar, tr]) => [`ك${ar}`, `ka${tr}`]), fut: map((f) => prefix(['غادي', 'ghadi'], f)) };
		default:
			throw new Error(`No bare-present rule for ${dialect}`);
	}
}

/** Fusha future: سَ + the indicative (أَكْتُبُ → سَأَكْتُبُ, sa2aktubu). */
const fushaFuture = (pres: AT[]): AT[] =>
	pres.map(([ar, tr]) => [`سَ${ar}`, /^[aiu]/.test(tr) ? `sa2${tr}` : `sa${tr}`]);

function negatives(tense: 'past' | 'present' | 'future', aff: AT[], subj?: AT[]): AT[] {
	switch (dialect) {
		case 'egyptian-arabic':
			if (tense === 'future') return aff.map((f) => prefix(['مش', 'mish'], f));
			return aff.map((f) => shNeg(f, tense === 'present', true));
		case 'darija':
			if (tense === 'future')
				return aff.map(([ar, tr]) => [ar.replace(/^غادي /, 'ما غاديش '), tr.replace(/^ghadi /, 'ma ghadish ')]);
			return aff.map((f) => shNeg(f, false, false));
		case 'fusha':
			if (tense === 'past') return aff.map((f) => prefix(['مَا', 'ma'], f));
			if (tense === 'present') return aff.map((f) => prefix(['لَا', 'la'], f));
			if (!subj) throw new Error('Fusha needs a subj: line');
			return subj.map((f) => prefix(['لَنْ', 'lan'], f));
		default:
			return aff.map((f) => prefix(['ما', 'ma'], f));
	}
}

const ASCII = /^[a-z0-9 ]+$/;
const ARABIC = /^[؀-ۿ ]+$/;

let written = 0;
for (const block of readFileSync(src, 'utf8').split(/^## /m).slice(1)) {
	const [slug, ...rest] = block.trim().split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
	const where = `${dialect}/${slug}`;
	const verb = NEW_VERBS.find((v) => v.slug === slug);
	if (!verb) throw new Error(`${where}: not in new-verbs.ts`);
	const f: Record<string, string> = {};
	for (const line of rest) {
		const i = line.indexOf(':');
		f[line.slice(0, i).trim()] = line.slice(i + 1).trim();
	}
	for (const key of ['cit', 'root', 'class', 'form', 'note', 'past']) {
		if (!f[key]) throw new Error(`${where}: missing ${key}`);
	}
	if (!CLASSES.includes(f.class)) throw new Error(`${where}: bad class ${f.class}`);
	if (!FORMS.includes(f.form)) throw new Error(`${where}: bad form ${f.form}`);

	const [citAr, citTr] = f.cit.split('/').map((s) => s.trim());
	const past = pairs(f.past, `${where} past`);
	let pres: AT[];
	let fut: AT[];
	if (dialect === 'fusha') {
		pres = pairs(f.pres, `${where} pres`);
		fut = f.fut ? pairs(f.fut, `${where} fut`) : fushaFuture(pres);
	} else {
		const derived = f.bare ? fromBare(pairs(f.bare, `${where} bare`)) : undefined;
		pres = f.pres ? pairs(f.pres, `${where} pres`) : derived!.pres;
		fut = f.fut ? pairs(f.fut, `${where} fut`) : derived!.fut;
	}
	const subj = f.subj ? pairs(f.subj, `${where} subj`) : undefined;

	// A preposition that follows every form (look *for*), after any negative ending.
	const [tailAr, tailTr] = f.tail ? f.tail.split('/').map((x) => x.trim()) : [];
	const withTail = (forms: AT[]): Record<Person, AT> =>
		persons(tailAr ? forms.map(([ar, tr]) => [`${ar} ${tailAr}`, `${tr} ${tailTr}`] as AT) : forms);

	const meta: VerbMeta = { slug, english: verb.english, root: f.root, verbClass: f.class, notes: f.note };
	const conjugations = {
		past: table(meta, 'past', withTail(past), withTail(negatives('past', past))),
		present: table(meta, 'present', withTail(pres), withTail(negatives('present', pres))),
		future: table(meta, 'future', withTail(fut), withTail(negatives('future', fut, subj)))
	};
	for (const t of Object.values(conjugations)) {
		for (const forms of Object.values(t)) {
			for (const form of forms) {
				if (!ARABIC.test(form.arabic) || /[گچپڤ]/.test(form.arabic)) throw new Error(`${where}: bad arabic "${form.arabic}"`);
				if (!ASCII.test(form.transliteration)) throw new Error(`${where}: bad transliteration "${form.transliteration}"`);
			}
		}
	}
	const citation: AT = tailAr ? [`${citAr} ${tailAr}`, `${citTr} ${tailTr}`] : [citAr, citTr];
	const file = { ...fileFor(meta, citation, conjugations), form: f.form, source: 'generated' };
	writeFileSync(join(DIR, dialect, `${slug}.json`), JSON.stringify(file, null, 2) + '\n');
	written++;
}
console.log(`${dialect}: wrote ${written}; index has ${rebuildIndex(join(DIR, dialect), dialect)} verbs`);
