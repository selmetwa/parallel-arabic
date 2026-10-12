/**
 * A spelling someone would type into a search box. The word table's
 * transliteration is a linguist's: "báȿal [coll.]", "muškila", "šaaTir".
 * People search "basal", "mushkila", "shaatir".
 *
 * Kept free of imports so the page-building scripts can use it too.
 */
export function plainRomanisation(text: string): string {
	return text
		.replace(/\s*\[.*?\]/g, '')
		.replace(/š/gi, 'sh')
		.replace(/[ġɣ]/gi, 'gh')
		.replace(/x/gi, 'kh')
		.replace(/[ȿʂ]/g, 's')
		.replace(/ɧ/g, 'h')
		.replace(/ʈ/g, 't')
		.replace(/ɖ/g, 'd')
		.replace(/ʔ/g, "'")
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/^'+|'+$/g, '')
		.trim();
}
