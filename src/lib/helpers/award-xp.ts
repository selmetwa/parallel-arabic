import { supabase as defaultSupabase } from '$lib/supabaseClient';
import { getLevelForXp, XP_AWARDS, type XpEventType } from './xp-levels';

function getWeekStart(): number {
	const now = new Date();
	const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
	const day = utc.getUTCDay();
	utc.setUTCDate(utc.getUTCDate() - (day === 0 ? 6 : day - 1));
	return utc.getTime();
}

export type { XpEventType };
export { XP_AWARDS, LEVEL_TIERS, getLevelForXp, getProgressToNextLevel } from './xp-levels';

export interface XpResult {
	success: boolean;
	xpAwarded: number;
	newTotalXp: number;
	newLevel: number;
	previousLevel: number;
	leveledUp: boolean;
	error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function awardXp(userId: string, eventType: XpEventType, client?: any): Promise<XpResult> {
	const supabase = client ?? defaultSupabase;
	try {
		const xpAwarded = XP_AWARDS[eventType];

		const { data: user, error: fetchError } = await supabase
			.from('user')
			.select('total_xp, current_level, xp_this_week, week_start_date')
			.eq('id', userId)
			.single();

		if (fetchError || !user) {
			console.error('Error fetching user for XP award:', fetchError);
			return {
				success: false,
				xpAwarded: 0,
				newTotalXp: 0,
				newLevel: 1,
				previousLevel: 1,
				leveledUp: false,
				error: 'User not found'
			};
		}

		const previousXp = user.total_xp ?? 0;
		const previousLevel = user.current_level ?? 1;
		const newTotalXp = previousXp + xpAwarded;
		const { level: newLevel } = getLevelForXp(newTotalXp);
		const leveledUp = newLevel > previousLevel;

		const weekStart = getWeekStart();
		const isNewWeek = !user.week_start_date || user.week_start_date < weekStart;
		const newXpThisWeek = isNewWeek ? xpAwarded : (user.xp_this_week ?? 0) + xpAwarded;

		const { error: updateError } = await supabase
			.from('user')
			.update({
				total_xp: newTotalXp,
				current_level: newLevel,
				xp_this_week: newXpThisWeek,
				...(isNewWeek ? { week_start_date: weekStart } : {})
			})
			.eq('id', userId);

		if (updateError) {
			console.error('Error updating XP:', updateError);
			return {
				success: false,
				xpAwarded: 0,
				newTotalXp: previousXp,
				newLevel: previousLevel,
				previousLevel,
				leveledUp: false,
				error: updateError.message
			};
		}

		return { success: true, xpAwarded, newTotalXp, newLevel, previousLevel, leveledUp };
	} catch (error) {
		console.error('Error awarding XP:', error);
		return {
			success: false,
			xpAwarded: 0,
			newTotalXp: 0,
			newLevel: 1,
			previousLevel: 1,
			leveledUp: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}
