import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { curriculum } from '$lib/data/curriculum';

// A single, normalized entry in the activity history.
export interface HistoryItem {
	id: string;
	type: 'story' | 'tutor' | 'lesson' | 'game' | 'review' | 'sentences';
	icon: string;
	title: string;
	subtitle: string;
	timestamp: number; // milliseconds
	href: string;
	status?: string;
}

interface HistoryDay {
	dayKey: string;
	dayLabel: string;
	items: HistoryItem[];
}

const DIALECT_LABELS: Record<string, string> = {
	'egyptian-arabic': 'Egyptian',
	fusha: 'Fusha',
	levantine: 'Levantine',
	darija: 'Darija',
	alphabet: 'Alphabet'
};

const dialectLabel = (d: string | null | undefined) => DIALECT_LABELS[d ?? ''] ?? (d ?? '');

// Build topic_id -> title lookup once from the curriculum.
const topicTitles: Record<string, string> = (() => {
	const map: Record<string, string> = {};
	for (const module of curriculum) {
		for (const topic of module.topics) {
			map[topic.id] = topic.title;
		}
	}
	return map;
})();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Generated stories (UUID ids) live at /generated_story/{id}; hardcoded stories
// (slug ids) live at /stories/{slug}.
function storyHref(storyId: string): string {
	return UUID_RE.test(storyId) ? `/generated_story/${storyId}` : `/stories/${storyId}`;
}

function prettifySlug(slug: string): string {
	return slug
		.replace(/[-_]+/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase())
		.trim();
}

