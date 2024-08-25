<script lang="ts">
	import cn from 'classnames';
	import { onMount } from 'svelte';
	import { conjugation_cases, conjugations } from '../constants';
	import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
	import { type Keyboard } from '$lib/types/index';

	export let showHint = false;
  export let showAnswer = false;

	export let conjugationIndex;
	export let verbToConjugate: {
		egyptianArabic: string;
		egyptianArabicTransliteration: string;
		english: string;
	};

	type ConjugatedVerb = {
		possessive: string;
		tense: string;
		conjugation: string;
		conjugatedVerb: string;
		transliterationWeWant: string;
		englishWeWant: string;
		verbWeWant: string;
	};
	type Attempt = {
		letter: string;
		correct: boolean;
	};

	let attemptTemp: Attempt[] = [];
	$: attempt = attemptTemp;
	$: isCorrect = false;

	let conjugatedVerbArray: Array<ConjugatedVerb> = [];

	$: if (conjugationIndex) {
		attemptTemp = [];
		isCorrect = false;
	}

	function conjugate(verb: {
		egyptianArabic: string;
		egyptianArabicTransliteration: string;
		english: string;
	}) {
		const transliterationWeWant = verb.egyptianArabicTransliteration;
		const englishWeWant = verb.english;

		const output: Array<ConjugatedVerb> = [];

		conjugation_cases.forEach((c) => {
			const conjugation = conjugations[c.value][c.tense];
			const verbWeWant = verb.egyptianArabic;

			if (c.tense === 'past') {
				const pastTenseVerb = verb.egyptianArabic.trim().split(/[-–]/)[0].trim();
				let combined = [...pastTenseVerb.split(''), ...conjugation.split('')].join('');

				output.push({
					possessive: c.possessive,
					tense: c.tense,
					conjugation,
					conjugatedVerb: combined,
					transliterationWeWant,
					englishWeWant,
					verbWeWant
				});
			}

			if (['present', 'future', 'infinitive'].includes(c.tense)) {
				let start = '';
				let end = '';
				const verbWeWant = verb.egyptianArabic;

				const presentTenseVerb = verb.egyptianArabic.trim().split(/[-–]/)[1].trim().slice(1);

				if (conjugation.includes('-')) {
					start = conjugation.split(/[-–]/)[0];
					end = conjugation.split(/[-–]/)[1];
				} else {
					start = conjugation;
				}

				let combined = [...start.split(''), ...presentTenseVerb.split(''), ...end.split('')].join(
					''
				);

				output.push({
					possessive: c.possessive,
					tense: c.tense,
					conjugation,
					conjugatedVerb: combined,
					transliterationWeWant,
					englishWeWant,
					verbWeWant
				});
			}
		});

		return output;
	}

	function areArraysEqual(arr1: Array<string>, arr2: Array<string>) {
		if (arr1.length !== arr2.length) {
			return false;
		}

		for (let i = 0; i < arr1.length; i++) {
			if (arr1[i] !== arr2[i]) {
				return false;
			}
		}

		return true;
	}

	function handleShowHint() {
		showHint = true;
	}

	function compareMyInput(myInput: string) {
		const myInputArr = myInput.split('');

		const result = myInputArr.map((letter, index) => {
			if (letter === verbArray[index]) {
				return {
					letter,
					correct: true
				};
			}
			return {
				letter,
				correct: false
			};
		});

		attemptTemp = result;

		if (areArraysEqual(myInputArr, verbArray)) {
			isCorrect = true;
		}
	}

	onMount(() => {
		conjugatedVerbArray = conjugate(verbToConjugate);

		const keyboard = document.querySelector('arabic-keyboard') as Keyboard | null;
		updateKeyboardStyle();

		document.addEventListener('keydown', () => {
			const value = keyboard && keyboard.getTextAreaValue();
			if (typeof value === 'string') {
				compareMyInput(value);
			}
		});

		document.addEventListener('click', () => {
			const value = keyboard && keyboard.getTextAreaValue();
			if (typeof value === 'string') {
				compareMyInput(value);
			}
		});
	});

	let verbArray: Array<string> = [];

	$: if (conjugationIndex || verbToConjugate.egyptianArabic) {
		conjugatedVerbArray = conjugate(verbToConjugate);
		attemptTemp = [];
		attempt = [];
		const cleanWord = conjugatedVerbArray[conjugationIndex]?.conjugatedVerb
			.split('')
			.filter((char: string) => char !== ' ');

		verbArray = cleanWord;
	}
</script>

{#if isCorrect}
	<div
		class="mb-4 flex w-full flex-row items-center justify-center gap-2 bg-green-100 py-2 transition-all duration-300"
	>
		<span class="text-lg font-semibold text-text-300">Correct</span>
	</div>
{/if}
{#if conjugatedVerbArray.length > 0}
	<div class="mx-auto w-fit border-2 border-tile-500 bg-tile-400 px-12 py-6 text-center mt-4">
		<div class="flex flex-row gap-6  flex-wrap">
			<div class="flex flex-col items-start">
				<p class="whitespace-nowrap text-sm">Pronoun</p>
				<p class="whitespace-nowrap text-2xl">{conjugatedVerbArray[conjugationIndex].possessive}</p>
			</div>
			<div class="flex flex-col items-start">
				<p class="whitespace-nowrap text-sm">Tense</p>
				<p class="whitespace-nowrap text-2xl">{conjugatedVerbArray[conjugationIndex].tense}</p>
			</div>
			<div class="flex flex-col items-start">
				<p class="whitespace-nowrap text-sm">Verb</p>
				<p class="whitespace-nowrap text-2xl">
					{conjugatedVerbArray[conjugationIndex].englishWeWant}
				</p>
			</div>
			{#if showHint}
				<div class="flex flex-col items-start">
					<p class="whitespace-nowrap text-sm">Verb Arabic (Present - Past)</p>
					<p class="whitespace-nowrap text-2xl">
						{conjugatedVerbArray[conjugationIndex].verbWeWant}
					</p>
				</div>
				<div class="flex flex-col items-start">
					<p class="whitespace-nowrap text-sm">Verb Arabic (Present - Past)</p>
					<p class="whitespace-nowrap text-2xl">
						{conjugatedVerbArray[conjugationIndex].transliterationWeWant
							.split(/[-–]/)
							.reverse()
							.join()}
					</p>
				</div>
			{/if}
      {#if showAnswer}
        <div class="flex flex-col items-start">
          <p class="whitespace-nowrap text-sm">Conjugated Answer</p>
          <p class="whitespace-nowrap text-xl">
            {conjugatedVerbArray[conjugationIndex].conjugatedVerb}
          </p>
        </div>
      {/if}
		</div>
	</div>
{/if}
<div class="mt-12 w-fit mx-auto">
	<span>
		{@html attempt
			.map(
				({ letter, correct }) =>
					`<span class="${cn('text-5xl', {
						'text-green-500': correct,
						'text-red-500': !correct
					})}">${letter}</span>`
			)
			.join('')}
	</span>
</div>
<div class="mt-5">
	<arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
</div>
