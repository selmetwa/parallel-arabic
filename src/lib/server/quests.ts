import { supabase } from '$lib/supabaseClient';
import { awardXp } from '$lib/helpers/award-xp';
import { localDayKey, localDayStart, MAX_FREEZES } from '$lib/helpers/streak';
import {
	QUEST_DAYS_FOR_FREEZE,
	pickQuests,
	questProgress,
	weekStartKey,
	type QuestsState
} from '$lib/constants/quests';
import { loadToday, type TodayData, type TodayUser } from '$lib/server/today-path';

const count = (query: PromiseLike<{ count: number | null }>) =>
	Promise.resolve(query).then(
		(r) => r.count ?? 0,
		() => 0
	);

/** Words saved and tutor messages sent since `since` (ms). */
async function questExtras(userId: string, since: number) {
	const head = { count: 'exact', head: true } as const;
	const [saved, conversations] = await Promise.all([
		count(supabase.from('saved_word').select('id', head).eq('user_id', userId).gte('created_at', since)),
		supabase.from('tutor_conversation').select('id').eq('user_id', userId)
	]);
	const ids = (conversations.data ?? []).map((c) => c.id as string);
	const tutorMessages = ids.length
		? await count(
				supabase
					.from('tutor_message')
					.select('id', head)
					.in('conversation_id', ids)
					.eq('role', 'user')
					.gte('created_at', since)
			)
		: 0;
	return { saved, tutorMessages };
}

/** Claimed days this week. Empty if the quest_claim table isn't there yet. */
async function claimsThisWeek(userId: string, dayKey: string): Promise<string[]> {
	const { data, error } = await supabase
		.from('quest_claim')
		.select('day_key')
		.eq('user_id', userId)
		.gte('day_key', weekStartKey(dayKey));
	if (error) return [];
	return (data ?? []).map((r) => r.day_key as string);
}

export async function loadQuests(user: TodayUser, today: TodayData): Promise<QuestsState> {
	const now = Date.now();
	const dayKey = localDayKey(now, user.timezone);
	const [extras, claims] = await Promise.all([
		questExtras(user.id, localDayStart(now, user.timezone)),
		claimsThisWeek(user.id, dayKey)
	]);

	const quests = pickQuests(user.id, dayKey, {
		reviewable: today.counts.review + today.dueNow,
		lessonHref: today.lessonHref,
		goalKinds: today.path.steps.map((s) => s.kind)
	});
	const items = questProgress(quests, { ...today.counts, ...extras });
	const completed = items.filter((q) => q.complete).length;

	return {
		items,
		completed,
		allDone: items.length > 0 && completed === items.length,
		claimed: claims.includes(dayKey),
		weekClaims: claims.length,
		daysForFreeze: QUEST_DAYS_FOR_FREEZE
	};
}

export interface ClaimResult {
	ok: boolean;
	alreadyClaimed?: boolean;
	xpAwarded?: number;
	freezeEarned?: boolean;
	weekClaims?: number;
}

/**
 * Pays today's reward once, after checking on the server that every quest is
 * done: bonus XP, and a streak freeze on the week's QUEST_DAYS_FOR_FREEZE-th claim.
 */
export async function claimQuests(user: TodayUser, isSubscribed: boolean): Promise<ClaimResult> {
	const quests = await loadQuests(user, await loadToday(user, isSubscribed));
	if (!quests.allDone) return { ok: false };
	if (quests.claimed) return { ok: true, alreadyClaimed: true, weekClaims: quests.weekClaims };

	const now = Date.now();
	const { error } = await supabase
		.from('quest_claim')
		.insert({ user_id: user.id, day_key: localDayKey(now, user.timezone), claimed_at: now });
	if (error) {
		// 23505: claimed a moment ago, from another tab.
		if (error.code === '23505') return { ok: true, alreadyClaimed: true, weekClaims: quests.weekClaims };
		console.error('Could not record the quest claim:', error);
		return { ok: false };
	}

	const xp = await awardXp(user.id, 'quests_bonus', supabase);
	const weekClaims = quests.weekClaims + 1;

	let freezeEarned = false;
	if (weekClaims === QUEST_DAYS_FOR_FREEZE) {
		const { data } = await supabase.from('user').select('streak_freezes').eq('id', user.id).single();
		const held = data?.streak_freezes ?? 0;
		if (held < MAX_FREEZES) {
			const { error: freezeError } = await supabase
				.from('user')
				.update({ streak_freezes: held + 1 })
				.eq('id', user.id);
			freezeEarned = !freezeError;
		}
	}

	return { ok: true, xpAwarded: xp.success ? xp.xpAwarded : 0, freezeEarned, weekClaims };
}
