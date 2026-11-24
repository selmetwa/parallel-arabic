/**
 * Today's quests on the client: the main quest (today's path) and the side
 * quests, shared by the home card and the quest tracker on every other page.
 *
 * It refreshes after any request that can move a quest (see WATCHED), so the
 * tracker keeps up while the learner goes through the app, and it claims the
 * side-quest reward the moment the last one is done, wherever that happens.
 */
import { toast } from 'svelte-sonner';
import type { TodayPath } from '$lib/helpers/today-path';
import type { QuestsState } from '$lib/constants/quests';
import { firstTimeToday } from '$lib/helpers/today-flow';
import { hapticSuccess } from '$lib/helpers/haptics';
import { XP_AWARDS } from '$lib/helpers/xp-levels';
import { trackEvent } from '$lib/analytics';

export interface TodayQuestsData {
	path: TodayPath;
	quests: QuestsState;
}

export const todayQuests = $state<{
	data: TodayQuestsData | null;
	claim: 'idle' | 'sending' | 'done' | 'failed';
	freezeEarned: boolean;
}>({ data: null, claim: 'idle', freezeEarned: false });

/** Requests that can complete a quest step. */
const WATCHED = [
	'/api/save-word',
	'/api/save-sentences',
	'/api/import-words',
	'/api/award-xp',
	'/api/activity',
	'/api/speech-to-text',
	'/api/review-word',
	'/api/tutor-chat',
	'/api/tutor-save-session',
	'/api/structured-lessons/complete',
	'/api/daily-game-challenge'
];
const DEBOUNCE_MS = 1500;

let timer: ReturnType<typeof setTimeout> | undefined;
let watching = false;

/** Takes fresh data: announces what just got done, and claims the reward if it's due. */
export function applyTodayQuests(next: TodayQuestsData): void {
	const prev = todayQuests.data;

	for (const q of next.quests.items) {
		if (!q.complete) continue;
		if (firstTimeToday(`quest:${q.id}`)) trackEvent('quest_completed', { id: q.id });
		const was = prev?.quests.items.find((p) => p.id === q.id);
		if (was && !was.complete) {
			hapticSuccess();
			toast.success(`Side quest done: ${q.label}`, { duration: 2500 });
		}
	}

	for (const step of next.path.steps) {
		const was = prev?.path.steps.find((p) => p.kind === step.kind);
		if (step.complete && was && !was.complete && !next.path.allDone) {
			toast.success(`Main quest: ${step.label} ✓`, { duration: 2500 });
		}
	}

	if (next.path.allDone) {
		if (firstTimeToday('todayPathDone')) trackEvent('today_path_done', { steps: next.path.steps.length });
		if (prev && !prev.path.allDone) {
			hapticSuccess();
			toast.success('Main quest complete 🎉', { description: 'Your goal for today is done.' });
		}
	}

	todayQuests.data = next;
	if (next.quests.allDone && !next.quests.claimed && todayQuests.claim === 'idle') claimReward();
}

export async function refreshTodayQuests(): Promise<void> {
	try {
		const res = await fetch('/api/quests');
		if (res.ok) applyTodayQuests(await res.json());
	} catch {
		// Offline: keep what's shown.
	}
}

export function scheduleRefresh(): void {
	clearTimeout(timer);
	timer = setTimeout(refreshTodayQuests, DEBOUNCE_MS);
}

export async function claimReward(): Promise<void> {
	todayQuests.claim = 'sending';
	try {
		const res = await fetch('/api/quests/claim', { method: 'POST' });
		const body = await res.json();
		if (!res.ok || !body.ok) throw new Error();
		todayQuests.claim = 'done';
		todayQuests.freezeEarned = !!body.freezeEarned;
		if (todayQuests.data) {
			todayQuests.data.quests.claimed = true;
			todayQuests.data.quests.weekClaims = body.weekClaims ?? todayQuests.data.quests.weekClaims;
		}
		if (!body.alreadyClaimed) {
			hapticSuccess();
			toast.success(`Side quests complete: +${XP_AWARDS.quests_bonus} XP`, {
				description: body.freezeEarned ? 'And a streak freeze for this week.' : undefined
			});
			trackEvent('quests_claimed', { freezeEarned: !!body.freezeEarned });
		}
	} catch {
		todayQuests.claim = 'failed';
	}
}

/**
 * Refresh after any watched request finishes. Wraps window.fetch once, so the
 * pages that save words, award XP and so on don't each need to know about quests.
 */
export function watchQuestProgress(): void {
	if (watching || typeof window === 'undefined') return;
	watching = true;
	const original = window.fetch.bind(window);
	window.fetch = async (input, init) => {
		const res = await original(input, init);
		try {
			const req = input instanceof Request ? input : null;
			const method = (init?.method ?? req?.method ?? 'GET').toUpperCase();
			const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
			const path = new URL(url, location.origin).pathname;
			if (method !== 'GET' && res.ok && WATCHED.some((p) => path.startsWith(p))) scheduleRefresh();
		} catch {
			// Never let the tracker break a request.
		}
		return res;
	};
}
