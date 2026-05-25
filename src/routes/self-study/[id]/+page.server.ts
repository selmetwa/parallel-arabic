import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';
import { downloadSelfStudySession } from '$lib/helpers/storage-helpers';
import type { SelfStudySession } from '$lib/schemas/self-study-schema';

export const load: PageServerLoad = async ({ params, parent }) => {
    const { user } = await parent();

    if (!user) {
        throw redirect(302, '/login');
    }

    const { data: row, error: rowError } = await supabase
        .from('self_study_sessions')
        .select('id, user_id, title, dialect, level, score_percent, session_data_key, created_at')
        .eq('id', params.id)
        .single();

    if (rowError || !row) {
        throw error(404, 'Session not found');
    }

    if (row.user_id !== user.id) {
        throw error(403, 'You do not have access to this session');
    }

    const download = await downloadSelfStudySession(row.session_data_key);
    if (!download.success || !download.data) {
        throw error(500, `Failed to load session data: ${download.error ?? 'unknown error'}`);
    }

    const session = download.data as SelfStudySession;
    session.dialect = (session.dialect ?? row.dialect) as SelfStudySession['dialect'];

    return {
        user,
        session,
        sessionId: row.id,
        scorePercent: row.score_percent
    };
};
