// Export types
export type ExerciseType = 'multiple-choice' | 'fill-in-blank' | 'translation' | 'matching' | 'listening' | 'speaking' | 'writing' | 'sentence-practice';

export interface Exercise {
	id: string;
	type: ExerciseType;
	question: {
		english: string;
		arabic?: string;
	};
	options?: {
		arabic: string;
		english: string;
		transliteration: string;
		isCorrect: boolean;
	}[];
	correctAnswer: string | string[];
	hint?: {
		english: string;
		arabic: string;
		transliteration: string;
	};
	// For speaking exercises: include the target phrase to practice
	targetPhrase?: {
		arabic: string;
		english: string;
		transliteration: string;
	};
	// For writing exercises: include the word/phrase to write
	wordToWrite?: {
		english: string;
		arabic: string;
		transliteration: string;
	};
	// For sentence practice: include example sentences
	sentences?: Array<{
		arabic: string;
		english: string;
		transliteration: string;
	}>;
}

export interface LessonContent {
	title: {
		arabic: string;
		english: string;
		transliteration: string;
	};
	phrases: {
		arabic: string;
		english: string;
		transliteration: string;
		audioUrl?: string;
	}[];
	explanations?: {
		english: string;
		arabic?: string;
	}[];
}

export interface SubLesson {
	id: string;
	title: {
		arabic: string;
		english: string;
		transliteration: string;
	};
	content: LessonContent;
	exercises: Exercise[];
}

export interface Lesson {
	id: string;
	title: {
		arabic: string;
		english: string;
		transliteration: string;
	};
	level: 'beginner' | 'intermediate' | 'advanced';
	subLessons: SubLesson[];
}

// Export lesson1 - will be null if not yet generated
export let lesson1: Lesson | null = null;

// Dynamic import function for server-side
export async function loadLesson1(): Promise<Lesson | null> {
	try {
		// @ts-expect-error - Dynamic import may not exist at build time
		const lessonModule = await import('./lesson-1');
		console.log('Lesson module keys:', Object.keys(lessonModule));
		console.log('Lesson1 exists?', 'lesson1' in lessonModule);
		
		if (lessonModule.lesson1) {
			const loadedLesson = lessonModule.lesson1 as Lesson;
			
			// Validate the lesson structure
			if (!loadedLesson.id || !loadedLesson.title || !loadedLesson.subLessons) {
				console.error('Invalid lesson structure - missing required fields');
				return null;
			}
			
			if (!Array.isArray(loadedLesson.subLessons)) {
				console.error('Invalid lesson structure - subLessons is not an array');
				return null;
			}
			
			lesson1 = loadedLesson;
			console.log('Lesson1 loaded successfully:', lesson1?.id, lesson1?.title?.english);
			return lesson1;
		} else {
			console.error('lesson1 not found in module. Available exports:', Object.keys(lessonModule));
			return null;
		}
	} catch (e) {
		console.error('Error loading lesson 1:', e);
		if (e instanceof Error) {
			console.error('Error details:', e.message, e.stack);
		}
		console.log('Lesson 1 not yet generated. Use /lessons/generate to create it.');
		return null;
	}
}

