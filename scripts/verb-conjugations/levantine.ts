/**
 * Levantine (Syrian / Lebanese / Palestinian common forms) conjugations.
 *
 * Past: the 1st/2nd person stem takes -t, -ti, -na, -tu; he/she/they are
 * written out. Present: b- + imperfect stem (bi-ftaH, bt-ishrab…), mn- for
 * "we". Future: raH + the bare imperfect. Negation: ma + the form.
 */
import {
	mapPersons,
	pastWe,
	table,
	fileFor,
	withOverrides,
	type AT,
	type Conjugations,
	type Person,
	type VerbMeta
} from './engine';
import { ENGLISH } from './english';

interface Spec {
	slug: string;
	/** He did it: the citation form. */
	howa: AT;
	root: string;
	cls: string;
	/** Past stem before -t / -na (fataH, ruH, la2ee). */
	s2: AT;
	heya: AT;
	homma: AT;
	/** Imperfect stem after the person prefix (ftaH, shuf, it7arrak, 7ki). */
	pres: AT;
	/** 'i': bi-ftaH / ti-ftaH; '': b-shuf / t-shuf. Ignored for stems starting with a vowel. */
	v: 'i' | '';
	/** Transliteration of the stem before a vowel ending (ksor → btiksri). */
	before?: string;
	/** A preposition that follows every form (ma3, 3ala, b). */
	after?: AT;
	notes: string;
	over?: Partial<Record<'past' | 'present' | 'future', Partial<Record<Person, AT>>>>;
	/** Write every negative form out (verbs like "to have"). */
	neg?: Partial<Record<'past' | 'present' | 'future', Record<Person, AT>>>;
}

const vowelStart = (tr: string) => /^[aeiou]/.test(tr);
const vowelEnd = (tr: string) => /[aeiou]$/.test(tr);
const ARABIC_FINAL_VOWEL = /[يىا]$/;

/** The "you (f)" and plural endings on a present stem. */
function endings(stem: AT, before?: string): { f: AT; pl: AT } {
	const [ar, tr] = stem;
	if (vowelEnd(tr)) {
		const base = tr.slice(0, -1);
		const arBase = ARABIC_FINAL_VOWEL.test(ar) ? ar.slice(0, -1) : ar;
		return { f: [`${arBase}ي`, `${base}i`], pl: [`${arBase}وا`, `${base}u`] };
	}
	const b = before ?? tr;
	return { f: [`${ar}ي`, `${b}i`], pl: [`${ar}وا`, `${b}u`] };
}

function conjugate(spec: Spec): Conjugations {
	const meta: VerbMeta = {
		slug: spec.slug,
		english: ENGLISH[spec.slug],
		root: spec.root,
		verbClass: spec.cls,
		notes: spec.notes
	};
	const after = (f: AT): AT => (spec.after ? [`${f[0]} ${spec.after[0]}`, `${f[1]} ${spec.after[1]}`] : f);
	const neg = (f: AT): AT => [`ما ${f[0]}`, `ma ${f[1]}`];

	const [s2a, s2t] = spec.s2;
	const past = withOverrides(
		{
			ana: [`${s2a}ت`, `${s2t}t`],
			enta: [`${s2a}ت`, `${s2t}t`],
			enti: [`${s2a}تي`, `${s2t}ti`],
			howa: spec.howa,
			heya: spec.heya,
			ehna: pastWe(spec.s2),
			entu: [`${s2a}توا`, `${s2t}tu`],
			homma: spec.homma
		},
		spec.over?.past
	);

	const [pa, pt] = spec.pres;
	const { f, pl } = endings(spec.pres, spec.before);
	const vi = vowelStart(pt);
	// Present prefixes in transliteration: [I, you/she, he, we].
	const [tI, tYou, tHe, tWe] = vi
		? ['b', 'bt', 'by', 'mn']
		: spec.v === 'i'
			? ['bi', 'bti', 'byi', 'mni']
			: ['b', 'bt', 'bi', 'mn'];
	const present = withOverrides(
		{
			ana: [`ب${pa}`, `${tI}${pt}`],
			enta: [`بت${pa}`, `${tYou}${pt}`],
			enti: [`بت${f[0]}`, `${tYou}${f[1]}`],
			howa: [`بي${pa}`, `${tHe}${pt}`],
			heya: [`بت${pa}`, `${tYou}${pt}`],
			ehna: [`من${pa}`, `${tWe}${pt}`],
			entu: [`بت${pl[0]}`, `${tYou}${pl[1]}`],
			homma: [`بي${pl[0]}`, `${tHe}${pl[1]}`]
		},
		spec.over?.present
	);

	// Future: raH + the bare imperfect (i-ftaH, t-shuf, y-it7arrak).
	const [fI, fYou, fHe, fWe] = vi
		? ['', 't', 'y', 'n']
		: spec.v === 'i'
			? ['i', 'ti', 'yi', 'ni']
			: ['', 't', 'y', 'n'];
	const anaAr = vi || spec.v === 'i' ? `ا${pa}` : pa;
	const raH = (f: AT): AT => [`رح ${f[0]}`, `ra7 ${f[1]}`];
	const future = withOverrides(
		{
			ana: raH([anaAr, `${fI}${pt}`]),
			enta: raH([`ت${pa}`, `${fYou}${pt}`]),
			enti: raH([`ت${f[0]}`, `${fYou}${f[1]}`]),
			howa: raH([`ي${pa}`, `${fHe}${pt}`]),
			heya: raH([`ت${pa}`, `${fYou}${pt}`]),
			ehna: raH([`ن${pa}`, `${fWe}${pt}`]),
			entu: raH([`ت${pl[0]}`, `${fYou}${pl[1]}`]),
			homma: raH([`ي${pl[0]}`, `${fHe}${pl[1]}`])
		},
		spec.over?.future
	);

	const finish = (aff: Record<Person, AT>, given?: Record<Person, AT>) => ({
		aff: mapPersons((p) => after(aff[p])),
		neg: mapPersons((p) => after(given ? given[p] : neg(aff[p])))
	});
	const p = finish(past, spec.neg?.past);
	const n = finish(present, spec.neg?.present);
	const fu = finish(future, spec.neg?.future);
	return {
		past: table(meta, 'past', p.aff, p.neg),
		present: table(meta, 'present', n.aff, n.neg),
		future: table(meta, 'future', fu.aff, fu.neg)
	};
}

