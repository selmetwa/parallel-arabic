import { PLANS } from '$lib/constants/pricing';

/**
 * Written against the Search Console queries that land on /tutor: "ai arabic
 * tutor", "ai arabic tutor free", "speak arabic with ai", "arabic chatbot",
 * "learn arabic with ai". The page ranked at the bottom of page one with almost
 * no text on it besides the app itself.
 */
export const TUTOR_FAQS = [
	{
		question: 'What is the AI Arabic tutor?',
		answer:
			'A conversation partner you talk to out loud. You speak Arabic into your microphone, the tutor answers in spoken Arabic in the dialect you picked, and every reply comes with a translation and a correction of what you just said.'
	},
	{
		question: 'Which Arabic dialects can I speak with it?',
		answer:
			'Egyptian, Levantine, Iraqi, Gulf and Saudi Arabic, and Modern Standard Arabic. The tutor stays in the dialect you choose, so an Egyptian conversation uses Egyptian words and grammar rather than Fusha with an accent.'
	},
	{
		question: 'Is the AI Arabic tutor free?',
		answer: `The first three steps of a guided beginner scenario are free, so you can hear it and speak to it before paying anything. Open conversation and unlimited scenarios are part of Premium, which is ${PLANS.monthly.price} or ${PLANS.annual.price}.`
	},
	{
		question: 'Can a complete beginner use it?',
		answer:
			'Yes. Each scenario first teaches the key words and sentences and has you repeat them, and only then starts the conversation. If you get stuck you can answer in English or type your reply instead.'
	},
	{
		question: 'Can I choose what we talk about?',
		answer:
			'Yes. Pick a ready-made scenario such as ordering coffee or taking a taxi, or describe your own situation in a sentence and the tutor builds the lesson and the conversation around it.'
	},
	{
		question: 'How is it different from an Arabic chatbot?',
		answer:
			'A chatbot answers questions in text. The tutor is built for speaking practice: it listens to your voice, replies out loud, keeps the conversation at your level, and tells you what to fix after each turn.'
	}
];
