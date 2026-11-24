import { supabase } from '$lib/supabaseClient';
import { dueFilter } from '$lib/server/srs-due';
import { countActivity } from '$lib/server/activity';
import { localDayStart } from '$lib/helpers/streak';
import { parseGoal, type ActivityCounts } from '$lib/constants/daily-goal';
import { findV2Topic, getCurriculumV2 } from '$lib/data/curriculum-v2';
import { curriculum } from '$lib/data/curriculum';
import { getGame } from '$lib/constants/games';
import { challengeDate, gameOfTheDay } from '$lib/games/today';
import { puzzleNumber } from '$lib/games/daily-root';
import { buildTodayPath, type TodayPath } from '$lib/helpers/today-path';

/** The user row fields this needs (the full row from safeGetSession has them). */
export interface TodayUser {
	id: string;
	timezone?: string | null;
	daily_goal?: unknown;
	daily_review_limit?: number | null;
	target_dialect?: string | null;
	proficiency_level?: string | null;
	last_content_type?: string | null;
	last_content_id?: string | null;
	last_content_dialect?: string | null;
	last_content_position?: number | null;
}

export interface InProgressLesson {
	topicId: string;
	dialect: string;
	stepIndex: number;
	title: string;
}

/**
 * The lesson they left part-way through, in the dialect they're learning now:
 * after a switch, the old dialect's lesson would pull them back.
 */
export async function resolveInProgressLesson(user: TodayUser): Promise<InProgressLesson | null> {
	if (
		user.last_content_type !== 'lessons' ||
		!user.last_content_id ||
		!user.last_content_dialect ||
		(user.target_dialect && user.last_content_dialect !== user.target_dialect)
	) {
		return null;
	}

	const { data: lp } = await supabase
		.from('structured_lesson_progress')
		.select('status')
		.eq('user_id', user.id)
		.eq('topic_id', user.last_content_id)
		.eq('dialect', user.last_content_dialect)
		.maybeSingle();
	if (lp && lp.status !== 'in_progress') return null;

	const title =
		findV2Topic(user.last_content_dialect, user.last_content_id)?.topic.title ??
		curriculum.flatMap((m) => m.topics).find((t) => t.id === user.last_content_id)?.title ??
		'Continue Lesson';
	return {
		topicId: user.last_content_id,
		dialect: user.last_content_dialect,
		stepIndex: user.last_content_position ?? 0,
		title
	};
}

/**
 * The lesson to open next: the one in progress, else the first one not yet
 * completed from their level on. Free accounts can only open the first lesson,
 * so once that's done there's nothing to open and the path offers a story.
 */
async function nextLesson(
	user: TodayUser,
	isSubscribed: boolean,
	inProgress: InProgressLesson | null
): Promise<{ href: string; title: string } | null> {
	if (inProgress) {
		return {
			href: `/lessons/structured/${inProgress.dialect}?lessonId=${encodeURIComponent(inProgress.topicId)}&step=${inProgress.stepIndex}`,
			title: inProgress.title
		};
	}

	const dialect = user.target_dialect || 'egyptian-arabic';
	const modules = getCurriculumV2(dialect);
	if (!modules?.length) {
		return { href: `/lessons/structured/${dialect}`, title: 'Your next lesson' };
	}

	const { data } = await supabase
		.from('structured_lesson_progress')
		.select('topic_id')
		.eq('user_id', user.id)
		.eq('dialect', dialect)
		.eq('status', 'completed');
	const completed = new Set((data ?? []).map((r) => r.topic_id as string));

	const candidates = isSubscribed
		? modules
				.slice(Math.max(0, modules.findIndex((m) => m.level === user.proficiency_level)))
				.flatMap((m) => m.topics)
		: modules[0].topics.slice(0, 1);
	const topic = candidates.find((t) => !completed.has(t.id));
	if (!topic) return null;

	return {
		href: `/lessons/structured/${dialect}?lessonId=${encodeURIComponent(topic.id)}`,
		title: topic.title
	};
}

async function dueNowCapped(user: TodayUser): Promise<number> {
	const { count } = await supabase
		.from('saved_word')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', user.id)
		.or(dueFilter(Date.now()));
	return Math.min(count ?? 0, user.daily_review_limit || 20);
}

async function challengeClaimed(userId: string, number: number): Promise<boolean> {
	const { data } = await supabase
		.from('daily_challenge')
		.select('id')
		.eq('user_id', userId)
		.eq('challenge_date', challengeDate(number))
		.eq('challenge_type', 'game')
		.maybeSingle();
	return !!data;
}

/** Today's path for a signed-in learner. Pass what the caller already has to skip its query. */
export async function loadTodayPath(
	user: TodayUser,
	isSubscribed: boolean,
	known: { dueNow?: number; inProgressLesson?: InProgressLesson | null } = {}
): Promise<TodayPath> {
	return (await loadToday(user, isSubscribed, known)).path;
}

export interface TodayData {
	path: TodayPath;
	counts: ActivityCounts;
	dueNow: number;
	lessonHref: string | null;
}

/** The path plus the inputs it was built from, which quests reuse. */
export async function loadToday(
	user: TodayUser,
	isSubscribed: boolean,
	known: { dueNow?: number; inProgressLesson?: InProgressLesson | null } = {}
): Promise<TodayData> {
	const number = puzzleNumber();
	const inProgress =
		known.inProgressLesson !== undefined
			? known.inProgressLesson
			: await resolveInProgressLesson(user);

	const [counts, dueNow, lesson, challengeDone] = await Promise.all([
		countActivity(user.id, localDayStart(Date.now(), user.timezone)) as Promise<ActivityCounts>,
		known.dueNow ?? dueNowCapped(user),
		nextLesson(user, isSubscribed, inProgress),
		challengeClaimed(user.id, number)
	]);

	const path = buildTodayPath(parseGoal(user.daily_goal), counts, {
		dueNow,
		lesson,
		gameName: getGame(gameOfTheDay(number))?.name ?? null,
		challengeDone
	});
	return { path, counts, dueNow, lessonHref: lesson?.href ?? null };
}
