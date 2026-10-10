/**
 * Moroccan Darija conjugations.
 *
 * Past: the 1st/2nd person stem takes -t (I), -ti (you, both genders), -na,
 * -tiw; he/she/they are written out. Present: ka- + n/t/y + stem
 * (kanktb, katktb, kayktb), plural -u (-w after a vowel). Future: ghadi + the
 * bare form. Negation wraps the verb: ma … -sh, and ma ghadish for the future.
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
	howa: AT;
	root: string;
	cls: string;
	/** Past stem before -t / -na (ktb → ktebt: kteb). */
	s2: AT;
	heya: AT;
	homma: AT;
	/** Present stem after n-/t-/y- (kteb, shuf, mshi, akhod). */
	pres: AT;
	/** Transliteration before a vowel ending (kteb → katkatbi: ketb). */
	before?: string;
	after?: AT;
	notes: string;
	over?: Partial<Record<'past' | 'present' | 'future', Partial<Record<Person, AT>>>>;
	neg?: Partial<Record<'past' | 'present' | 'future', Record<Person, AT>>>;
}

function endings(stem: AT, before?: string): { f: AT; pl: AT } {
	const [ar, tr] = stem;
	if (tr.endsWith('i')) return { f: stem, pl: [`${ar}و`, `${tr}w`] };
	if (tr.endsWith('a')) {
		const base = ar.endsWith('ى') ? ar.slice(0, -1) + 'ا' : ar;
		return { f: [`${base}ي`, `${tr}y`], pl: [`${base}و`, `${tr}w`] };
	}
	const b = before ?? tr;
	return { f: [`${ar}ي`, `${b}i`], pl: [`${ar}و`, `${b}u`] };
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
	// A final ى is written ا once the ش is added: لقى → ما لقاش.
	const maSh = (f: AT): AT => [`ما ${f[0].replace(/ى$/, 'ا')}ش`, `ma ${f[1]}sh`];

	const [s2a, s2t] = spec.s2;
	const past = withOverrides(
		{
			ana: [`${s2a}ت`, `${s2t}t`],
			enta: [`${s2a}تي`, `${s2t}ti`],
			enti: [`${s2a}تي`, `${s2t}ti`],
			howa: spec.howa,
			heya: spec.heya,
			ehna: pastWe(spec.s2),
			entu: [`${s2a}تيو`, `${s2t}tiw`],
			homma: spec.homma
		},
		spec.over?.past
	);

	const [pa, pt] = spec.pres;
	const { f, pl } = endings(spec.pres, spec.before);
	const present = withOverrides(
		{
			ana: [`كن${pa}`, `kan${pt}`],
			enta: [`كت${pa}`, `kat${pt}`],
			enti: [`كت${f[0]}`, `kat${f[1]}`],
			howa: [`كي${pa}`, `kay${pt}`],
			heya: [`كت${pa}`, `kat${pt}`],
			ehna: [`كن${pl[0]}`, `kan${pl[1]}`],
			entu: [`كت${pl[0]}`, `kat${pl[1]}`],
			homma: [`كي${pl[0]}`, `kay${pl[1]}`]
		},
		spec.over?.present
	);

	// The bare form after ghadi: n-/t-/y- + stem.
	const bare = withOverrides({
		ana: [`ن${pa}`, `n${pt}`],
		enta: [`ت${pa}`, `t${pt}`],
		enti: [`ت${f[0]}`, `t${f[1]}`],
		howa: [`ي${pa}`, `y${pt}`],
		heya: [`ت${pa}`, `t${pt}`],
		ehna: [`ن${pl[0]}`, `n${pl[1]}`],
		entu: [`ت${pl[0]}`, `t${pl[1]}`],
		homma: [`ي${pl[0]}`, `y${pl[1]}`]
	});
	const future = withOverrides(
		mapPersons((p) => [`غادي ${bare[p][0]}`, `ghadi ${bare[p][1]}`]),
		spec.over?.future
	);
	const futureNeg = mapPersons((p): AT => {
		const form = spec.over?.future?.[p] ? future[p] : [`غادي ${bare[p][0]}`, `ghadi ${bare[p][1]}`];
		// ma ghadish + the bare form.
		return [form[0].replace(/^غادي /, 'ما غاديش '), form[1].replace(/^ghadi /, 'ma ghadish ')];
	});

	const finish = (aff: Record<Person, AT>, negs: Record<Person, AT>) => ({
		aff: mapPersons((p) => after(aff[p])),
		neg: mapPersons((p) => after(negs[p]))
	});
	const p = finish(past, spec.neg?.past ?? mapPersons((x) => maSh(past[x])));
	const n = finish(present, spec.neg?.present ?? mapPersons((x) => maSh(present[x])));
	const fu = finish(future, spec.neg?.future ?? futureNeg);
	return {
		past: table(meta, 'past', p.aff, p.neg),
		present: table(meta, 'present', n.aff, n.neg),
		future: table(meta, 'future', fu.aff, fu.neg)
	};
}

