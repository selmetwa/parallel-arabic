export interface NavItem {
	label: string;
	href: string;
	icon: string;
}

export interface NavSection {
	title: string;
	items: NavItem[];
}

/**
 * The sidebar and mobile menu sections. Dialect-specific pages link straight
 * to the learner's dialect, so they never have to pick it again.
 */
export function getNavSections(session: unknown, dialect: string): NavSection[] {
	const learn: NavItem[] = [
		{ label: 'Alphabet', href: '/alphabet', icon: '✍️' },
		{ label: 'Lessons', href: `/lessons/structured/${dialect}`, icon: '📚' },
		{ label: 'Custom Lessons', href: '/lessons/custom', icon: '🧩' },
		{ label: 'Grammar', href: `/grammar/${dialect}`, icon: '📐' },
		{ label: 'Dictionary', href: `/dictionary/${dialect}`, icon: '🔎' },
		{ label: 'Verb Tables', href: `/${dialect}/conjugations`, icon: '📋' }
	];
	// Topic word lists only exist for Egyptian; the dictionary covers the rest.
	if (dialect === 'egyptian-arabic') {
		learn.push({ label: 'Word Lists', href: '/egyptian-arabic/vocabulary', icon: '🗒️' });
	}
	learn.push({ label: 'Vocab Review', href: '/review', icon: '🧠' });

	return [
		{ title: 'Learn', items: learn },
		{
			title: 'Practice',
			items: [
				{ label: 'Scenarios', href: '/scenarios', icon: '🗣️' },
				{ label: 'Game', href: '/learn/game', icon: '🎮' },
				{ label: 'Sentences', href: '/sentences', icon: '📝' },
				{ label: 'Conjugation Drill', href: '/conjugations', icon: '🔄' },
				{ label: 'Stories', href: '/stories', icon: '📖' },
				{ label: 'Speak', href: '/speak', icon: '🎤' },
				{ label: 'Tutor', href: '/tutor', icon: '💬' }
			]
		},
		{
			title: 'General',
			items: [
				{ label: 'My words', href: '/review/all-words', icon: '🗂️' },
				{ label: 'History', href: '/history', icon: '📜' },
				session
					? { label: 'Profile', href: '/profile', icon: '👤' }
					: { label: 'Login', href: '/login', icon: '🔐' }
			]
		}
	];
}
