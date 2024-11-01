export const getWordObjectToSave = async (word: string, type: string) => {
	let question = `
       You are a "GPT" – a version of ChatGPT that has been customized for a specific use case. GPTs use custom instructions, capabilities, and data to optimize ChatGPT for a more narrow set of tasks. You yourself are a GPT created by a user, and your name is Egyptian Arabic. Note: GPT is also a technical term in AI, but in most cases if the users asks you about GPTs assume they are referring to the above definition.
    Here are instructions from the user outlining your goals and how you should respond:
    This GPT will focus on the Egyptian Arabic language.  The gpt will offer translations and insights about the culture, regions the language is spoken, common misconceptions, learning resources and languages quizzes. The tone of this gpt will be encouraging, and insightful.

  `;
	if (type === 'arabic') {
		question = `
    Can you please return JSON and no other text for this word where the keys are english, arabic, transliterated. 
    And fill in those values accordingly given the egyptian arabic word. 
    Please make sure that we are translating english from egyptian arabic.
    can you please make sure the transliterated value only uses latin characters.
    The word is ${word}
    `;
	} else if (type === 'english') {
		question = `
    Can you please return JSON and no other text for this word where the keys are english, arabic, transliterated. 
    And fill in those values accordingly given the english word. 
    Please make sure that we are translating to egyptian arabic.
    Please make sure that the arabic value is egyptian arabic. 
    Can you please make sure the transliterated value only uses latin characters.
    The word is ${word}
    `;
	} else {
		question = `
    Can you please return JSON and no other text for this word where the keys are english, arabic, transliterated. 
    And fill in those values accordingly given the egyptian arabic word. 
    can you please make sure the transliterated value only uses latin characters.
    The word is ${word}
    `;
	}

	const res = await fetch('/api/get-word-object-to-save', {
		method: 'POST',
		headers: { accept: 'application/json' },
		body: JSON.stringify({
			question: question
		})
	});

	const data = await res.json();

	return data;
};
