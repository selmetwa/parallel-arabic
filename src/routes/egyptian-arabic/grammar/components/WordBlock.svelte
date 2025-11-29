<script lang="ts">
	import { run } from 'svelte/legacy';

	import cn from 'classnames';
	import { onMount } from 'svelte';
	import { conjugation_cases, conjugations } from '../constants';
	import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
	import { type Keyboard } from '$lib/types/index';

	interface Props {
		showHint?: boolean;
		showAnswer?: boolean;
		conjugationIndex: any;
		verbToConjugate: {
      egyptianArabic: string;
      egyptianArabicTransliteration: string;
      english: string;
    };
	}

	let {
		showHint = $bindable(false),
		showAnswer = false,
		conjugationIndex,
		verbToConjugate
	}: Props = $props();

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

	let attemptTemp: Attempt[] = $state([]);
	let attempt: Attempt[] = $state([]);

	$effect(() => {
		attempt = attemptTemp;
	});

	let isCorrect = $state(false);
  let keyboardValue = $state('');
  let keyboard = $state<'virtual' | 'physical'>('virtual')
  
  // Detect mobile on mount and default to native keyboard
  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;
	let conjugatedVerbArray: Array<ConjugatedVerb> = $state([]);

	$effect(() => {
		if (conjugationIndex || verbToConjugate.egyptianArabic) {
      const keyboard = document.querySelector('arabic-keyboard') as Keyboard | null;
      keyboard && keyboard.resetValue();
			attemptTemp = [];
			isCorrect = false;
	    keyboardValue = '';
		}
	});

	function conjugate(verb: {
		egyptianArabic: string;
		egyptianArabicTransliteration: string;
		english: string;
	}) {
		const transliterationWeWant = verb.egyptianArabicTransliteration;
		const englishWeWant = verb.english;

		const output: Array<ConjugatedVerb> = [];

		conjugation_cases.forEach((c) => {
			const conjugation = (conjugations as any)[c.value][c.tense];
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
        const regex = /[-–]/;

				const presentTenseVerb = verb.egyptianArabic.trim().split(regex)[0].trim();


				if (regex.test(conjugation)) {
					start = conjugation.split(regex)[0];
					end = conjugation.split(regex)[1];
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

    if (!arr1 || !arr2) {
      return false;
    }
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

		if (areArraysEqual(myInputArr, (verbArray || []))) {
			isCorrect = true;
		}
	}

	onMount(() => {
		// Default to native keyboard on mobile
		if (isMobile()) {
			keyboard = 'physical';
		}
		
		conjugatedVerbArray = conjugate(verbToConjugate);

		const keyboardEl = document.querySelector('arabic-keyboard') as Keyboard | null;
		updateKeyboardStyle();

		// Only process virtual keyboard events when virtual keyboard is active
		const handleVirtualKeyboard = () => {
			if (keyboard !== 'virtual') return;
			const value = keyboardEl && keyboardEl.getTextAreaValue();
			if (typeof value === 'string') {
				compareMyInput(value);
			}
		};

		document.addEventListener('keydown', handleVirtualKeyboard);
		document.addEventListener('click', handleVirtualKeyboard);
		
		return () => {
			document.removeEventListener('keydown', handleVirtualKeyboard);
			document.removeEventListener('click', handleVirtualKeyboard);
		};
	});

	let verbArray: Array<string> = $state([]);

	run(() => {
		if (conjugationIndex || verbToConjugate.egyptianArabic) {
			conjugatedVerbArray = conjugate(verbToConjugate);
			attemptTemp = [];
			attempt = [];
			const cleanWord = conjugatedVerbArray[conjugationIndex]?.conjugatedVerb
				.split('')
				.filter((char: string) => char !== ' ');

			verbArray = cleanWord;
		}
	});

  function onRegularKeyboard(e: Event) {
    const value = (e.target as HTMLTextAreaElement).value;
    compareMyInput(value);
    keyboardValue = value;
  }

  function toggleKeyboard() {
    keyboard = keyboard === 'virtual' ? 'physical' : 'virtual';
  }
</script>

{#if isCorrect}
	<div class="mb-4 flex w-full flex-row items-center justify-center gap-2 py-2 transition-all duration-300" style="background-color: var(--green1);">
		<span class="text-lg font-semibold text-text-300">Correct</span>
	</div>
{/if}

{#if conjugatedVerbArray.length > 0}
	<div class="border border-tile-500 bg-tile-400 px-3 py-4 text-center mb-6 shadow-lg">
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<div class="flex flex-col items-center">
				<p class="text-sm text-text-200 mb-1">Pronoun</p>
				<p class="text-xl text-text-300 font-bold">{conjugatedVerbArray[conjugationIndex].possessive}</p>
			</div>
			<div class="flex flex-col items-center">
				<p class="text-sm text-text-200 mb-1">Tense</p>
				<p class="text-xl text-text-300 font-bold">{conjugatedVerbArray[conjugationIndex].tense}</p>
			</div>
			<div class="flex flex-col items-center">
				<p class="text-sm text-text-200 mb-1">Verb</p>
				<p class="text-xl text-text-300 font-bold">
					{conjugatedVerbArray[conjugationIndex].englishWeWant}
				</p>
			</div>
			{#if showHint}
				<div class="flex flex-col items-center">
					<p class="text-sm text-text-200 mb-1">Verb Arabic</p>
					<p class="text-xl text-text-300">
						{conjugatedVerbArray[conjugationIndex].verbWeWant.split(/[-–]/)[0]}
					</p>
				</div>
				<div class="flex flex-col items-center">
					<p class="text-sm text-text-200 mb-1">Verb Transliterated</p>
					<p class="text-xl text-text-300">
						{conjugatedVerbArray[conjugationIndex].transliterationWeWant
							.split(/[-–]/)[0]}
					</p>
				</div>
			{/if}
			{#if showAnswer}
				<div class="flex flex-col items-center">
					<p class="text-sm text-text-200 mb-1">Conjugated Answer</p>
					<p class="text-2xl text-text-300 font-bold">
						{conjugatedVerbArray[conjugationIndex].conjugatedVerb}
					</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

<div class="mb-6 text-center">
	<span>
		{@html attempt
			.map(
				({ letter, correct }) =>
					`<span class="${cn('text-4xl', {
						'text-green-500': correct,
						'text-red-500': !correct
					})}">${letter}</span>`
			)
			.join('')}
	</span>
</div>

<div class="mb-6 px-3 py-4">
	<div class="mb-3 flex items-center justify-between gap-2">
		<button 
			onclick={toggleKeyboard}
			class="flex items-center gap-2 px-3 py-1.5 text-sm text-text-300 bg-tile-400 hover:bg-tile-500 border border-tile-500 rounded-lg transition-colors"
		>
			<span>{keyboard === 'virtual' ? '📱 Use native keyboard' : '⌨️ Use virtual keyboard'}</span>
		</button>
	</div>
	
	<div class={cn('block', { hidden: keyboard !== 'virtual' })}>
		<arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
	</div>
	
	<textarea
		bind:value={keyboardValue}
		oninput={onRegularKeyboard}
		placeholder="اكتب هنا..."
		dir="rtl"
		class={cn('block min-h-40 w-full text-2xl sm:text-3xl font-arabic text-text-300 bg-tile-200 border-2 border-tile-500 rounded-xl p-4 focus:border-tile-700 focus:outline-none focus:ring-2 focus:ring-tile-600/50 transition-all placeholder:text-text-100', {
			hidden: keyboard === 'virtual'
		})}
	></textarea>
</div>
