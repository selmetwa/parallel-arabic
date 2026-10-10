/**
 * Modern Standard Arabic (Fusha) conjugations, with full tashkeel: without
 * it, فتحت would be "I / you (m) / you (f) / she opened" all at once.
 *
 * Past: the stem before a consonant ending takes -tu, -ta, -ti, -na, -tum.
 * Present: a/ta/ya/na (or u/tu/yu/nu for Forms II–IV) + stem + mood ending.
 * Future: sa- + present. Negation: ma + past, la + present, lan + subjunctive
 * (ma + past is used rather than lam + jussive, so every verb follows one
 * pattern a learner can see).
 */
import {
	mapPersons,
	table,
	fileFor,
	withOverrides,
	type AT,
	type Conjugations,
	type Person,
	type VerbMeta
} from './engine';
import { ENGLISH } from './english';

type Ending = 'sound' | 'def-i' | 'def-a' | 'def-u';

interface Spec {
	slug: string;
	howa: AT;
	root: string;
	cls: string;
	/** Past stem before -tu (فَتَحْ, كُنْ, مَشَيْ). */
	s2: AT;
	heya: AT;
	homma: AT;
	/** Prefix vowel: a (yaf3alu) or u (yufa33ilu, Forms II–IV). */
	pv: 'a' | 'u';
	/** Present stem between prefix and ending (فْتَح; for weak verbs, without the final vowel: مْش). */
	pres: AT;
	ending: Ending;
	after?: AT;
	notes: string;
	/** Irregular present (indicative) and subjunctive forms. */
	ind?: Partial<Record<Person, AT>>;
	subj?: Partial<Record<Person, AT>>;
	pastOver?: Partial<Record<Person, AT>>;
	/** Write every form out (verbs like "to have"). */
	all?: Partial<Record<'past' | 'present' | 'future' | 'pastNeg' | 'presentNeg' | 'futureNeg', Record<Person, AT>>>;
}

const PREFIX: Record<'a' | 'u', Record<'I' | 'you' | 'he' | 'we', AT>> = {
	a: { I: ['أَ', 'a'], you: ['تَ', 'ta'], he: ['يَ', 'ya'], we: ['نَ', 'na'] },
	u: { I: ['أُ', 'u'], you: ['تُ', 'tu'], he: ['يُ', 'yu'], we: ['نُ', 'nu'] }
};

/** [singular, you (f), plural] endings for the indicative and subjunctive. */
const ENDINGS: Record<Ending, { ind: [AT, AT, AT]; subj: [AT, AT, AT] }> = {
	sound: {
		ind: [['ُ', 'u'], ['ِينَ', 'ina'], ['ُونَ', 'una']],
		subj: [['َ', 'a'], ['ِي', 'i'], ['ُوا', 'u']]
	},
	'def-i': {
		ind: [['ِي', 'i'], ['ِينَ', 'ina'], ['ُونَ', 'una']],
		subj: [['ِيَ', 'iya'], ['ِي', 'i'], ['ُوا', 'u']]
	},
	'def-a': {
		ind: [['َى', 'a'], ['َيْنَ', 'ayna'], ['َوْنَ', 'awna']],
		subj: [['َى', 'a'], ['َيْ', 'ay'], ['َوْا', 'aw']]
	},
	'def-u': {
		ind: [['ُو', 'u'], ['ِينَ', 'ina'], ['ُونَ', 'una']],
		subj: [['ُوَ', 'uwa'], ['ِي', 'i'], ['ُوا', 'u']]
	}
};

function moodForms(spec: Spec, mood: 'ind' | 'subj'): Record<Person, AT> {
	const pre = PREFIX[spec.pv];
	const [sg, f, pl] = ENDINGS[spec.ending][mood];
	const [sa, st] = spec.pres;
	const make = (p: AT, e: AT): AT => [`${p[0]}${sa}${e[0]}`, `${p[1]}${st}${e[1]}`];
	return withOverrides(
		{
			ana: make(pre.I, sg),
			enta: make(pre.you, sg),
			enti: make(pre.you, f),
			howa: make(pre.he, sg),
			heya: make(pre.you, sg),
			ehna: make(pre.we, sg),
			entu: make(pre.you, pl),
			homma: make(pre.he, pl)
		},
		mood === 'ind' ? spec.ind : spec.subj
	);
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
	const pre = (ar: string, tr: string) => (f: AT): AT => [`${ar}${f[0]}`, `${tr}${f[1]}`];

	const [s2a, s2t] = spec.s2;
	// A stem ending in نْ merges with -na: كُنْ + نَا = كُنَّا.
	const we: AT = s2a.endsWith('نْ') ? [`${s2a.slice(0, -1)}َّا`, `${s2t}na`] : [`${s2a}نَا`, `${s2t}na`];
	const past = withOverrides(
		{
			ana: [`${s2a}تُ`, `${s2t}tu`],
			enta: [`${s2a}تَ`, `${s2t}ta`],
			enti: [`${s2a}تِ`, `${s2t}ti`],
			howa: spec.howa,
			heya: spec.heya,
			ehna: we,
			entu: [`${s2a}تُمْ`, `${s2t}tum`],
			homma: spec.homma
		},
		spec.pastOver
	);
	const ind = moodForms(spec, 'ind');
	const subj = moodForms(spec, 'subj');

	const all = spec.all ?? {};
	const pastAff = all.past ?? past;
	const presentAff = all.present ?? ind;
	// سَأَفْتَحُ is sa-2afta7u: the hamza shows once sa- is in front.
	const sa = (f: AT): AT => [`سَ${f[0]}`, `sa${/^[aiu]/.test(f[1]) ? '2' : ''}${f[1]}`];
	const futureAff = all.future ?? mapPersons((p) => sa(ind[p]));
	const pastNeg = all.pastNeg ?? mapPersons((p) => pre('مَا ', 'ma ')(past[p]));
	const presentNeg = all.presentNeg ?? mapPersons((p) => pre('لَا ', 'la ')(ind[p]));
	const futureNeg = all.futureNeg ?? mapPersons((p) => pre('لَنْ ', 'lan ')(subj[p]));

	const t = (name: keyof Conjugations, aff: Record<Person, AT>, neg: Record<Person, AT>) =>
		table(
			meta,
			name,
			mapPersons((p) => after(aff[p])),
			mapPersons((p) => after(neg[p]))
		);
	return {
		past: t('past', pastAff, pastNeg),
		present: t('present', presentAff, presentNeg),
		future: t('future', futureAff, futureNeg)
	};
}