// Local midnight key + friendly label for grouping.
function dayKeyFor(ts: number): string {
	const d = new Date(ts);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function dayLabelFor(ts: number): string {
	const d = new Date(ts);
	const today = new Date();
	const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
	const diffDays = Math.round((startOf(today) - startOf(d)) / 86_400_000);
	if (diffDays === 0) return 'Today';
	if (diffDays === 1) return 'Yesterday';
	return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export const load: PageServerLoad = async ({ parent }) => {
	const { session, user } = await parent();

	if (!session || !user) {
		throw redirect(302, '/login');
	}

	const userId = user.id;
	const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
	const sinceMs = Date.now() - WINDOW_MS;
	const sinceSec = Math.floor(sinceMs / 1000);

	const [
		generatedStories,
		storyCompletions,
		tutorConversations,
		lessonProgress,
		gameProgress,
		dailyActivity
	] = await Promise.all([
		supabase
			.from('generated_story')
			.select('id, title, description')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(50),
		supabase
			.from('user_story_completion')
			.select('story_id, completed_at')
			.eq('user_id', userId)
			.gte('completed_at', sinceMs)
			.order('completed_at', { ascending: false })
			.limit(100),
		supabase
			.from('tutor_conversation')
			.select('id, dialect, created_at, summary, topics_discussed')
			.eq('user_id', userId)
			.gte('created_at', sinceMs)
			.order('created_at', { ascending: false })
			.limit(50),
		supabase
			.from('structured_lesson_progress')
			.select('topic_id, dialect, status, started_at, completed_at, last_accessed_at')
			.eq('user_id', userId)
			.gte('last_accessed_at', sinceSec)
			.order('last_accessed_at', { ascending: false })
			.limit(100),
		supabase
			.from('game_progress')
			.select('id, dialect, category, game_mode, status, score, total_questions, last_played_at')
			.eq('user_id', userId)
			.gte('last_played_at', sinceMs)
			.order('last_played_at', { ascending: false })
			.limit(100),
		supabase
			.from('user_daily_activity')
			.select('activity_date, reviews_count, sentences_viewed')
			.eq('user_id', userId)
			.gte('activity_date', sinceMs)
			.order('activity_date', { ascending: false })
			.limit(60)
	]);

	const items: HistoryItem[] = [];

	// Map of generated-story id -> title, used to label completions of own stories.
	const generatedTitles: Record<string, string> = {};
	// Daily-challenge stories are auto-generated and excluded from history.
	const dailyChallengeStoryIds = new Set<string>();

	const isDailyChallengeStory = (row: { title?: string | null; description?: string | null }) =>
		row.description === 'Daily Challenge Story' || (row.title ?? '').startsWith('daily-challenge-');

	// We don't surface "created" stories — only completions below. We still scan
	// the user's generated stories to resolve completion titles and to identify
	// auto-generated daily-challenge stories that should be excluded.
	for (const row of generatedStories.data ?? []) {
		if (isDailyChallengeStory(row)) {
			dailyChallengeStoryIds.add(row.id);
			continue;
		}
		generatedTitles[row.id] = row.title;
	}

	// Resolve titles for completed generated stories not in the recent fetch above
	// (UUID ids we don't yet have a title for). One batch query, server-side.
	const missingTitleIds = [
		...new Set(
			(storyCompletions.data ?? [])
				.map((r) => r.story_id as string)
				.filter((id) => UUID_RE.test(id) && !(id in generatedTitles) && !dailyChallengeStoryIds.has(id))
		)
	];
	if (missingTitleIds.length > 0) {
		const { data: extraStories } = await supabase
			.from('generated_story')
			.select('id, title, description')
			.in('id', missingTitleIds);
		for (const row of extraStories ?? []) {
			if (isDailyChallengeStory(row)) {
				dailyChallengeStoryIds.add(row.id);
			} else {
				generatedTitles[row.id] = row.title;
			}
		}
	}

	// Story completions (any story finished, hardcoded or generated)
	for (const row of storyCompletions.data ?? []) {
		const storyId: string = row.story_id;
		if (dailyChallengeStoryIds.has(storyId)) continue;
		// Never show a raw UUID: use the resolved title, or a generic label for
		// unresolved generated stories; prettify only real (slug) ids.
		const title = generatedTitles[storyId] || (UUID_RE.test(storyId) ? 'Story' : prettifySlug(storyId));
		items.push({
			id: `story-done-${storyId}-${row.completed_at}`,
			type: 'story',
			icon: '📖',
			title,
			subtitle: 'Story completed',
			timestamp: row.completed_at,
			href: storyHref(storyId),
			status: 'completed'
		});
	}

	// Tutor conversations
	for (const row of tutorConversations.data ?? []) {
		const topics = Array.isArray(row.topics_discussed) ? row.topics_discussed.filter(Boolean) : [];
		const subtitle = topics.length
			? topics.slice(0, 3).join(', ')
			: `Tutor chat · ${dialectLabel(row.dialect)}`;
		items.push({
			id: `tutor-${row.id}`,
			type: 'tutor',
			icon: '💬',
			title: row.summary || `Tutor chat · ${dialectLabel(row.dialect)}`,
			subtitle,
			timestamp: row.created_at,
			href: `/tutor?conversationId=${row.id}`
		});
	}

	// Structured lessons (seconds -> ms)
	for (const row of lessonProgress.data ?? []) {
		const tsSec = row.last_accessed_at ?? row.completed_at ?? row.started_at;
		if (!tsSec) continue;
		items.push({
			id: `lesson-${row.topic_id}-${tsSec}`,
			type: 'lesson',
			icon: '📚',
			title: topicTitles[row.topic_id] || 'Lesson',
			subtitle: `Lesson · ${dialectLabel(row.dialect)}${row.status === 'completed' ? ' · completed' : row.status === 'in_progress' ? ' · in progress' : ''}`,
			timestamp: tsSec * 1000,
			href: `/lessons/structured/${row.dialect}?lessonId=${row.topic_id}`,
			status: row.status
		});
	}

	// Games (resumable via resumeId)
	for (const row of gameProgress.data ?? []) {
		const params = new URLSearchParams({
			resumeId: row.id,
			dialect: row.dialect,
			category: row.category,
			mode: row.game_mode
		});
		items.push({
			id: `game-${row.id}`,
			type: 'game',
			icon: '🎮',
			title: `${prettifySlug(row.category)} game`,
			subtitle: `${dialectLabel(row.dialect)} · ${row.game_mode}${row.status === 'completed' ? ` · score ${row.score}/${row.total_questions}` : ' · in progress'}`,
			timestamp: row.last_played_at,
			href: `/learn/game/play?${params.toString()}`,
			status: row.status
		});
	}

	// Ephemeral surfaces: one synthesized item per active day, linking to a fresh session.
	for (const row of dailyActivity.data ?? []) {
		const ts: number = row.activity_date;
		if (row.reviews_count > 0) {
			items.push({
				id: `review-${ts}`,
				type: 'review',
				icon: '🧠',
				title: `Reviewed ${row.reviews_count} ${row.reviews_count === 1 ? 'word' : 'words'}`,
				subtitle: 'Vocab review · start a new session',
				timestamp: ts,
				href: '/review'
			});
		}
		if (row.sentences_viewed > 0) {
			items.push({
				id: `sentences-${ts}`,
				type: 'sentences',
				icon: '📝',
				title: `Practiced ${row.sentences_viewed} ${row.sentences_viewed === 1 ? 'sentence' : 'sentences'}`,
				subtitle: 'Sentences · start a new session',
				timestamp: ts,
				href: '/sentences'
			});
		}
	}

	// Sort newest-first, then group by calendar day.
	items.sort((a, b) => b.timestamp - a.timestamp);

	const days: HistoryDay[] = [];
	let current: HistoryDay | null = null;
	for (const item of items) {
		const key = dayKeyFor(item.timestamp);
		if (!current || current.dayKey !== key) {
			current = { dayKey: key, dayLabel: dayLabelFor(item.timestamp), items: [] };
			days.push(current);
		}
		current.items.push(item);
	}

	return {
		session,
		user,
		days
	};
};