const D = (s: Spec) => s;

const have = (prefix: AT, ar: string[], tr: string[], suffix: AT = ['', '']): Record<Person, AT> =>
	Object.fromEntries(
		(['ana', 'enta', 'enti', 'howa', 'heya', 'ehna', 'entu', 'homma'] as const).map((p, i) => [
			p,
			[`${prefix[0]}${ar[i]}${suffix[0]}`, `${prefix[1]}${tr[i]}${suffix[1]}`]
		])
	) as Record<Person, AT>;
const ENDI = ['عندي', 'عندك', 'عندك', 'عندو', 'عندها', 'عندنا', 'عندكم', 'عندهم'];
const ENDI_TR = ['3endi', '3endek', '3endek', '3endu', '3endha', '3endna', '3endkum', '3endhum'];

export const SPECS: Spec[] = [
	D({ slug: 'wafi', howa: ['وافق', 'wafeq'], root: 'و ف ق', cls: 'sound', s2: ['وافق', 'wafeq'], heya: ['وافقات', 'wafqat'], homma: ['وافقو', 'wafqu'], pres: ['وافق', 'wafeq'], before: 'wafq', notes: 'Form III verb: kanwafeq, I agree or accept.' }),
	D({ slug: 'rah-ma3a', howa: ['رافق', 'rafeq'], root: 'ر ف ق', cls: 'sound', s2: ['رافق', 'rafeq'], heya: ['رافقات', 'rafqat'], homma: ['رافقو', 'rafqu'], pres: ['رافق', 'rafeq'], before: 'rafq', notes: 'Form III verb: kanrafeq, I accompany.' }),
	D({ slug: 'mi-i-ma3a', howa: ['مشى', 'msha'], root: 'م ش ي', cls: 'defective', s2: ['مشي', 'mshi'], heya: ['مشات', 'mshat'], homma: ['مشاو', 'mshaw'], pres: ['مشي', 'mshi'], after: ['مع', 'm3a'], notes: 'Defective verb: mshit, I went; kanmshi, I go. With m3a it means to go along with someone.' }),
	D({ slug: 'abba', howa: ['ضبط', 'dbet'], root: 'ض ب ط', cls: 'sound', s2: ['ضبط', 'dbet'], heya: ['ضبطات', 'debtat'], homma: ['ضبطو', 'debtu'], pres: ['ضبط', 'dbet'], before: 'debt', notes: 'Regular verb: kandbet, I adjust or get something right.' }),
	D({ slug: 'i3taraf', howa: ['اعترف', '3taref'], root: 'ع ر ف', cls: 'form VIII', s2: ['اعترف', '3taref'], heya: ['اعترفات', '3tarfat'], homma: ['اعترفو', '3tarfu'], pres: ['عترف', '3taref'], before: '3tarf', notes: 'Form VIII verb: kan3taref, I admit.' }),
	D({ slug: 'assar-3ala', howa: ['أثر', 'atter'], root: 'أ ث ر', cls: 'sound', s2: ['أثر', 'atter'], heya: ['أثرات', 'atterat'], homma: ['أثرو', 'atteru'], pres: ['أثر', 'atter'], after: ['على', '3la'], notes: 'Form II verb; th becomes t in Darija.' }),
	D({ slug: 'samah', howa: ['سمح', 'sme7'], root: 'س م ح', cls: 'sound', s2: ['سمح', 'sme7'], heya: ['سمحات', 'sem7at'], homma: ['سمحو', 'sem7u'], pres: ['سمح', 'sme7'], before: 'sem7', notes: 'Regular verb: to allow, and also to forgive (sme7li, excuse me).' }),
	D({ slug: 'i3tazar-3an', howa: ['اعتذر', '3tader'], root: 'ع ذ ر', cls: 'form VIII', s2: ['اعتذر', '3tader'], heya: ['اعتذرات', '3tadrat'], homma: ['اعتذرو', '3tadru'], pres: ['عتذر', '3tader'], before: '3tadr', after: ['على', '3la'], notes: 'Form VIII verb; dh becomes d in Darija.' }),
	D({ slug: 'ahar', howa: ['بان', 'ban'], root: 'ب ي ن', cls: 'hollow', s2: ['بن', 'ben'], heya: ['بانت', 'bant'], homma: ['بانو', 'banu'], pres: ['بان', 'ban'], notes: 'Hollow verb: kayban, it appears or seems.' }),
	D({ slug: 'qaddar', howa: ['قدر', 'qedder'], root: 'ق د ر', cls: 'sound', s2: ['قدر', 'qedder'], heya: ['قدرات', 'qeddrat'], homma: ['قدرو', 'qeddru'], pres: ['قدر', 'qedder'], before: 'qeddr', notes: 'Form II verb: kanqedder, I appreciate.' }),
	D({ slug: 'ri-i-bi', howa: ['وافق', 'wafeq'], root: 'و ف ق', cls: 'sound', s2: ['وافق', 'wafeq'], heya: ['وافقات', 'wafqat'], homma: ['وافقو', 'wafqu'], pres: ['وافق', 'wafeq'], before: 'wafq', after: ['على', '3la'], notes: 'Darija approves of something with wafeq 3la.' }),
	D({ slug: 'sa-al', howa: ['سول', 'sewwel'], root: 'س أ ل', cls: 'sound', s2: ['سول', 'sewwel'], heya: ['سولات', 'sewwlat'], homma: ['سولو', 'sewwlu'], pres: ['سول', 'sewwel'], before: 'sewwl', notes: 'Darija asks with sewwel: kansewwel, I ask.' }),
	D({ slug: 'ha-ar', howa: ['حضر', '7der'], root: 'ح ض ر', cls: 'sound', s2: ['حضر', '7der'], heya: ['حضرات', '7edrat'], homma: ['حضرو', '7edru'], pres: ['حضر', '7der'], before: '7edr', notes: 'Regular verb: kan7der, I attend.' }),
	D({ slug: 'kan', howa: ['كان', 'kan'], root: 'ك و ن', cls: 'hollow', s2: ['كن', 'kun'], heya: ['كانت', 'kant'], homma: ['كانو', 'kanu'], pres: ['كون', 'kun'], notes: 'Hollow verb: kunt, I was; kankun, I am (usually or habitually).' }),
	D({ slug: 'ihtaram', howa: ['احترم', '7tarem'], root: 'ح ر م', cls: 'form VIII', s2: ['احترم', '7tarem'], heya: ['احترمات', '7termat'], homma: ['احترمو', '7termu'], pres: ['حترم', '7tarem'], before: '7term', notes: 'Form VIII verb: kan7tarem, I respect.' }),
	D({ slug: 'rahin', howa: ['راهن', 'rahen'], root: 'ر ه ن', cls: 'sound', s2: ['راهن', 'rahen'], heya: ['راهنات', 'rahnat'], homma: ['راهنو', 'rahnu'], pres: ['راهن', 'rahen'], before: 'rahn', notes: 'Form III verb: kanrahen, I bet.' }),
	D({ slug: 'lam-3ala', howa: ['لام', 'lam'], root: 'ل و م', cls: 'hollow', s2: ['لم', 'lum'], heya: ['لامت', 'lamt'], homma: ['لامو', 'lamu'], pres: ['لوم', 'lum'], after: ['على', '3la'], notes: 'Hollow verb: kanlum, I blame.' }),
	D({ slug: 'kasar', howa: ['هرس', 'herres'], root: 'ه ر س', cls: 'sound', s2: ['هرس', 'herres'], heya: ['هرسات', 'herrsat'], homma: ['هرسو', 'herrsu'], pres: ['هرس', 'herres'], before: 'herrs', notes: 'Darija breaks things with herres: kanherres, I break.' }),
	D({ slug: 'hara', howa: ['حرق', '7req'], root: 'ح ر ق', cls: 'sound', s2: ['حرق', '7req'], heya: ['حرقات', '7erqat'], homma: ['حرقو', '7erqu'], pres: ['حرق', '7req'], before: '7erq', notes: 'Regular verb: kan7req, I burn.' }),
	D({ slug: 'ihtamm', howa: ['اهتم', 'htemm'], root: 'ه م م', cls: 'doubled', s2: ['اهتمي', 'htemmi'], heya: ['اهتمات', 'htemmat'], homma: ['اهتمو', 'htemmu'], pres: ['هتم', 'htemm'], after: ['بـ', 'b'], notes: 'Doubled verb: htemmit, I cared; kanhtemm, I care.' }),
	D({ slug: 'ghayyar', howa: ['بدل', 'beddel'], root: 'ب د ل', cls: 'sound', s2: ['بدل', 'beddel'], heya: ['بدلات', 'beddlat'], homma: ['بدلو', 'beddlu'], pres: ['بدل', 'beddel'], before: 'beddl', notes: 'Darija changes things with beddel: kanbeddel, I change.' }),
	D({ slug: 'ixtar', howa: ['ختار', 'khtar'], root: 'خ ي ر', cls: 'hollow', s2: ['ختر', 'khter'], heya: ['ختارت', 'khtart'], homma: ['ختارو', 'khtaru'], pres: ['ختار', 'khtar'], notes: 'Hollow Form VIII verb: kankhtar, I choose.' }),
	D({ slug: 'gih', howa: ['جا', 'ja'], root: 'ج ي ء', cls: 'irregular', s2: ['جي', 'ji'], heya: ['جات', 'jat'], homma: ['جاو', 'jaw'], pres: ['جي', 'ji'], notes: 'Irregular: ja, he came; jit, I came; kanji, I come.' }),
	D({ slug: 'qarin', howa: ['قارن', 'qaren'], root: 'ق ر ن', cls: 'sound', s2: ['قارن', 'qaren'], heya: ['قارنات', 'qarnat'], homma: ['قارنو', 'qarnu'], pres: ['قارن', 'qaren'], before: 'qarn', notes: 'Form III verb: kanqaren, I compare.' }),
	D({ slug: 'itta-al-bi', howa: ['تاصل', 'ttasel'], root: 'و ص ل', cls: 'form VIII', s2: ['تاصل', 'ttasel'], heya: ['تاصلات', 'ttaslat'], homma: ['تاصلو', 'ttaslu'], pres: ['تاصل', 'ttasel'], before: 'ttasl', after: ['بـ', 'b'], notes: 'Form VIII verb for getting in touch: kanttasel bik, I contact you.' }),
	D({ slug: 'kammil', howa: ['كمل', 'kemmel'], root: 'ك م ل', cls: 'sound', s2: ['كمل', 'kemmel'], heya: ['كملات', 'kemmlat'], homma: ['كملو', 'kemmlu'], pres: ['كمل', 'kemmel'], before: 'kemml', notes: 'Form II verb: kankemmel, I carry on or finish.' }),
	D({ slug: 'rafa', howa: ['رفض', 'rfed'], root: 'ر ف ض', cls: 'sound', s2: ['رفض', 'rfed'], heya: ['رفضات', 'refdat'], homma: ['رفضو', 'refdu'], pres: ['رفض', 'rfed'], before: 'refd', notes: 'Regular verb: kanrfed, I refuse.' }),
	D({ slug: 'alab', howa: ['طلب', 'tleb'], root: 'ط ل ب', cls: 'sound', s2: ['طلب', 'tleb'], heya: ['طلبات', 'telbat'], homma: ['طلبو', 'telbu'], pres: ['طلب', 'tleb'], before: 'telb', notes: 'Regular verb: kantleb, I ask for.' }),
	D({ slug: 'nakar', howa: ['نكر', 'nker'], root: 'ن ك ر', cls: 'sound', s2: ['نكر', 'nker'], heya: ['نكرات', 'nekrat'], homma: ['نكرو', 'nekru'], pres: ['نكر', 'nker'], before: 'nekr', notes: 'Regular verb: kannker, I deny.' }),
	D({ slug: 'wa-af', howa: ['وصف', 'wsef'], root: 'و ص ف', cls: 'sound', s2: ['وصف', 'wsef'], heya: ['وصفات', 'wesfat'], homma: ['وصفو', 'wesfu'], pres: ['وصف', 'wsef'], before: 'wesf', notes: 'Regular verb: kanwsef, I describe.' }),
	D({ slug: 'ammim', howa: ['صمم', 'sammem'], root: 'ص م م', cls: 'sound', s2: ['صمم', 'sammem'], heya: ['صممات', 'sammemat'], homma: ['صممو', 'sammemu'], pres: ['صمم', 'sammem'], notes: 'Form II verb: kansammem, I design.' }),
	D({ slug: 'ixtalaf', howa: ['ختالف', 'khtalef'], root: 'خ ل ف', cls: 'form VIII', s2: ['ختالف', 'khtalef'], heya: ['ختالفات', 'khtalfat'], homma: ['ختالفو', 'khtalfu'], pres: ['ختالف', 'khtalef'], before: 'khtalf', notes: 'Form VIII verb: kankhtalef, I differ.' }),
	D({ slug: 'ixtafa', howa: ['غبر', 'ghber'], root: 'غ ب ر', cls: 'sound', s2: ['غبر', 'ghber'], heya: ['غبرات', 'ghebrat'], homma: ['غبرو', 'ghebru'], pres: ['غبر', 'ghber'], before: 'ghebr', notes: 'Darija disappears with ghber: fin ghberti? Where did you disappear to?' }),
	D({ slug: 'wa-a3', howa: ['طيح', 'tiyye7'], root: 'ط ي ح', cls: 'sound', s2: ['طيح', 'tiyye7'], heya: ['طيحات', 'tiyy7at'], homma: ['طيحو', 'tiyy7u'], pres: ['طيح', 'tiyye7'], before: 'tiyy7', notes: 'Form II of ta7, to fall: to drop something.' }),
	D({ slug: '3abbar-3an', howa: ['عبر', '3ebber'], root: 'ع ب ر', cls: 'sound', s2: ['عبر', '3ebber'], heya: ['عبرات', '3ebbrat'], homma: ['عبرو', '3ebbru'], pres: ['عبر', '3ebber'], before: '3ebbr', after: ['على', '3la'], notes: 'Form II verb: kan3ebber 3la, I express.' }),
	D({ slug: 'wi-i3', howa: ['طاح', 'ta7'], root: 'ط ي ح', cls: 'hollow', s2: ['طح', 'te7'], heya: ['طاحت', 'ta7t'], homma: ['طاحو', 'ta7u'], pres: ['طيح', 'ti7'], notes: 'Hollow verb: ta7, he fell; kanti7, I fall.' }),
	D({ slug: 'la-a-la-a', howa: ['لقى', 'lqa'], root: 'ل ق ي', cls: 'defective', s2: ['لقي', 'lqi'], heya: ['لقات', 'lqat'], homma: ['لقاو', 'lqaw'], pres: ['لقى', 'lqa'], notes: 'Defective verb: lqit, I found; kanlqa, I find.' }),
	D({ slug: 'allah', howa: ['صاوب', 'sawb'], root: 'ص و ب', cls: 'sound', s2: ['صاوب', 'sawb'], heya: ['صاوبات', 'sawbat'], homma: ['صاوبو', 'sawbu'], pres: ['صاوب', 'sawb'], notes: 'Darija fixes or makes things with sawb: kansawb, I fix.' }),
	D({ slug: 'afa', howa: ['عام', '3am'], root: 'ع و م', cls: 'hollow', s2: ['عم', '3um'], heya: ['عامت', '3amt'], homma: ['عامو', '3amu'], pres: ['عوم', '3um'], notes: 'Hollow verb meaning to swim or float: kay3um, it floats.' }),
	D({ slug: 'idda', howa: ['عطى', '3ta'], root: 'ع ط ي', cls: 'defective', s2: ['عطي', '3ti'], heya: ['عطات', '3tat'], homma: ['عطاو', '3taw'], pres: ['عطي', '3ti'], notes: 'Defective verb: 3tit, I gave; kan3ti, I give.' }),
	D({ slug: 'rah', howa: ['مشى', 'msha'], root: 'م ش ي', cls: 'defective', s2: ['مشي', 'mshi'], heya: ['مشات', 'mshat'], homma: ['مشاو', 'mshaw'], pres: ['مشي', 'mshi'], notes: 'Darija goes with msha: fin ghadi? Where are you going?' }),
	D({ slug: 'gara', howa: ['جرى', 'jra'], root: 'ج ر ي', cls: 'defective', s2: ['جري', 'jri'], heya: ['جرات', 'jrat'], homma: ['جراو', 'jraw'], pres: ['جري', 'jri'], notes: 'Defective verb: jrit, I ran; kanjri, I run.' }),
	D({ slug: 'ha-al', howa: ['وقع', 'wqe3'], root: 'و ق ع', cls: 'sound', s2: ['وقع', 'wqe3'], heya: ['وقعات', 'weq3at'], homma: ['وقعو', 'weq3u'], pres: ['وقع', 'wqe3'], before: 'weq3', notes: 'Mostly used for things: ash wqe3? What happened?' }),
	D({
		slug: 'kan-3andu', howa: ['كان عندو', 'kan 3endu'], root: 'ع ن د', cls: 'irregular', s2: ['', ''], heya: ['', ''], homma: ['', ''], pres: ['', ''], notes: '"To have" is 3end plus a pronoun ending: 3endi, I have. The past adds kan, the future ghadi ykun.',
		over: {
			past: have(['كان ', 'kan '], ENDI, ENDI_TR),
			present: have(['', ''], ENDI, ENDI_TR),
			future: have(['غادي يكون ', 'ghadi ykun '], ENDI, ENDI_TR)
		},
		neg: {
			past: have(['ما كانش ', 'ma kansh '], ENDI, ENDI_TR),
			present: have(['ما ', 'ma '], ENDI, ENDI_TR, ['ش', 'sh']),
			future: have(['ما غاديش يكون ', 'ma ghadish ykun '], ENDI, ENDI_TR)
		}
	}),
	D({ slug: 'sa3id', howa: ['عاون', '3awen'], root: 'ع و ن', cls: 'sound', s2: ['عاون', '3awen'], heya: ['عاونات', '3awnat'], homma: ['عاونو', '3awnu'], pres: ['عاون', '3awen'], before: '3awn', notes: 'Darija helps with 3awen: kan3awen, I help.' }),
	D({ slug: 'arab', howa: ['ضرب', 'dreb'], root: 'ض ر ب', cls: 'sound', s2: ['ضرب', 'dreb'], heya: ['ضربات', 'derbat'], homma: ['ضربو', 'derbu'], pres: ['ضرب', 'dreb'], before: 'derb', notes: 'Regular verb: kandreb, I hit.' }),
	D({ slug: 'xaba', howa: ['خبط', 'khbet'], root: 'خ ب ط', cls: 'sound', s2: ['خبط', 'khbet'], heya: ['خبطات', 'khebtat'], homma: ['خبطو', 'khebtu'], pres: ['خبط', 'khbet'], before: 'khebt', notes: 'Regular verb for knocking or bumping into something.' }),
	D({ slug: 'nawa', howa: ['نوى', 'nwa'], root: 'ن و ي', cls: 'defective', s2: ['نوي', 'nwi'], heya: ['نوات', 'nwat'], homma: ['نواو', 'nwaw'], pres: ['نوي', 'nwi'], notes: 'Defective verb: nwit, I intended; kannwi, I intend.' }),
	D({ slug: 'na', howa: ['نقز', 'nqez'], root: 'ن ق ز', cls: 'sound', s2: ['نقز', 'nqez'], heya: ['نقزات', 'neqzat'], homma: ['نقزو', 'neqzu'], pres: ['نقز', 'nqez'], before: 'neqz', notes: 'Darija jumps with nqez: kannqez, I jump.' }),
	D({ slug: 'sab', howa: ['خلى', 'khella'], root: 'خ ل ي', cls: 'defective', s2: ['خلي', 'khelli'], heya: ['خلات', 'khellat'], homma: ['خلاو', 'khellaw'], pres: ['خلي', 'khelli'], notes: 'Defective Form II verb: to leave something or someone, and to let.' }),
	D({ slug: 'kidib', howa: ['كذب', 'kdeb'], root: 'ك ذ ب', cls: 'sound', s2: ['كذب', 'kdeb'], heya: ['كذبات', 'kedbat'], homma: ['كذبو', 'kedbu'], pres: ['كذب', 'kdeb'], before: 'kedb', notes: 'Regular verb: kankdeb, I lie.' }),
	D({ slug: '3a', howa: ['عاش', '3ash'], root: 'ع ي ش', cls: 'hollow', s2: ['عش', '3ish'], heya: ['عاشت', '3asht'], homma: ['عاشو', '3ashu'], pres: ['عيش', '3ish'], notes: 'Hollow verb: 3isht, I lived; kan3ish, I live.' }),
	D({ slug: 'ba-li', howa: ['شاف', 'shaf'], root: 'ش و ف', cls: 'hollow', s2: ['شف', 'shuf'], heya: ['شافت', 'shaft'], homma: ['شافو', 'shafu'], pres: ['شوف', 'shuf'], after: ['فـ', 'f'], notes: 'Hollow verb: shuf f…, look at. Without f it means to see.' }),
	D({ slug: 'xisir', howa: ['خسر', 'khser'], root: 'خ س ر', cls: 'sound', s2: ['خسر', 'khser'], heya: ['خسرات', 'khesrat'], homma: ['خسرو', 'khesru'], pres: ['خسر', 'khser'], before: 'khesr', notes: 'Regular verb: to lose, and also to break down (tomobil khesrat, the car broke down).' }),
	D({ slug: 'a-ad', howa: ['قصد', 'qsed'], root: 'ق ص د', cls: 'sound', s2: ['قصد', 'qsed'], heya: ['قصدات', 'qesdat'], homma: ['قصدو', 'qesdu'], pres: ['قصد', 'qsed'], before: 'qesd', notes: 'Regular verb: ash katqsed? What do you mean?' }),
	D({ slug: 'itharrak', howa: ['تحرك', 't7errek'], root: 'ح ر ك', cls: 'form V', s2: ['تحرك', 't7errek'], heya: ['تحركات', 't7errkat'], homma: ['تحركو', 't7errku'], pres: ['تحرك', 't7errek'], before: 't7errk', notes: 'Form V verb: kant7errek, I move.' }),
	D({ slug: 'harrak', howa: ['حرك', '7errek'], root: 'ح ر ك', cls: 'sound', s2: ['حرك', '7errek'], heya: ['حركات', '7errkat'], homma: ['حركو', '7errku'], pres: ['حرك', '7errek'], before: '7errk', notes: 'Form II verb: kan7errek, I move something.' }),
	D({ slug: 'fatah', howa: ['حل', '7ell'], root: 'ح ل ل', cls: 'doubled', s2: ['حلي', '7elli'], heya: ['حلات', '7ellat'], homma: ['حلو', '7ellu'], pres: ['حل', '7ell'], notes: 'Darija opens with 7ell: 7ell lbab, open the door.' }),
	D({ slug: 'gahhiz', howa: ['وجد', 'wejjed'], root: 'و ج د', cls: 'sound', s2: ['وجد', 'wejjed'], heya: ['وجدات', 'wejjdat'], homma: ['وجدو', 'wejjdu'], pres: ['وجد', 'wejjed'], before: 'wejjd', notes: 'Darija gets things ready with wejjed: kanwejjed, I prepare.' }),
	D({ slug: 'mana3', howa: ['منع', 'mne3'], root: 'م ن ع', cls: 'sound', s2: ['منع', 'mne3'], heya: ['منعات', 'men3at'], homma: ['منعو', 'men3u'], pres: ['منع', 'mne3'], before: 'men3', notes: 'Regular verb: mamnu3, forbidden, comes from it.' }),
	D({ slug: '3aqib', howa: ['عاقب', '3aqeb'], root: 'ع ق ب', cls: 'sound', s2: ['عاقب', '3aqeb'], heya: ['عاقبات', '3aqbat'], homma: ['عاقبو', '3aqbu'], pres: ['عاقب', '3aqeb'], before: '3aqb', notes: 'Form III verb: kan3aqeb, I punish.' }),
	D({ slug: 'warra', howa: ['ورى', 'werra'], root: 'و ر ي', cls: 'defective', s2: ['وري', 'werri'], heya: ['ورات', 'werrat'], homma: ['وراو', 'werraw'], pres: ['وري', 'werri'], notes: 'Defective Form II verb: werrini, show me.' }),
	D({ slug: 'ghiri', howa: ['غرق', 'ghreq'], root: 'غ ر ق', cls: 'sound', s2: ['غرق', 'ghreq'], heya: ['غرقات', 'gherqat'], homma: ['غرقو', 'gherqu'], pres: ['غرق', 'ghreq'], before: 'gherq', notes: 'Regular verb: kanghreq, I sink or drown.' }),
	D({ slug: 'istanna', howa: ['تسنى', 'tsenna'], root: 'أ ن ي', cls: 'defective', s2: ['تسني', 'tsenni'], heya: ['تسنات', 'tsennat'], homma: ['تسناو', 'tsennaw'], pres: ['تسنى', 'tsenna'], notes: 'Defective verb: tsenna! Wait! kantsenna, I wait.' }),
	D({ slug: 'a3ad', howa: ['بقى', 'bqa'], root: 'ب ق ي', cls: 'defective', s2: ['بقي', 'bqi'], heya: ['بقات', 'bqat'], homma: ['بقاو', 'bqaw'], pres: ['بقى', 'bqa'], notes: 'Defective verb: to stay, or to keep doing something.' }),
	D({ slug: 'nigih', howa: ['نجح', 'nje7'], root: 'ن ج ح', cls: 'sound', s2: ['نجح', 'nje7'], heya: ['نجحات', 'nej7at'], homma: ['نجحو', 'nej7u'], pres: ['نجح', 'nje7'], before: 'nej7', notes: 'Regular verb: kannje7, I succeed or pass.' }),
	D({ slug: 'a-xad', howa: ['خدا', 'khda'], root: 'أ خ ذ', cls: 'irregular', s2: ['خدي', 'khdi'], heya: ['خدات', 'khdat'], homma: ['خداو', 'khdaw'], pres: ['اخد', 'akhod'], before: 'akhd', notes: 'Irregular: khda, he took; khdit, I took; kanakhod, I take.' }),
	D({ slug: 'mazza', howa: ['قطع', 'qette3'], root: 'ق ط ع', cls: 'sound', s2: ['قطع', 'qette3'], heya: ['قطعات', 'qett3at'], homma: ['قطعو', 'qett3u'], pres: ['قطع', 'qette3'], before: 'qett3', notes: 'Form II verb: to tear up or cut into pieces.' }),
	D({ slug: 'akar', howa: ['شكر', 'shker'], root: 'ش ك ر', cls: 'sound', s2: ['شكر', 'shker'], heya: ['شكرات', 'shekrat'], homma: ['شكرو', 'shekru'], pres: ['شكر', 'shker'], before: 'shekr', notes: 'Regular verb: kanshker, I thank.' }),
	D({ slug: 'raba', howa: ['ربط', 'rbet'], root: 'ر ب ط', cls: 'sound', s2: ['ربط', 'rbet'], heya: ['ربطات', 'rebtat'], homma: ['ربطو', 'rebtu'], pres: ['ربط', 'rbet'], before: 'rebt', notes: 'Regular verb: kanrbet, I tie.' }),
	D({ slug: 'lamas', howa: ['قاس', 'qas'], root: 'ق ي س', cls: 'hollow', s2: ['قس', 'qis'], heya: ['قاسات', 'qasat'], homma: ['قاسو', 'qasu'], pres: ['قيس', 'qis'], notes: 'Darija touches with qas: ma tqish! Don’t touch!' }),
	D({ slug: 'ista3mil', howa: ['ستعمل', 'sta3mel'], root: 'ع م ل', cls: 'form X', s2: ['ستعمل', 'sta3mel'], heya: ['ستعملات', 'sta3mlat'], homma: ['ستعملو', 'sta3mlu'], pres: ['ستعمل', 'sta3mel'], before: 'sta3ml', notes: 'Form X verb: kansta3mel, I use.' })
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
