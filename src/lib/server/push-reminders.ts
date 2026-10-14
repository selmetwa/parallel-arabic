import { supabase } from '$lib/supabaseClient';
import { pickPush, REVIEWS_MIN, type PushKind } from '$lib/helpers/push-plan';
import { apnsConfigured, sendPushes, type PushMessage } from '$lib/server/apns';

interface Learner {
	id: string;
	current_streak: number | null;
	longest_streak: number | null;
	streak_freezes: number | null;
	last_activity_date: number | null;
	onboarding_completed_at: number | null;
	timezone: string | null;
	push_sent_at: number | null;
	target_dialect: string | null;
	proficiency_level: string | null;
}

/** Same query the review page uses for "due". */
export async function dueWordCount(userId: string, now: number): Promise<number> {
	const { count } = await supabase
		.from('saved_word')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', userId)
		.or(`is_learning.eq.true,next_review_date.is.null,next_review_date.lte.${now}`);
	return count ?? 0;
}

function copy(kind: PushKind, learner: Learner, dueWords: number) {
	switch (kind) {
		case 'streak':
			return {
				title: `Your ${learner.current_streak}-day streak ends tonight`,
				body: 'A few minutes of Arabic keeps it going.',
				url: '/'
			};
		case 'first_day':
			return {
				title: 'Your first lesson is ready',
				body: 'Five minutes is enough to start.',
				url:
					learner.proficiency_level === 'A1'
						? '/alphabet'
						: `/lessons/structured/${learner.target_dialect ?? 'egyptian-arabic'}`
			};
		case 'reviews':
			return {
				title: `${dueWords} words are ready for review`,
				body: 'Go over them now, while they are still fresh.',
				url: '/review'
			};
		case 'comeback':
			return {
				title: 'Pick your Arabic back up',
				body: 'It has been a few days. One short session gets you going again.',
				url: '/'
			};
	}
}

/**
 * Sends each learner with the app the one push they are due, if any (see
 * push-plan.ts for the rules). Returns how many learners were reached.
 *
 * A streak push also stamps streak_reminder_sent_at, which is what stops the
 * streak email going to the same person the same evening.
 */
export async function sendPushReminders(now: number): Promise<number> {
	if (!apnsConfigured()) return 0;

	const { data: devices, error: devicesError } = await supabase.from('push_device').select('token, user_id');
	if (devicesError) throw devicesError;
	if (!devices || devices.length === 0) return 0;

	const tokensByUser = new Map<string, string[]>();
	for (const device of devices) {
		tokensByUser.set(device.user_id, [...(tokensByUser.get(device.user_id) ?? []), device.token]);
	}

	const { data: learners, error: learnersError } = await supabase
		.from('user')
		.select(
			'id, current_streak, longest_streak, streak_freezes, last_activity_date, onboarding_completed_at, timezone, push_sent_at, target_dialect, proficiency_level'
		)
		.in('id', [...tokensByUser.keys()]);
	if (learnersError) throw learnersError;

	const messages: PushMessage[] = [];
	const kindByToken = new Map<string, { userId: string; kind: PushKind }>();

	for (const learner of (learners ?? []) as Learner[]) {
		const kind = pickPush(learner, now);
		if (!kind) continue;

		let dueWords = 0;
		if (kind === 'reviews') {
			dueWords = await dueWordCount(learner.id, now);
			if (dueWords < REVIEWS_MIN) continue;
		}

		for (const token of tokensByUser.get(learner.id) ?? []) {
			messages.push({ token, ...copy(kind, learner, dueWords) });
			kindByToken.set(token, { userId: learner.id, kind });
		}
	}

	const results = await sendPushes(messages);

	const gone = results.filter((r) => r.gone).map((r) => r.token);
	if (gone.length > 0) await supabase.from('push_device').delete().in('token', gone);

	const reached = new Map<string, PushKind>();
	for (const result of results) {
		const sent = kindByToken.get(result.token);
		if (result.ok && sent) reached.set(sent.userId, sent.kind);
	}

	await Promise.all(
		[...reached].map(([userId, kind]) =>
			supabase
				.from('user')
				.update(kind === 'streak' ? { push_sent_at: now, streak_reminder_sent_at: now } : { push_sent_at: now })
				.eq('id', userId)
		)
	);

	return reached.size;
}