const F = (s: Spec) => s;

const LADAY = ['لَدَيَّ', 'لَدَيْكَ', 'لَدَيْكِ', 'لَدَيْهِ', 'لَدَيْهَا', 'لَدَيْنَا', 'لَدَيْكُمْ', 'لَدَيْهِمْ'];
const LADAY_TR = ['ladayya', 'ladayka', 'ladayki', 'ladayhi', 'ladayha', 'ladayna', 'ladaykum', 'ladayhim'];
const have = (prefix: AT): Record<Person, AT> =>
	Object.fromEntries(
		(['ana', 'enta', 'enti', 'howa', 'heya', 'ehna', 'entu', 'homma'] as const).map((p, i) => [
			p,
			[`${prefix[0]}${LADAY[i]}`, `${prefix[1]}${LADAY_TR[i]}`]
		])
	) as Record<Person, AT>;

export const SPECS: Spec[] = [
	F({ slug: 'wafi', howa: ['قَبِلَ', 'qabila'], root: 'ق ب ل', cls: 'sound', s2: ['قَبِلْ', 'qabil'], heya: ['قَبِلَتْ', 'qabilat'], homma: ['قَبِلُوا', 'qabilu'], pv: 'a', pres: ['قْبَل', 'qbal'], ending: 'sound', notes: 'Form I verb with i in the past and a in the present: qabila, yaqbalu.' }),
	F({ slug: 'rah-ma3a', howa: ['رَافَقَ', 'rafaqa'], root: 'ر ف ق', cls: 'form III', s2: ['رَافَقْ', 'rafaq'], heya: ['رَافَقَتْ', 'rafaqat'], homma: ['رَافَقُوا', 'rafaqu'], pv: 'u', pres: ['رَافِق', 'rafiq'], ending: 'sound', notes: 'Form III verb: the present takes u- prefixes, yurafiqu.' }),
	F({ slug: 'mi-i-ma3a', howa: ['مَشَى', 'masha'], root: 'م ش ي', cls: 'defective', s2: ['مَشَيْ', 'mashay'], heya: ['مَشَتْ', 'mashat'], homma: ['مَشَوْا', 'mashaw'], pv: 'a', pres: ['مْش', 'msh'], ending: 'def-i', after: ['مَعَ', 'ma3a'], notes: 'Defective verb ending in ي: mashaytu, I walked; yamshi, he walks.' }),
	F({ slug: 'abba', howa: ['ضَبَطَ', 'dabata'], root: 'ض ب ط', cls: 'sound', s2: ['ضَبَطْ', 'dabat'], heya: ['ضَبَطَتْ', 'dabatat'], homma: ['ضَبَطُوا', 'dabatu'], pv: 'a', pres: ['ضْبِط', 'dbit'], ending: 'sound', notes: 'Form I verb: dabata, yadbitu, to set or adjust.' }),
	F({ slug: 'i3taraf', howa: ['اعْتَرَفَ', 'i3tarafa'], root: 'ع ر ف', cls: 'form VIII', s2: ['اعْتَرَفْ', 'i3taraf'], heya: ['اعْتَرَفَتْ', 'i3tarafat'], homma: ['اعْتَرَفُوا', 'i3tarafu'], pv: 'a', pres: ['عْتَرِف', '3tarif'], ending: 'sound', notes: 'Form VIII verb: i3tarafa, ya3tarifu.' }),
	F({ slug: 'assar-3ala', howa: ['أَثَّرَ', 'aththara'], root: 'أ ث ر', cls: 'form II', s2: ['أَثَّرْ', 'aththar'], heya: ['أَثَّرَتْ', 'aththarat'], homma: ['أَثَّرُوا', 'aththaru'], pv: 'u', pres: ['ؤَثِّر', '2aththir'], ending: 'sound', after: ['عَلَى', '3ala'], notes: 'Form II verb with an initial hamza, which sits on و in the present: yu2aththiru.' }),
	F({ slug: 'samah', howa: ['سَمَحَ', 'sama7a'], root: 'س م ح', cls: 'sound', s2: ['سَمَحْ', 'sama7'], heya: ['سَمَحَتْ', 'sama7at'], homma: ['سَمَحُوا', 'sama7u'], pv: 'a', pres: ['سْمَح', 'sma7'], ending: 'sound', notes: 'Form I verb: sama7a, yasma7u.' }),
	F({ slug: 'i3tazar-3an', howa: ['اعْتَذَرَ', 'i3tadhara'], root: 'ع ذ ر', cls: 'form VIII', s2: ['اعْتَذَرْ', 'i3tadhar'], heya: ['اعْتَذَرَتْ', 'i3tadharat'], homma: ['اعْتَذَرُوا', 'i3tadharu'], pv: 'a', pres: ['عْتَذِر', '3tadhir'], ending: 'sound', after: ['عَنْ', '3an'], notes: 'Form VIII verb: i3tadhara 3an, to apologise for.' }),
	F({ slug: 'ahar', howa: ['ظَهَرَ', 'zahara'], root: 'ظ ه ر', cls: 'sound', s2: ['ظَهَرْ', 'zahar'], heya: ['ظَهَرَتْ', 'zaharat'], homma: ['ظَهَرُوا', 'zaharu'], pv: 'a', pres: ['ظْهَر', 'zhar'], ending: 'sound', notes: 'Form I verb: zahara, yazharu.' }),
	F({ slug: 'qaddar', howa: ['قَدَّرَ', 'qaddara'], root: 'ق د ر', cls: 'form II', s2: ['قَدَّرْ', 'qaddar'], heya: ['قَدَّرَتْ', 'qaddarat'], homma: ['قَدَّرُوا', 'qaddaru'], pv: 'u', pres: ['قَدِّر', 'qaddir'], ending: 'sound', notes: 'Form II verb: yuqaddiru, to appreciate or estimate.' }),
	F({ slug: 'ri-i-bi', howa: ['وَافَقَ', 'wafaqa'], root: 'و ف ق', cls: 'form III', s2: ['وَافَقْ', 'wafaq'], heya: ['وَافَقَتْ', 'wafaqat'], homma: ['وَافَقُوا', 'wafaqu'], pv: 'u', pres: ['وَافِق', 'wafiq'], ending: 'sound', after: ['عَلَى', '3ala'], notes: 'Form III verb: wafaqa 3ala, to approve of or agree to.' }),
	F({ slug: 'sa-al', howa: ['سَأَلَ', 'sa2ala'], root: 'س أ ل', cls: 'hamzated', s2: ['سَأَلْ', 'sa2al'], heya: ['سَأَلَتْ', 'sa2alat'], homma: ['سَأَلُوا', 'sa2alu'], pv: 'a', pres: ['سْأَل', 's2al'], ending: 'sound', notes: 'Hamzated verb: sa2ala, yas2alu.' }),
	F({ slug: 'ha-ar', howa: ['حَضَرَ', '7adara'], root: 'ح ض ر', cls: 'sound', s2: ['حَضَرْ', '7adar'], heya: ['حَضَرَتْ', '7adarat'], homma: ['حَضَرُوا', '7adaru'], pv: 'a', pres: ['حْضُر', '7dur'], ending: 'sound', notes: 'Form I verb with u in the present: ya7duru.' }),
	F({ slug: 'kan', howa: ['كَانَ', 'kana'], root: 'ك و ن', cls: 'hollow', s2: ['كُنْ', 'kun'], heya: ['كَانَتْ', 'kanat'], homma: ['كَانُوا', 'kanu'], pv: 'a', pres: ['كُون', 'kun'], ending: 'sound', notes: 'Hollow verb: kuntu, I was; yakunu, he is (or will be).' }),
	F({ slug: 'ihtaram', howa: ['احْتَرَمَ', 'i7tarama'], root: 'ح ر م', cls: 'form VIII', s2: ['احْتَرَمْ', 'i7taram'], heya: ['احْتَرَمَتْ', 'i7taramat'], homma: ['احْتَرَمُوا', 'i7taramu'], pv: 'a', pres: ['حْتَرِم', '7tarim'], ending: 'sound', notes: 'Form VIII verb: ya7tarimu, he respects.' }),
	F({ slug: 'rahin', howa: ['رَاهَنَ', 'rahana'], root: 'ر ه ن', cls: 'form III', s2: ['رَاهَنْ', 'rahan'], heya: ['رَاهَنَتْ', 'rahanat'], homma: ['رَاهَنُوا', 'rahanu'], pv: 'u', pres: ['رَاهِن', 'rahin'], ending: 'sound', notes: 'Form III verb: yurahinu, he bets.' }),
	F({ slug: 'lam-3ala', howa: ['لَامَ', 'lama'], root: 'ل و م', cls: 'hollow', s2: ['لُمْ', 'lum'], heya: ['لَامَتْ', 'lamat'], homma: ['لَامُوا', 'lamu'], pv: 'a', pres: ['لُوم', 'lum'], ending: 'sound', after: ['عَلَى', '3ala'], notes: 'Hollow verb: lumtu, I blamed; yalumu, he blames.' }),
	F({ slug: 'kasar', howa: ['كَسَرَ', 'kasara'], root: 'ك س ر', cls: 'sound', s2: ['كَسَرْ', 'kasar'], heya: ['كَسَرَتْ', 'kasarat'], homma: ['كَسَرُوا', 'kasaru'], pv: 'a', pres: ['كْسِر', 'ksir'], ending: 'sound', notes: 'Form I verb: kasara, yaksiru.' }),
	F({ slug: 'hara', howa: ['حَرَقَ', '7araqa'], root: 'ح ر ق', cls: 'sound', s2: ['حَرَقْ', '7araq'], heya: ['حَرَقَتْ', '7araqat'], homma: ['حَرَقُوا', '7araqu'], pv: 'a', pres: ['حْرِق', '7riq'], ending: 'sound', notes: 'Form I verb: 7araqa, ya7riqu.' }),
	F({ slug: 'ihtamm', howa: ['اهْتَمَّ', 'ihtamma'], root: 'ه م م', cls: 'doubled', s2: ['اهْتَمَمْ', 'ihtamam'], heya: ['اهْتَمَّتْ', 'ihtammat'], homma: ['اهْتَمُّوا', 'ihtammu'], pv: 'a', pres: ['هْتَمّ', 'htamm'], ending: 'sound', after: ['بِـ', 'bi'], notes: 'Doubled verb: the doubling splits before -tu (ihtamamtu) and stays elsewhere (yahtammu).' }),
	F({ slug: 'ghayyar', howa: ['غَيَّرَ', 'ghayyara'], root: 'غ ي ر', cls: 'form II', s2: ['غَيَّرْ', 'ghayyar'], heya: ['غَيَّرَتْ', 'ghayyarat'], homma: ['غَيَّرُوا', 'ghayyaru'], pv: 'u', pres: ['غَيِّر', 'ghayyir'], ending: 'sound', notes: 'Form II verb: yughayyiru.' }),
	F({ slug: 'ixtar', howa: ['اخْتَارَ', 'ikhtara'], root: 'خ ي ر', cls: 'hollow', s2: ['اخْتَرْ', 'ikhtar'], heya: ['اخْتَارَتْ', 'ikhtarat'], homma: ['اخْتَارُوا', 'ikhtaru'], pv: 'a', pres: ['خْتَار', 'khtar'], ending: 'sound', notes: 'Hollow Form VIII verb: the long a shortens before -tu (ikhtartu).' }),
	F({
		slug: 'gih', howa: ['جَاءَ', 'ja2a'], root: 'ج ي ء', cls: 'hollow, hamzated', s2: ['جِئْ', 'ji2'], heya: ['جَاءَتْ', 'ja2at'], homma: ['جَاؤُوا', 'ja2u'], pv: 'a', pres: ['جِيء', 'ji2'], ending: 'sound', notes: 'Hollow verb ending in hamza: ji2tu, I came; yaji2u, he comes. The hamza changes its seat with the ending.',
		ind: { enti: ['تَجِيئِينَ', 'taji2ina'], entu: ['تَجِيئُونَ', 'taji2una'], homma: ['يَجِيئُونَ', 'yaji2una'] },
		subj: { enti: ['تَجِيئِي', 'taji2i'], entu: ['تَجِيئُوا', 'taji2u'], homma: ['يَجِيئُوا', 'yaji2u'] }
	}),
	F({ slug: 'qarin', howa: ['قَارَنَ', 'qarana'], root: 'ق ر ن', cls: 'form III', s2: ['قَارَنْ', 'qaran'], heya: ['قَارَنَتْ', 'qaranat'], homma: ['قَارَنُوا', 'qaranu'], pv: 'u', pres: ['قَارِن', 'qarin'], ending: 'sound', notes: 'Form III verb: yuqarinu.' }),
	F({ slug: 'itta-al-bi', howa: ['اتَّصَلَ', 'ittasala'], root: 'و ص ل', cls: 'form VIII', s2: ['اتَّصَلْ', 'ittasal'], heya: ['اتَّصَلَتْ', 'ittasalat'], homma: ['اتَّصَلُوا', 'ittasalu'], pv: 'a', pres: ['تَّصِل', 'ttasil'], ending: 'sound', after: ['بِـ', 'bi'], notes: 'Form VIII verb from و ص ل, where the و merges into the doubled ت.' }),
	F({ slug: 'kammil', howa: ['اسْتَمَرَّ', 'istamarra'], root: 'م ر ر', cls: 'doubled', s2: ['اسْتَمْرَرْ', 'istamrar'], heya: ['اسْتَمَرَّتْ', 'istamarrat'], homma: ['اسْتَمَرُّوا', 'istamarru'], pv: 'a', pres: ['سْتَمِرّ', 'stamirr'], ending: 'sound', notes: 'Doubled Form X verb: istamrartu, I continued; yastamirru, he continues.' }),
	F({ slug: 'rafa', howa: ['رَفَضَ', 'rafada'], root: 'ر ف ض', cls: 'sound', s2: ['رَفَضْ', 'rafad'], heya: ['رَفَضَتْ', 'rafadat'], homma: ['رَفَضُوا', 'rafadu'], pv: 'a', pres: ['رْفُض', 'rfud'], ending: 'sound', notes: 'Form I verb: rafada, yarfudu.' }),
	F({ slug: 'alab', howa: ['طَلَبَ', 'talaba'], root: 'ط ل ب', cls: 'sound', s2: ['طَلَبْ', 'talab'], heya: ['طَلَبَتْ', 'talabat'], homma: ['طَلَبُوا', 'talabu'], pv: 'a', pres: ['طْلُب', 'tlub'], ending: 'sound', notes: 'Form I verb: talaba, yatlubu.' }),
	F({ slug: 'nakar', howa: ['أَنْكَرَ', 'ankara'], root: 'ن ك ر', cls: 'form IV', s2: ['أَنْكَرْ', 'ankar'], heya: ['أَنْكَرَتْ', 'ankarat'], homma: ['أَنْكَرُوا', 'ankaru'], pv: 'u', pres: ['نْكِر', 'nkir'], ending: 'sound', notes: 'Form IV verb: the a- of the past drops in the present, yunkiru.' }),
	F({ slug: 'wa-af', howa: ['وَصَفَ', 'wasafa'], root: 'و ص ف', cls: 'assimilated', s2: ['وَصَفْ', 'wasaf'], heya: ['وَصَفَتْ', 'wasafat'], homma: ['وَصَفُوا', 'wasafu'], pv: 'a', pres: ['صِف', 'sif'], ending: 'sound', notes: 'Assimilated verb: the first و drops in the present, yasifu.' }),
	F({ slug: 'ammim', howa: ['صَمَّمَ', 'sammama'], root: 'ص م م', cls: 'form II', s2: ['صَمَّمْ', 'sammam'], heya: ['صَمَّمَتْ', 'sammamat'], homma: ['صَمَّمُوا', 'sammamu'], pv: 'u', pres: ['صَمِّم', 'sammim'], ending: 'sound', notes: 'Form II verb: yusammimu.' }),
	F({ slug: 'ixtalaf', howa: ['اخْتَلَفَ', 'ikhtalafa'], root: 'خ ل ف', cls: 'form VIII', s2: ['اخْتَلَفْ', 'ikhtalaf'], heya: ['اخْتَلَفَتْ', 'ikhtalafat'], homma: ['اخْتَلَفُوا', 'ikhtalafu'], pv: 'a', pres: ['خْتَلِف', 'khtalif'], ending: 'sound', notes: 'Form VIII verb: yakhtalifu.' }),
	F({ slug: 'ixtafa', howa: ['اخْتَفَى', 'ikhtafa'], root: 'خ ف ي', cls: 'defective', s2: ['اخْتَفَيْ', 'ikhtafay'], heya: ['اخْتَفَتْ', 'ikhtafat'], homma: ['اخْتَفَوْا', 'ikhtafaw'], pv: 'a', pres: ['خْتَف', 'khtaf'], ending: 'def-i', notes: 'Defective Form VIII verb: ikhtafaytu, I disappeared; yakhtafi, he disappears.' }),
	F({ slug: 'wa-a3', howa: ['أَسْقَطَ', 'asqata'], root: 'س ق ط', cls: 'form IV', s2: ['أَسْقَطْ', 'asqat'], heya: ['أَسْقَطَتْ', 'asqatat'], homma: ['أَسْقَطُوا', 'asqatu'], pv: 'u', pres: ['سْقِط', 'sqit'], ending: 'sound', notes: 'Form IV of saqata, to fall: to drop something.' }),
	F({ slug: '3abbar-3an', howa: ['عَبَّرَ', '3abbara'], root: 'ع ب ر', cls: 'form II', s2: ['عَبَّرْ', '3abbar'], heya: ['عَبَّرَتْ', '3abbarat'], homma: ['عَبَّرُوا', '3abbaru'], pv: 'u', pres: ['عَبِّر', '3abbir'], ending: 'sound', after: ['عَنْ', '3an'], notes: 'Form II verb: yu3abbiru 3an, he expresses.' }),
	F({ slug: 'wi-i3', howa: ['سَقَطَ', 'saqata'], root: 'س ق ط', cls: 'sound', s2: ['سَقَطْ', 'saqat'], heya: ['سَقَطَتْ', 'saqatat'], homma: ['سَقَطُوا', 'saqatu'], pv: 'a', pres: ['سْقُط', 'squt'], ending: 'sound', notes: 'Form I verb: saqata, yasqutu.' }),
	F({ slug: 'la-a-la-a', howa: ['وَجَدَ', 'wajada'], root: 'و ج د', cls: 'assimilated', s2: ['وَجَدْ', 'wajad'], heya: ['وَجَدَتْ', 'wajadat'], homma: ['وَجَدُوا', 'wajadu'], pv: 'a', pres: ['جِد', 'jid'], ending: 'sound', notes: 'Assimilated verb: the first و drops in the present, yajidu.' }),
	F({ slug: 'allah', howa: ['أَصْلَحَ', 'asla7a'], root: 'ص ل ح', cls: 'form IV', s2: ['أَصْلَحْ', 'asla7'], heya: ['أَصْلَحَتْ', 'asla7at'], homma: ['أَصْلَحُوا', 'asla7u'], pv: 'u', pres: ['صْلِح', 'sli7'], ending: 'sound', notes: 'Form IV verb: yusli7u, he fixes.' }),
	F({ slug: 'afa', howa: ['طَفَا', 'tafa'], root: 'ط ف و', cls: 'defective', s2: ['طَفَوْ', 'tafaw'], heya: ['طَفَتْ', 'tafat'], homma: ['طَفَوْا', 'tafaw'], pv: 'a', pres: ['طْف', 'tf'], ending: 'def-u', notes: 'Defective verb ending in و: yatfu, it floats.' }),
	F({ slug: 'idda', howa: ['أَعْطَى', 'a3ta'], root: 'ع ط و', cls: 'defective', s2: ['أَعْطَيْ', 'a3tay'], heya: ['أَعْطَتْ', 'a3tat'], homma: ['أَعْطَوْا', 'a3taw'], pv: 'u', pres: ['عْط', '3t'], ending: 'def-i', notes: 'Defective Form IV verb: a3taytu, I gave; yu3ti, he gives.' }),
	F({ slug: 'rah', howa: ['ذَهَبَ', 'dhahaba'], root: 'ذ ه ب', cls: 'sound', s2: ['ذَهَبْ', 'dhahab'], heya: ['ذَهَبَتْ', 'dhahabat'], homma: ['ذَهَبُوا', 'dhahabu'], pv: 'a', pres: ['ذْهَب', 'dhhab'], ending: 'sound', notes: 'Form I verb: dhahaba, yadhhabu.' }),
	F({ slug: 'gara', howa: ['جَرَى', 'jara'], root: 'ج ر ي', cls: 'defective', s2: ['جَرَيْ', 'jaray'], heya: ['جَرَتْ', 'jarat'], homma: ['جَرَوْا', 'jaraw'], pv: 'a', pres: ['جْر', 'jr'], ending: 'def-i', notes: 'Defective verb: jaraytu, I ran; yajri, he runs.' }),
	F({ slug: 'ha-al', howa: ['حَدَثَ', '7adatha'], root: 'ح د ث', cls: 'sound', s2: ['حَدَثْ', '7adath'], heya: ['حَدَثَتْ', '7adathat'], homma: ['حَدَثُوا', '7adathu'], pv: 'a', pres: ['حْدُث', '7duth'], ending: 'sound', notes: 'Mostly used for things: madha 7adatha? What happened?' }),
	F({
		slug: 'kan-3andu', howa: ['كَانَ لَدَيْهِ', 'kana ladayhi'], root: 'ل د ي', cls: 'irregular', s2: ['', ''], heya: ['', ''], homma: ['', ''], pv: 'a', pres: ['', ''], ending: 'sound', notes: '"To have" is lada (or 3inda) plus a pronoun ending: ladayya, I have. The past adds kana, the future sayakunu.',
		all: {
			past: have(['كَانَ ', 'kana ']),
			present: have(['', '']),
			future: have(['سَيَكُونُ ', 'sayakunu ']),
			pastNeg: have(['لَمْ يَكُنْ ', 'lam yakun ']),
			presentNeg: have(['لَيْسَ ', 'laysa ']),
			futureNeg: have(['لَنْ يَكُونَ ', 'lan yakuna '])
		}
	}),
	F({ slug: 'sa3id', howa: ['سَاعَدَ', 'sa3ada'], root: 'س ع د', cls: 'form III', s2: ['سَاعَدْ', 'sa3ad'], heya: ['سَاعَدَتْ', 'sa3adat'], homma: ['سَاعَدُوا', 'sa3adu'], pv: 'u', pres: ['سَاعِد', 'sa3id'], ending: 'sound', notes: 'Form III verb: yusa3idu, he helps.' }),
	F({ slug: 'arab', howa: ['ضَرَبَ', 'daraba'], root: 'ض ر ب', cls: 'sound', s2: ['ضَرَبْ', 'darab'], heya: ['ضَرَبَتْ', 'darabat'], homma: ['ضَرَبُوا', 'darabu'], pv: 'a', pres: ['ضْرِب', 'drib'], ending: 'sound', notes: 'Form I verb: daraba, yadribu.' }),
	F({ slug: 'xaba', howa: ['اصْطَدَمَ', 'istadama'], root: 'ص د م', cls: 'form VIII', s2: ['اصْطَدَمْ', 'istadam'], heya: ['اصْطَدَمَتْ', 'istadamat'], homma: ['اصْطَدَمُوا', 'istadamu'], pv: 'a', pres: ['صْطَدِم', 'stadim'], ending: 'sound', after: ['بِـ', 'bi'], notes: 'Form VIII verb where the ت becomes ط after ص: istadama bi, to bump into.' }),
	F({ slug: 'nawa', howa: ['نَوَى', 'nawa'], root: 'ن و ي', cls: 'defective', s2: ['نَوَيْ', 'naway'], heya: ['نَوَتْ', 'nawat'], homma: ['نَوَوْا', 'nawaw'], pv: 'a', pres: ['نْو', 'nw'], ending: 'def-i', notes: 'Defective verb: nawaytu, I intended; yanwi, he intends.' }),
	F({ slug: 'na', howa: ['قَفَزَ', 'qafaza'], root: 'ق ف ز', cls: 'sound', s2: ['قَفَزْ', 'qafaz'], heya: ['قَفَزَتْ', 'qafazat'], homma: ['قَفَزُوا', 'qafazu'], pv: 'a', pres: ['قْفِز', 'qfiz'], ending: 'sound', notes: 'Form I verb: qafaza, yaqfizu.' }),
	F({ slug: 'sab', howa: ['تَرَكَ', 'taraka'], root: 'ت ر ك', cls: 'sound', s2: ['تَرَكْ', 'tarak'], heya: ['تَرَكَتْ', 'tarakat'], homma: ['تَرَكُوا', 'taraku'], pv: 'a', pres: ['تْرُك', 'truk'], ending: 'sound', notes: 'Form I verb: taraka, yatruku.' }),
	F({ slug: 'kidib', howa: ['كَذَبَ', 'kadhaba'], root: 'ك ذ ب', cls: 'sound', s2: ['كَذَبْ', 'kadhab'], heya: ['كَذَبَتْ', 'kadhabat'], homma: ['كَذَبُوا', 'kadhabu'], pv: 'a', pres: ['كْذِب', 'kdhib'], ending: 'sound', notes: 'Form I verb: kadhaba, yakdhibu.' }),
	F({ slug: '3a', howa: ['عَاشَ', '3asha'], root: 'ع ي ش', cls: 'hollow', s2: ['عِشْ', '3ish'], heya: ['عَاشَتْ', '3ashat'], homma: ['عَاشُوا', '3ashu'], pv: 'a', pres: ['عِيش', '3ish'], ending: 'sound', notes: 'Hollow verb with a middle ي: 3ishtu, I lived; ya3ishu, he lives.' }),
	F({ slug: 'ba-li', howa: ['نَظَرَ', 'nazara'], root: 'ن ظ ر', cls: 'sound', s2: ['نَظَرْ', 'nazar'], heya: ['نَظَرَتْ', 'nazarat'], homma: ['نَظَرُوا', 'nazaru'], pv: 'a', pres: ['نْظُر', 'nzur'], ending: 'sound', after: ['إِلَى', 'ila'], notes: 'Form I verb: nazara ila, to look at.' }),
	F({ slug: 'xisir', howa: ['خَسِرَ', 'khasira'], root: 'خ س ر', cls: 'sound', s2: ['خَسِرْ', 'khasir'], heya: ['خَسِرَتْ', 'khasirat'], homma: ['خَسِرُوا', 'khasiru'], pv: 'a', pres: ['خْسَر', 'khsar'], ending: 'sound', notes: 'Form I verb with i in the past: khasira, yakhsaru.' }),
	F({ slug: 'a-ad', howa: ['قَصَدَ', 'qasada'], root: 'ق ص د', cls: 'sound', s2: ['قَصَدْ', 'qasad'], heya: ['قَصَدَتْ', 'qasadat'], homma: ['قَصَدُوا', 'qasadu'], pv: 'a', pres: ['قْصِد', 'qsid'], ending: 'sound', notes: 'Form I verb: qasada, yaqsidu, to mean or intend.' }),
	F({ slug: 'itharrak', howa: ['تَحَرَّكَ', 'ta7arraka'], root: 'ح ر ك', cls: 'form V', s2: ['تَحَرَّكْ', 'ta7arrak'], heya: ['تَحَرَّكَتْ', 'ta7arrakat'], homma: ['تَحَرَّكُوا', 'ta7arraku'], pv: 'a', pres: ['تَحَرَّك', 'ta7arrak'], ending: 'sound', notes: 'Form V verb: yata7arraku, he moves.' }),
	F({ slug: 'harrak', howa: ['حَرَّكَ', '7arraka'], root: 'ح ر ك', cls: 'form II', s2: ['حَرَّكْ', '7arrak'], heya: ['حَرَّكَتْ', '7arrakat'], homma: ['حَرَّكُوا', '7arraku'], pv: 'u', pres: ['حَرِّك', '7arrik'], ending: 'sound', notes: 'Form II verb: yu7arriku, he moves something.' }),
	F({ slug: 'fatah', howa: ['فَتَحَ', 'fata7a'], root: 'ف ت ح', cls: 'sound', s2: ['فَتَحْ', 'fata7'], heya: ['فَتَحَتْ', 'fata7at'], homma: ['فَتَحُوا', 'fata7u'], pv: 'a', pres: ['فْتَح', 'fta7'], ending: 'sound', notes: 'Form I verb: fata7a, yafta7u.' }),
	F({ slug: 'gahhiz', howa: ['جَهَّزَ', 'jahhaza'], root: 'ج ه ز', cls: 'form II', s2: ['جَهَّزْ', 'jahhaz'], heya: ['جَهَّزَتْ', 'jahhazat'], homma: ['جَهَّزُوا', 'jahhazu'], pv: 'u', pres: ['جَهِّز', 'jahhiz'], ending: 'sound', notes: 'Form II verb: yujahhizu, he prepares.' }),
	F({ slug: 'mana3', howa: ['مَنَعَ', 'mana3a'], root: 'م ن ع', cls: 'sound', s2: ['مَنَعْ', 'mana3'], heya: ['مَنَعَتْ', 'mana3at'], homma: ['مَنَعُوا', 'mana3u'], pv: 'a', pres: ['مْنَع', 'mna3'], ending: 'sound', notes: 'Form I verb: mana3a, yamna3u.' }),
	F({ slug: '3aqib', howa: ['عَاقَبَ', '3aqaba'], root: 'ع ق ب', cls: 'form III', s2: ['عَاقَبْ', '3aqab'], heya: ['عَاقَبَتْ', '3aqabat'], homma: ['عَاقَبُوا', '3aqabu'], pv: 'u', pres: ['عَاقِب', '3aqib'], ending: 'sound', notes: 'Form III verb: yu3aqibu, he punishes.' }),
	F({ slug: 'warra', howa: ['عَرَضَ', '3arada'], root: 'ع ر ض', cls: 'sound', s2: ['عَرَضْ', '3arad'], heya: ['عَرَضَتْ', '3aradat'], homma: ['عَرَضُوا', '3aradu'], pv: 'a', pres: ['عْرِض', '3rid'], ending: 'sound', notes: 'Form I verb: 3arada, ya3ridu, to show or present.' }),
	F({ slug: 'ghiri', howa: ['غَرِقَ', 'ghariqa'], root: 'غ ر ق', cls: 'sound', s2: ['غَرِقْ', 'ghariq'], heya: ['غَرِقَتْ', 'ghariqat'], homma: ['غَرِقُوا', 'ghariqu'], pv: 'a', pres: ['غْرَق', 'ghraq'], ending: 'sound', notes: 'Form I verb with i in the past: ghariqa, yaghraqu.' }),
	F({ slug: 'istanna', howa: ['انْتَظَرَ', 'intazara'], root: 'ن ظ ر', cls: 'form VIII', s2: ['انْتَظَرْ', 'intazar'], heya: ['انْتَظَرَتْ', 'intazarat'], homma: ['انْتَظَرُوا', 'intazaru'], pv: 'a', pres: ['نْتَظِر', 'ntazir'], ending: 'sound', notes: 'Form VIII verb: yantaziru, he waits.' }),
	F({ slug: 'a3ad', howa: ['بَقِيَ', 'baqiya'], root: 'ب ق ي', cls: 'defective', s2: ['بَقِي', 'baqi'], heya: ['بَقِيَتْ', 'baqiyat'], homma: ['بَقُوا', 'baqu'], pv: 'a', pres: ['بْق', 'bq'], ending: 'def-a', notes: 'Defective verb: baqitu, I stayed; yabqa, he stays.' }),
	F({ slug: 'nigih', howa: ['نَجَحَ', 'naja7a'], root: 'ن ج ح', cls: 'sound', s2: ['نَجَحْ', 'naja7'], heya: ['نَجَحَتْ', 'naja7at'], homma: ['نَجَحُوا', 'naja7u'], pv: 'a', pres: ['نْجَح', 'nja7'], ending: 'sound', notes: 'Form I verb: naja7a, yanja7u.' }),
	F({
		slug: 'a-xad', howa: ['أَخَذَ', 'akhadha'], root: 'أ خ ذ', cls: 'hamzated', s2: ['أَخَذْ', 'akhadh'], heya: ['أَخَذَتْ', 'akhadhat'], homma: ['أَخَذُوا', 'akhadhu'], pv: 'a', pres: ['أْخُذ', '2khudh'], ending: 'sound', notes: 'Hamzated verb: two hamzas merge into آ for "I": akhudhu, I take; ya2khudhu, he takes.',
		ind: { ana: ['آخُذُ', 'akhudhu'] },
		subj: { ana: ['آخُذَ', 'akhudha'] }
	}),
	F({ slug: 'mazza', howa: ['مَزَّقَ', 'mazzaqa'], root: 'م ز ق', cls: 'form II', s2: ['مَزَّقْ', 'mazzaq'], heya: ['مَزَّقَتْ', 'mazzaqat'], homma: ['مَزَّقُوا', 'mazzaqu'], pv: 'u', pres: ['مَزِّق', 'mazziq'], ending: 'sound', notes: 'Form II verb: yumazziqu, he tears up.' }),
	F({ slug: 'akar', howa: ['شَكَرَ', 'shakara'], root: 'ش ك ر', cls: 'sound', s2: ['شَكَرْ', 'shakar'], heya: ['شَكَرَتْ', 'shakarat'], homma: ['شَكَرُوا', 'shakaru'], pv: 'a', pres: ['شْكُر', 'shkur'], ending: 'sound', notes: 'Form I verb: shakara, yashkuru.' }),
	F({ slug: 'raba', howa: ['رَبَطَ', 'rabata'], root: 'ر ب ط', cls: 'sound', s2: ['رَبَطْ', 'rabat'], heya: ['رَبَطَتْ', 'rabatat'], homma: ['رَبَطُوا', 'rabatu'], pv: 'a', pres: ['رْبِط', 'rbit'], ending: 'sound', notes: 'Form I verb: rabata, yarbitu.' }),
	F({ slug: 'lamas', howa: ['لَمَسَ', 'lamasa'], root: 'ل م س', cls: 'sound', s2: ['لَمَسْ', 'lamas'], heya: ['لَمَسَتْ', 'lamasat'], homma: ['لَمَسُوا', 'lamasu'], pv: 'a', pres: ['لْمِس', 'lmis'], ending: 'sound', notes: 'Form I verb: lamasa, yalmisu.' }),
	F({ slug: 'ista3mil', howa: ['اسْتَعْمَلَ', 'ista3mala'], root: 'ع م ل', cls: 'form X', s2: ['اسْتَعْمَلْ', 'ista3mal'], heya: ['اسْتَعْمَلَتْ', 'ista3malat'], homma: ['اسْتَعْمَلُوا', 'ista3malu'], pv: 'a', pres: ['سْتَعْمِل', 'sta3mil'], ending: 'sound', notes: 'Form X verb: yasta3milu, he uses.' })
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