const L = (s: Spec) => s;

/** "Have" is عند + a pronoun ending, not a verb. */
const have = (prefix: AT, ar: string[], tr: string[]): Record<Person, AT> =>
	Object.fromEntries(
		(['ana', 'enta', 'enti', 'howa', 'heya', 'ehna', 'entu', 'homma'] as const).map((p, i) => [
			p,
			[`${prefix[0]}${ar[i]}`.trim(), `${prefix[1]}${tr[i]}`.trim()]
		])
	) as Record<Person, AT>;
const INDI = ['عندي', 'عندك', 'عندك', 'عنده', 'عندها', 'عنا', 'عندكن', 'عندهن'];
const INDI_TR = ['3indi', '3indak', '3indik', '3indo', '3inda', '3inna', '3indkon', '3indon'];

export const SPECS: Spec[] = [
	L({ slug: 'wafi', howa: ['وافق', 'wafa2'], root: 'و ف ق', cls: 'sound', s2: ['وافق', 'wafa2'], heya: ['وافقت', 'wafa2it'], homma: ['وافقوا', 'wafa2u'], pres: ['وافق', 'wafe2'], v: '', before: 'waf2', notes: 'Form III verb: the long a stays in the past, and the present stem is wafe2.' }),
	L({ slug: 'rah-ma3a', howa: ['رافق', 'rafa2'], root: 'ر ف ق', cls: 'sound', s2: ['رافق', 'rafa2'], heya: ['رافقت', 'rafa2it'], homma: ['رافقوا', 'rafa2u'], pres: ['رافق', 'rafe2'], v: '', before: 'raf2', notes: 'Form III verb, like wafa2. Levantine says rafa2 where Egyptian says rah ma3a.' }),
	L({ slug: 'mi-i-ma3a', howa: ['مشي', 'mishi'], root: 'م ش ي', cls: 'defective', s2: ['مشي', 'mashee'], heya: ['مشيت', 'mishyit'], homma: ['مشيوا', 'mishyu'], pres: ['مشي', 'mshi'], v: 'i', after: ['مع', 'ma3'], notes: 'Defective verb ending in a vowel: mashee- before -t in the past, bimshi in the present.' }),
	L({ slug: 'abba', howa: ['ظبط', 'zabbat'], root: 'ض ب ط', cls: 'sound', s2: ['ظبط', 'zabbat'], heya: ['ظبطت', 'zabbatit'], homma: ['ظبطوا', 'zabbatu'], pres: ['ظبط', 'zabbit'], v: '', before: 'zabbt', notes: 'Form II verb with a doubled middle letter; the present stem changes a to i.' }),
	L({ slug: 'i3taraf', howa: ['اعترف', 'i3taraf'], root: 'ع ر ف', cls: 'form VIII', s2: ['اعترف', 'i3taraf'], heya: ['اعترفت', 'i3tarafit'], homma: ['اعترفوا', 'i3tarafu'], pres: ['عترف', 'i3tirif'], v: '', before: 'i3tirf', notes: 'Form VIII verb starting with i-: the present prefix joins straight on (bi3tirif, byi3tirif).' }),
	L({ slug: 'assar-3ala', howa: ['أثر', '2assar'], root: 'أ ث ر', cls: 'sound', s2: ['أثر', '2assar'], heya: ['أثرت', '2assarit'], homma: ['أثروا', '2assaru'], pres: ['أثر', '2assir'], v: '', before: '2assr', after: ['على', '3ala'], notes: 'Form II verb; the th of Fusha is pronounced s in Levantine.' }),
	L({ slug: 'samah', howa: ['سمح', 'sama7'], root: 'س م ح', cls: 'sound', s2: ['سمح', 'sama7'], heya: ['سمحت', 'sam7it'], homma: ['سمحوا', 'sam7u'], pres: ['سمح', 'sma7'], v: 'i', notes: 'Regular verb with an a in the present (bisma7).' }),
	L({ slug: 'i3tazar-3an', howa: ['اعتذر', 'i3tazar'], root: 'ع ذ ر', cls: 'form VIII', s2: ['اعتذر', 'i3tazar'], heya: ['اعتذرت', 'i3tazarit'], homma: ['اعتذروا', 'i3tazaru'], pres: ['عتذر', 'i3tizir'], v: '', before: 'i3tizr', after: ['عن', '3an'], notes: 'Form VIII verb; the dh of Fusha is pronounced z.' }),
	L({ slug: 'ahar', howa: ['ظهر', 'zahar'], root: 'ظ ه ر', cls: 'sound', s2: ['ظهر', 'zahar'], heya: ['ظهرت', 'zahrit'], homma: ['ظهروا', 'zahru'], pres: ['ظهر', 'zhar'], v: 'i', notes: 'Regular verb; the ظ is pronounced like a heavy z.' }),
	L({ slug: 'qaddar', howa: ['قدر', '2addar'], root: 'ق د ر', cls: 'sound', s2: ['قدر', '2addar'], heya: ['قدرت', '2addarit'], homma: ['قدروا', '2addaru'], pres: ['قدر', '2addir'], v: '', before: '2addr', notes: 'Form II verb; ق is a glottal stop (2) in most cities.' }),
	L({ slug: 'ri-i-bi', howa: ['رضي', 'ridi'], root: 'ر ض ي', cls: 'defective', s2: ['رضي', 'ridee'], heya: ['رضيت', 'ridyit'], homma: ['رضيوا', 'ridyu'], pres: ['رضى', 'rda'], v: 'i', after: ['بـ', 'b'], notes: 'Defective verb: ridi in the past, birda in the present.' }),
	L({ slug: 'sa-al', howa: ['سأل', 'sa2al'], root: 'س أ ل', cls: 'hamzated', s2: ['سأل', 'sa2al'], heya: ['سألت', 'sa2alit'], homma: ['سألوا', 'sa2alu'], pres: ['سأل', 's2al'], v: 'i', notes: 'The hamza is kept: bis2al, I ask.' }),
	L({ slug: 'ha-ar', howa: ['حضر', '7adar'], root: 'ح ض ر', cls: 'sound', s2: ['حضر', '7adar'], heya: ['حضرت', '7adrit'], homma: ['حضروا', '7adru'], pres: ['حضر', '7dar'], v: 'i', notes: 'Regular verb: bi7dar, I attend.' }),
	L({ slug: 'kan', howa: ['كان', 'kan'], root: 'ك و ن', cls: 'hollow', s2: ['كن', 'kun'], heya: ['كانت', 'kanit'], homma: ['كانوا', 'kanu'], pres: ['كون', 'kun'], v: '', notes: 'Hollow verb: kunt in the past, bikun (usually "will be" or "tends to be") in the present.' }),
	L({ slug: 'ihtaram', howa: ['احترم', 'i7taram'], root: 'ح ر م', cls: 'form VIII', s2: ['احترم', 'i7taram'], heya: ['احترمت', 'i7taramit'], homma: ['احترموا', 'i7taramu'], pres: ['حترم', 'i7tirim'], v: '', before: 'i7tirm', notes: 'Form VIII verb: bi7tirim, I respect.' }),
	L({ slug: 'rahin', howa: ['راهن', 'rahan'], root: 'ر ه ن', cls: 'sound', s2: ['راهن', 'rahan'], heya: ['راهنت', 'rahanit'], homma: ['راهنوا', 'rahanu'], pres: ['راهن', 'rahin'], v: '', before: 'rahn', notes: 'Form III verb: brahin, I bet.' }),
	L({ slug: 'lam-3ala', howa: ['لام', 'lam'], root: 'ل و م', cls: 'hollow', s2: ['لم', 'lum'], heya: ['لامت', 'lamit'], homma: ['لاموا', 'lamu'], pres: ['لوم', 'lum'], v: '', notes: 'Hollow verb: lumt in the past, blum in the present.' }),
	L({ slug: 'kasar', howa: ['كسر', 'kasar'], root: 'ك س ر', cls: 'sound', s2: ['كسر', 'kasar'], heya: ['كسرت', 'kasarit'], homma: ['كسروا', 'kasaru'], pres: ['كسر', 'ksor'], v: 'i', before: 'ksr', notes: 'Regular verb with o in the present: biksor, btiksri.' }),
	L({ slug: 'hara', howa: ['حرق', '7ara2'], root: 'ح ر ق', cls: 'sound', s2: ['حرق', '7ara2'], heya: ['حرقت', '7ar2it'], homma: ['حرقوا', '7ar2u'], pres: ['حرق', '7ro2'], v: 'i', before: '7r2', notes: 'Regular verb: bi7ro2, I burn.' }),
	L({ slug: 'ihtamm', howa: ['اهتم', 'ihtamm'], root: 'ه م م', cls: 'doubled', s2: ['اهتمي', 'ihtammee'], heya: ['اهتمت', 'ihtammit'], homma: ['اهتموا', 'ihtammu'], pres: ['هتم', 'ihtamm'], v: '', after: ['بـ', 'b'], notes: 'Doubled verb: ihtammeet in the past, bihtamm in the present.' }),
	L({ slug: 'ghayyar', howa: ['غير', 'ghayyar'], root: 'غ ي ر', cls: 'sound', s2: ['غير', 'ghayyar'], heya: ['غيرت', 'ghayyarit'], homma: ['غيروا', 'ghayyaru'], pres: ['غير', 'ghayyir'], v: '', before: 'ghayyr', notes: 'Form II verb: bghayyir, I change.' }),
	L({ slug: 'ixtar', howa: ['اختار', 'ikhtar'], root: 'خ ي ر', cls: 'hollow', s2: ['اختر', 'ikhtar'], heya: ['اختارت', 'ikhtarit'], homma: ['اختاروا', 'ikhtaru'], pres: ['ختار', 'ikhtar'], v: '', notes: 'Hollow Form VIII verb: the long a shortens before -t (ikhtart).' }),
	L({
		slug: 'gih', howa: ['إجا', 'ija'], root: 'ج ي ء', cls: 'irregular', s2: ['جي', 'jee'], heya: ['إجت', 'ijit'], homma: ['إجوا', 'iju'], pres: ['جي', 'ji'], v: '', notes: 'Irregular: ija in the past, biji in the present, and every form is worth learning by heart.',
		over: {
			present: { ana: ['باجي', 'baji'], enta: ['بتيجي', 'btiji'], enti: ['بتيجي', 'btiji'], howa: ['بيجي', 'biji'], heya: ['بتيجي', 'btiji'], ehna: ['منيجي', 'mniji'], entu: ['بتيجوا', 'btiju'], homma: ['بيجوا', 'biju'] },
			future: { ana: ['رح إجي', 'ra7 iji'], enta: ['رح تيجي', 'ra7 tiji'], enti: ['رح تيجي', 'ra7 tiji'], howa: ['رح ييجي', 'ra7 yiji'], heya: ['رح تيجي', 'ra7 tiji'], ehna: ['رح نيجي', 'ra7 niji'], entu: ['رح تيجوا', 'ra7 tiju'], homma: ['رح ييجوا', 'ra7 yiju'] }
		}
	}),
	L({ slug: 'qarin', howa: ['قارن', '2aran'], root: 'ق ر ن', cls: 'sound', s2: ['قارن', '2aran'], heya: ['قارنت', '2aranit'], homma: ['قارنوا', '2aranu'], pres: ['قارن', '2arin'], v: '', before: '2arn', notes: 'Form III verb: b2arin, I compare.' }),
	L({ slug: 'itta-al-bi', howa: ['اتصل', 'ittasal'], root: 'و ص ل', cls: 'form VIII', s2: ['اتصل', 'ittasal'], heya: ['اتصلت', 'ittasalit'], homma: ['اتصلوا', 'ittasalu'], pres: ['تصل', 'ittisil'], v: '', before: 'ittisl', after: ['بـ', 'b'], notes: 'Form VIII verb, used for calling someone: bittisil fik, I call you.' }),
	L({ slug: 'kammil', howa: ['كمل', 'kammal'], root: 'ك م ل', cls: 'sound', s2: ['كمل', 'kammal'], heya: ['كملت', 'kammalit'], homma: ['كملوا', 'kammalu'], pres: ['كمل', 'kammil'], v: '', before: 'kamml', notes: 'Form II verb: bkammil, I carry on.' }),
	L({ slug: 'rafa', howa: ['رفض', 'rafad'], root: 'ر ف ض', cls: 'sound', s2: ['رفض', 'rafad'], heya: ['رفضت', 'rafdit'], homma: ['رفضوا', 'rafdu'], pres: ['رفض', 'rfod'], v: 'i', before: 'rfd', notes: 'Regular verb: birfod, I refuse.' }),
	L({ slug: 'alab', howa: ['طلب', 'talab'], root: 'ط ل ب', cls: 'sound', s2: ['طلب', 'talab'], heya: ['طلبت', 'talbit'], homma: ['طلبوا', 'talbu'], pres: ['طلب', 'tlob'], v: 'i', before: 'tlb', notes: 'Regular verb: bitlob, I ask for or order.' }),
	L({ slug: 'nakar', howa: ['نكر', 'nakar'], root: 'ن ك ر', cls: 'sound', s2: ['نكر', 'nakar'], heya: ['نكرت', 'nakrit'], homma: ['نكروا', 'nakru'], pres: ['نكر', 'nkor'], v: 'i', before: 'nkr', notes: 'Regular verb: binkor, I deny.' }),
	L({ slug: 'wa-af', howa: ['وصف', 'wasaf'], root: 'و ص ف', cls: 'sound', s2: ['وصف', 'wasaf'], heya: ['وصفت', 'wasfit'], homma: ['وصفوا', 'wasfu'], pres: ['وصف', 'wsof'], v: 'i', before: 'wsf', notes: 'Regular verb: biwsof, I describe.' }),
	L({ slug: 'ammim', howa: ['صمم', 'sammam'], root: 'ص م م', cls: 'sound', s2: ['صمم', 'sammam'], heya: ['صممت', 'sammamit'], homma: ['صمموا', 'sammamu'], pres: ['صمم', 'sammim'], v: '', notes: 'Form II verb: bsammim, I design.' }),
	L({ slug: 'ixtalaf', howa: ['اختلف', 'ikhtalaf'], root: 'خ ل ف', cls: 'form VIII', s2: ['اختلف', 'ikhtalaf'], heya: ['اختلفت', 'ikhtalafit'], homma: ['اختلفوا', 'ikhtalafu'], pres: ['ختلف', 'ikhtilif'], v: '', before: 'ikhtilf', notes: 'Form VIII verb: bikhtilif, I differ or disagree.' }),
	L({ slug: 'ixtafa', howa: ['اختفى', 'ikhtafa'], root: 'خ ف ي', cls: 'defective', s2: ['اختفي', 'ikhtafee'], heya: ['اختفت', 'ikhtafit'], homma: ['اختفوا', 'ikhtafu'], pres: ['ختفي', 'ikhtifi'], v: '', notes: 'Defective Form VIII verb: ikhtafeet in the past, bikhtifi in the present.' }),
	L({ slug: 'wa-a3', howa: ['وقع', 'wa22a3'], root: 'و ق ع', cls: 'sound', s2: ['وقع', 'wa22a3'], heya: ['وقعت', 'wa22a3it'], homma: ['وقعوا', 'wa22a3u'], pres: ['وقع', 'wa22i3'], v: '', notes: 'Form II of "to fall": to drop something. bwa22i3, I drop.' }),
	L({ slug: '3abbar-3an', howa: ['عبر', '3abbar'], root: 'ع ب ر', cls: 'sound', s2: ['عبر', '3abbar'], heya: ['عبرت', '3abbarit'], homma: ['عبروا', '3abbaru'], pres: ['عبر', '3abbir'], v: '', before: '3abbr', after: ['عن', '3an'], notes: 'Form II verb: b3abbir 3an, I express.' }),
	L({ slug: 'wi-i3', howa: ['وقع', 'wi2i3'], root: 'و ق ع', cls: 'sound', s2: ['وقع', 'wi2i3'], heya: ['وقعت', 'wi23it'], homma: ['وقعوا', 'wi23u'], pres: ['وقع', 'w2a3'], v: 'i', notes: 'Regular verb: biw2a3, I fall.' }),
	L({ slug: 'la-a-la-a', howa: ['لقي', 'la2a'], root: 'ل ق ي', cls: 'defective', s2: ['لقي', 'la2ee'], heya: ['لقيت', 'la2it'], homma: ['لقيوا', 'la2yu'], pres: ['لاقي', 'la2i'], v: '', notes: 'Defective verb: la2eet, I found; bla2i, I find.' }),
	L({ slug: 'allah', howa: ['صلح', 'salla7'], root: 'ص ل ح', cls: 'sound', s2: ['صلح', 'salla7'], heya: ['صلحت', 'salla7it'], homma: ['صلحوا', 'salla7u'], pres: ['صلح', 'salli7'], v: '', notes: 'Form II verb: bsalli7, I fix.' }),
	L({ slug: 'afa', howa: ['طاف', 'taf'], root: 'ط و ف', cls: 'hollow', s2: ['طف', 'tuf'], heya: ['طافت', 'tafit'], homma: ['طافوا', 'tafu'], pres: ['طوف', 'tuf'], v: '', notes: 'Hollow verb: btuf, it floats.' }),
	L({ slug: 'idda', howa: ['أعطى', 'a3ta'], root: 'ع ط ي', cls: 'defective', s2: ['أعطي', 'a3tee'], heya: ['أعطت', 'a3tit'], homma: ['أعطوا', 'a3tu'], pres: ['عطي', 'a3ti'], v: '', notes: 'Defective Form IV verb: a3teet, I gave; ba3ti, I give.' }),
	L({ slug: 'rah', howa: ['راح', 'ra7'], root: 'ر و ح', cls: 'hollow', s2: ['رح', 'ru7'], heya: ['راحت', 'ra7it'], homma: ['راحوا', 'ra7u'], pres: ['روح', 'ru7'], v: '', notes: 'Hollow verb: ru7t, I went; bru7, I go. The future marker ra7 comes from this verb.' }),
	L({ slug: 'gara', howa: ['ركض', 'rakad'], root: 'ر ك ض', cls: 'sound', s2: ['ركض', 'rakad'], heya: ['ركضت', 'rakdit'], homma: ['ركضوا', 'rakdu'], pres: ['ركض', 'rkod'], v: 'i', before: 'rkd', notes: 'Regular verb: birkod, I run.' }),
	L({ slug: 'ha-al', howa: ['حصل', '7asal'], root: 'ح ص ل', cls: 'sound', s2: ['حصل', '7asal'], heya: ['حصلت', '7aslit'], homma: ['حصلوا', '7aslu'], pres: ['حصل', '7sal'], v: 'i', notes: 'Mostly used for things: shu 7asal? What happened?' }),
	L({
		slug: 'kan-3andu', howa: ['كان عنده', 'kan 3indo'], root: 'ع ن د', cls: 'irregular', s2: ['', ''], heya: ['', ''], homma: ['', ''], pres: ['', ''], v: '', notes: '"To have" is 3ind plus a pronoun ending: 3indi, I have. The past adds kan, the future ra7 ykun.',
		over: {
			past: have(['كان ', 'kan '], INDI, INDI_TR),
			present: have(['', ''], INDI, INDI_TR),
			future: have(['رح يكون ', 'ra7 ykun '], INDI, INDI_TR)
		},
		neg: {
			past: have(['ما كان ', 'ma kan '], INDI, INDI_TR),
			present: have(['ما ', 'ma '], INDI, INDI_TR),
			future: have(['ما رح يكون ', 'ma ra7 ykun '], INDI, INDI_TR)
		}
	}),
	L({ slug: 'sa3id', howa: ['ساعد', 'sa3ad'], root: 'س ع د', cls: 'sound', s2: ['ساعد', 'sa3ad'], heya: ['ساعدت', 'sa3adit'], homma: ['ساعدوا', 'sa3adu'], pres: ['ساعد', 'sa3id'], v: '', before: 'sa3d', notes: 'Form III verb: bsa3id, I help.' }),
	L({ slug: 'arab', howa: ['ضرب', 'darab'], root: 'ض ر ب', cls: 'sound', s2: ['ضرب', 'darab'], heya: ['ضربت', 'darbit'], homma: ['ضربوا', 'darbu'], pres: ['ضرب', 'drob'], v: 'i', before: 'drb', notes: 'Regular verb: bidrob, I hit.' }),
	L({ slug: 'xaba', howa: ['خبط', 'khabat'], root: 'خ ب ط', cls: 'sound', s2: ['خبط', 'khabat'], heya: ['خبطت', 'khabtit'], homma: ['خبطوا', 'khabtu'], pres: ['خبط', 'khbot'], v: 'i', before: 'khbt', notes: 'Regular verb for bumping or banging into something.' }),
	L({ slug: 'nawa', howa: ['نوى', 'nawa'], root: 'ن و ي', cls: 'defective', s2: ['نوي', 'nawee'], heya: ['نوت', 'nawit'], homma: ['نووا', 'nawu'], pres: ['نوي', 'nwi'], v: 'i', notes: 'Defective verb: naweet, I intended; binwi, I intend.' }),
	L({ slug: 'na', howa: ['نط', 'natt'], root: 'ن ط ط', cls: 'doubled', s2: ['نطي', 'nattee'], heya: ['نطت', 'nattit'], homma: ['نطوا', 'nattu'], pres: ['نط', 'nott'], v: '', notes: 'Doubled verb: natteet, I jumped; bnott, I jump.' }),
	L({ slug: 'sab', howa: ['ترك', 'tarak'], root: 'ت ر ك', cls: 'sound', s2: ['ترك', 'tarak'], heya: ['تركت', 'tarkit'], homma: ['تركوا', 'tarku'], pres: ['ترك', 'trok'], v: 'i', before: 'trk', notes: 'Regular verb: bitrok, I leave something or someone.' }),
	L({ slug: 'kidib', howa: ['كذب', 'kazab'], root: 'ك ذ ب', cls: 'sound', s2: ['كذب', 'kazab'], heya: ['كذبت', 'kazbit'], homma: ['كذبوا', 'kazbu'], pres: ['كذب', 'kzob'], v: 'i', before: 'kzb', notes: 'Regular verb; the dh of Fusha is pronounced z: bikzob, I lie.' }),
	L({ slug: '3a', howa: ['عاش', '3ash'], root: 'ع ي ش', cls: 'hollow', s2: ['عش', '3ish'], heya: ['عاشت', '3ashit'], homma: ['عاشوا', '3ashu'], pres: ['عيش', '3ish'], v: '', notes: 'Hollow verb with a middle ي: 3isht, I lived; b3ish, I live.' }),
	L({ slug: 'ba-li', howa: ['طلع', 'talla3'], root: 'ط ل ع', cls: 'sound', s2: ['طلع', 'talla3'], heya: ['طلعت', 'talla3it'], homma: ['طلعوا', 'talla3u'], pres: ['طلع', 'talli3'], v: '', after: ['على', '3ala'], notes: 'Form II verb: talla3 3ala, to look at. Without the doubling, tili3 means to go out.' }),
	L({ slug: 'xisir', howa: ['خسر', 'khisir'], root: 'خ س ر', cls: 'sound', s2: ['خسر', 'khsir'], heya: ['خسرت', 'khisrit'], homma: ['خسروا', 'khisru'], pres: ['خسر', 'khsar'], v: 'i', notes: 'Regular verb with i in the past: khsirt, I lost.' }),
	L({ slug: 'a-ad', howa: ['قصد', '2asad'], root: 'ق ص د', cls: 'sound', s2: ['قصد', '2asad'], heya: ['قصدت', '2asdit'], homma: ['قصدوا', '2asdu'], pres: ['قصد', '2sod'], v: 'i', before: '2sd', notes: 'Regular verb: shu bti2sod? What do you mean?' }),
	L({ slug: 'itharrak', howa: ['اتحرك', 'it7arrak'], root: 'ح ر ك', cls: 'form V', s2: ['اتحرك', 'it7arrak'], heya: ['اتحركت', 'it7arrakit'], homma: ['اتحركوا', 'it7arraku'], pres: ['تحرك', 'it7arrak'], v: '', notes: 'Form V verb: bit7arrak, I move.' }),
	L({ slug: 'harrak', howa: ['حرك', '7arrak'], root: 'ح ر ك', cls: 'sound', s2: ['حرك', '7arrak'], heya: ['حركت', '7arrakit'], homma: ['حركوا', '7arraku'], pres: ['حرك', '7arrik'], v: '', notes: 'Form II verb: b7arrik, I move something.' }),
	L({ slug: 'fatah', howa: ['فتح', 'fata7'], root: 'ف ت ح', cls: 'sound', s2: ['فتح', 'fata7'], heya: ['فتحت', 'fat7it'], homma: ['فتحوا', 'fat7u'], pres: ['فتح', 'fta7'], v: 'i', notes: 'Regular verb: bifta7, I open.' }),
	L({ slug: 'gahhiz', howa: ['جهز', 'jahhaz'], root: 'ج ه ز', cls: 'sound', s2: ['جهز', 'jahhaz'], heya: ['جهزت', 'jahhazit'], homma: ['جهزوا', 'jahhazu'], pres: ['جهز', 'jahhiz'], v: '', notes: 'Form II verb: bjahhiz, I get something ready.' }),
	L({ slug: 'mana3', howa: ['منع', 'mana3'], root: 'م ن ع', cls: 'sound', s2: ['منع', 'mana3'], heya: ['منعت', 'man3it'], homma: ['منعوا', 'man3u'], pres: ['منع', 'mna3'], v: 'i', notes: 'Regular verb: mamnu3, forbidden, comes from it.' }),
	L({ slug: '3aqib', howa: ['عاقب', '3aqab'], root: 'ع ق ب', cls: 'sound', s2: ['عاقب', '3aqab'], heya: ['عاقبت', '3aqabit'], homma: ['عاقبوا', '3aqabu'], pres: ['عاقب', '3aqib'], v: '', before: '3aqb', notes: 'Form III verb: b3aqib, I punish.' }),
	L({ slug: 'warra', howa: ['فرجى', 'farja'], root: 'ف ر ج', cls: 'defective', s2: ['فرجي', 'farjee'], heya: ['فرجت', 'farjit'], homma: ['فرجوا', 'farju'], pres: ['فرجي', 'farji'], v: '', notes: 'Levantine for "to show": farjeeni, show me.' }),
	L({ slug: 'ghiri', howa: ['غرق', 'ghiri2'], root: 'غ ر ق', cls: 'sound', s2: ['غرق', 'ghri2'], heya: ['غرقت', 'ghir2it'], homma: ['غرقوا', 'ghir2u'], pres: ['غرق', 'ghra2'], v: 'i', notes: 'Regular verb: bighra2, I sink or drown.' }),
	L({ slug: 'istanna', howa: ['استنى', 'stanna'], root: 'أ ن ي', cls: 'defective', s2: ['استني', 'stannee'], heya: ['استنت', 'stannit'], homma: ['استنوا', 'stannu'], pres: ['ستنى', 'stanna'], v: '', notes: 'Defective verb: stanna! Wait! bistanna, I wait.' }),
	L({ slug: 'a3ad', howa: ['ضل', 'dall'], root: 'ض ل ل', cls: 'doubled', s2: ['ضلي', 'dallee'], heya: ['ضلت', 'dallit'], homma: ['ضلوا', 'dallu'], pres: ['ضل', 'dall'], v: '', notes: 'Doubled verb: to stay, or to keep doing something (dall yi7ki, he kept talking).' }),
	L({ slug: 'nigih', howa: ['نجح', 'naja7'], root: 'ن ج ح', cls: 'sound', s2: ['نجح', 'naja7'], heya: ['نجحت', 'naj7it'], homma: ['نجحوا', 'naj7u'], pres: ['نجح', 'nja7'], v: 'i', notes: 'Regular verb: binja7, I succeed or pass.' }),
	L({
		slug: 'a-xad', howa: ['أخد', 'akhad'], root: 'أ خ ذ', cls: 'hamzated', s2: ['أخد', 'akhad'], heya: ['أخدت', 'akhadit'], homma: ['أخدوا', 'akhadu'], pres: ['اخد', 'akhod'], v: '', before: 'akhd', notes: 'Hamzated verb: bakhod, I take; the hamza becomes a long a.',
		over: { future: { ana: ['رح آخد', 'ra7 akhod'] } }
	}),
	L({ slug: 'mazza', howa: ['مزق', 'mazza2'], root: 'م ز ق', cls: 'sound', s2: ['مزق', 'mazza2'], heya: ['مزقت', 'mazza2it'], homma: ['مزقوا', 'mazza2u'], pres: ['مزق', 'mazzi2'], v: '', notes: 'Form II verb: bmazzi2, I tear up.' }),
	L({ slug: 'akar', howa: ['شكر', 'shakar'], root: 'ش ك ر', cls: 'sound', s2: ['شكر', 'shakar'], heya: ['شكرت', 'shakrit'], homma: ['شكروا', 'shakru'], pres: ['شكر', 'shkor'], v: 'i', before: 'shkr', notes: 'Regular verb: bishkor, I thank.' }),
	L({ slug: 'raba', howa: ['ربط', 'rabat'], root: 'ر ب ط', cls: 'sound', s2: ['ربط', 'rabat'], heya: ['ربطت', 'rabtit'], homma: ['ربطوا', 'rabtu'], pres: ['ربط', 'rbot'], v: 'i', before: 'rbt', notes: 'Regular verb: birbot, I tie.' }),
	L({ slug: 'lamas', howa: ['لمس', 'lamas'], root: 'ل م س', cls: 'sound', s2: ['لمس', 'lamas'], heya: ['لمست', 'lamsit'], homma: ['لمسوا', 'lamsu'], pres: ['لمس', 'lmos'], v: 'i', before: 'lms', notes: 'Regular verb: bilmos, I touch.' }),
	L({ slug: 'ista3mil', howa: ['استعمل', 'ista3mal'], root: 'ع م ل', cls: 'form X', s2: ['استعمل', 'ista3mal'], heya: ['استعملت', 'ista3malit'], homma: ['استعملوا', 'ista3malu'], pres: ['ستعمل', 'ista3mil'], v: '', before: 'ista3ml', notes: 'Form X verb: bista3mil, I use.' })
];

export function build(spec: Spec): Record<string, unknown> {
	const meta: VerbMeta = {
		slug: spec.slug,
		english: ENGLISH[spec.slug],
		root: spec.root,
		verbClass: spec.cls,
		notes: spec.notes
	};
	const citation: AT = spec.after
		? [`${spec.howa[0]} ${spec.after[0]}`, `${spec.howa[1]} ${spec.after[1]}`]
		: spec.howa;
	return fileFor(meta, citation, conjugate(spec));
}
