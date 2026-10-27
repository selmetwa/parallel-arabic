/**
 * Plain-English explanations of the terms the verb tables use: the derived
 * forms (Form I–X) and the verb classes (sound, hollow…). Shown in the verb
 * glossary panel and in the popovers on each verb's badges.
 */

export type DerivedForm = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'IX' | 'X' | 'Q';

export interface GlossaryEntry {
	label: string;
	/** The pattern, written with the placeholder root ف ع ل (f-3-l). */
	pattern?: string;
	summary: string;
	examples: string[];
}

export const ROOTS_INTRO =
	'Most Arabic words grow from a root of three consonants that carries a core meaning: ك ت ب (k-t-b) is about writing, د ر س (d-r-s) about studying. A verb "form" is a fixed pattern of vowels and extra letters laid over that root, and each pattern nudges the meaning in a predictable direction. Grammarians number the patterns with Roman numerals and use ف ع ل (f-3-l) as a stand-in root to show them. Learn the patterns and you can often guess what a new verb means, and how it conjugates, from its shape.';

export const FORMS: Record<DerivedForm, GlossaryEntry> = {
	I: {
		label: 'Form I',
		pattern: 'فَعَل fa3al',
		summary:
			'The basic form: just the three root letters with short vowels. It carries the root\'s plain meaning, and most everyday verbs are Form I.',
		examples: ['كَتَب katab: to write', 'فَتَح fata7: to open', 'شِرِب shirib: to drink']
	},
	II: {
		label: 'Form II',
		pattern: 'فَعَّل fa33al',
		summary:
			'The middle root letter is doubled. This usually makes a verb causative ("make someone do it") or intensive.',
		examples: ['دَرَس daras: to study → دَرَّس darras: to teach', 'غَيَّر ghayyar: to change (something)', 'جَهِّز gahhiz: to prepare']
	},
	III: {
		label: 'Form III',
		pattern: 'فاعِل faa3il',
		summary:
			'A long "aa" after the first root letter. It often means doing the action with or towards someone else.',
		examples: ['ساعِد saa3id: to help', 'قابِل 2aabil: to meet (someone)', 'وافِق waafi2: to agree, accept']
	},
	IV: {
		label: 'Form IV',
		pattern: 'أَفْعَل af3al',
		summary:
			'An "a-" prefix that makes a verb causative. It is common in Modern Standard Arabic; the dialects mostly use Form II or another verb instead.',
		examples: ['خَرَج kharaja: to go out → أَخْرَج akhraja: to take out', 'أَعْطى a3ta: to give']
	},
	V: {
		label: 'Form V',
		pattern: 'تْفَعَّل (i)tfa33al',
		summary:
			'Form II with a t- prefix (it- in Egyptian). It turns the Form II action back on the subject: reflexive or "get done".',
		examples: ['عَلِّم 3allim: to teach → اتْعَلِّم it3allim: to learn', 'اتْحَرَّك it7arrak: to move (yourself)']
	},
	VI: {
		label: 'Form VI',
		pattern: 'تْفاعِل (i)tfaa3il',
		summary: 'Form III with a t- prefix. It is usually reciprocal: people doing the action to each other.',
		examples: ['اتْقابِل it2aabil: to meet each other', 'تَعاوَن ta3aawan: to cooperate']
	},
	VII: {
		label: 'Form VII',
		pattern: 'اِنْفَعَل infa3al',
		summary:
			'An in- prefix that gives a passive or "got done" meaning. Egyptian often uses an it- prefix for the same job.',
		examples: ['اِنْكَسَر inkasar: to get broken', 'اِنْبَسَط inbasat: to be pleased']
	},
	VIII: {
		label: 'Form VIII',
		pattern: 'اِفْتَعَل ifta3al',
		summary:
			'A t is slipped in after the first root letter. The meaning is often reflexive or self-directed, and many common verbs simply live in this form.',
		examples: ['اِشْتَغَل ishtaghal: to work', 'اِحْتَرَم i7taram: to respect', 'اِخْتار ikhtaar: to choose']
	},
	IX: {
		label: 'Form IX',
		pattern: 'اِفْعَلّ if3all',
		summary: 'Rare: used almost only for colours and physical traits, meaning "to become".',
		examples: ['اِحْمَرّ i7marr: to turn red', 'اِسْوَدّ iswadd: to turn black']
	},
	X: {
		label: 'Form X',
		pattern: 'اِسْتَفْعَل istaf3al',
		summary:
			'An ista- prefix. It often means seeking, asking for or considering something to have the root\'s quality.',
		examples: ['اِسْتَعْمِل ista3mil: to use', 'اِسْتَغْرَب istaghrab: to find strange', 'اِسْتَنّى istanna: to wait (Egyptian)']
	},
	Q: {
		label: 'Quadriliteral',
		pattern: 'فَعْلَل fa3lal',
		summary: 'Built from four root letters instead of three. It conjugates like Form II.',
		examples: ['تَرْجِم targim: to translate', 'فَرْجى farja: to show (Levantine)']
	}
};

export const CLASSES: Record<string, GlossaryEntry> = {
	sound: {
		label: 'Sound',
		summary:
			'All three root letters are ordinary consonants: no w, y or hamza (ء). Sound verbs follow the pattern with no surprises, so learn these first.',
		examples: ['كَتَب katab → كَتَبْت katabt: I wrote', 'فَتَح fata7 → بِيِفْتَح biyifta7: he opens']
	},
	hollow: {
		label: 'Hollow',
		summary:
			'The middle root letter is w or y, which surfaces as a long vowel. The vowel shortens when an ending starting with a consonant is added.',
		examples: ['شاف shaaf: he saw → شُفْت shuft: I saw', 'نام naam: he slept → نِمْت nimt: I slept']
	},
	defective: {
		label: 'Defective',
		summary:
			'The last root letter is w or y, so the verb ends in a vowel. That vowel merges with the person endings instead of taking them cleanly.',
		examples: ['مِشي mishi: he walked → مِشيت mishiit: I walked', 'نِسي nisi: he forgot → نِسيت nisiit: I forgot']
	},
	doubled: {
		label: 'Doubled',
		summary:
			'The second and third root letters are the same, so they are written once with a shadda. In the dialects a long -ee- or -ay- appears before the person endings.',
		examples: ['حَبّ 7abb: he loved → حَبّيت 7abbeet: I loved', 'حَطّ 7att: he put → حَطّيت 7atteet: I put']
	},
	irregular: {
		label: 'Irregular',
		summary:
			'A handful of very common verbs break the patterns, often because of a hamza or two weak letters. These are worth memorising as whole tables.',
		examples: ['جِه gih: to come (Egyptian)', 'كان kaan: to be', 'أَكَل akal → بياكُل biyaakul: he eats']
	},
	hamzated: {
		label: 'Hamzated',
		summary:
			'One root letter is a hamza (ء). In the dialects the hamza often drops out or turns into a long vowel, so these behave like hollow or defective verbs.',
		examples: ['سَأَل sa2al: to ask', 'أَخَد akhad: to take → باخُد baakhud: I take']
	},
	assimilated: {
		label: 'Assimilated',
		summary:
			'The first root letter is w or y. In Modern Standard Arabic it drops out of the present tense; most dialects keep it.',
		examples: ['وَصَل wasal: to arrive → يَصِل yasil: he arrives (MSA)']
	}
};

/** The class entry for a stored verbClass, which may name a weak type plus a form. */
export function classEntry(verbClass: string): GlossaryEntry | undefined {
	const key = verbClass.toLowerCase().split(/[,\s]+/).find((k) => k in CLASSES);
	return key ? CLASSES[key] : undefined;
}
