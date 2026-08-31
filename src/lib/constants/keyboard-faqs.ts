/**
 * Written against the Search Console queries that land on /keyboard:
 * "arabic virtual keyboard", "arabic diacritics keyboard", "arabic online
 * keyboard", "egyptian arabic keyboard", "virtual keyboard in arabic".
 */
export const KEYBOARD_FAQS = [
	{
		question: 'How do I type Arabic diacritics (harakat)?',
		answer:
			'Type the vowel letter followed by an equals sign: a= gives fatha (َ), u= gives damma (ُ), i= gives kasra (ِ). Shadda (ّ), sukun (ْ) and the tanween endings each have their own key on the diacritics row. The marks attach to the letter you typed immediately before them, exactly as they would on an Arabic keyboard.'
	},
	{
		question: 'Do I need to install an Arabic keyboard on my computer?',
		answer:
			'No. This keyboard runs in the browser, so nothing is installed and no system language settings change. Type here, then copy the text wherever you need it.'
	},
	{
		question: 'Does it work on a phone?',
		answer:
			'Yes. The on-screen keys work by tap on iOS and Android, and the layout reflows for narrow screens. You can also paste in Arabic text from elsewhere and add diacritics to it here.'
	},
	{
		question: 'Can I type Egyptian Arabic on it?',
		answer:
			'Yes — Egyptian Arabic uses the same 28-letter alphabet as every other variety. The Listen button reads your text back in an Egyptian accent, which is useful for checking that what you typed says what you meant.'
	},
	{
		question: 'How do I type the emphatic letters like ص and ض?',
		answer:
			'Use the capital of the matching plain letter: S gives ص, D gives ض, T gives ط and Z gives ظ. Letters with no single-key English equivalent use an apostrophe: s’ gives ش, t’ gives ث.'
	},
	{
		question: 'How do I type Arabic numerals?',
		answer:
			'Type the ordinary digits 0 to 9 and they become the Eastern Arabic forms ٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩. Note that Arabic numbers read left to right even though the surrounding text runs right to left.'
	}
];
