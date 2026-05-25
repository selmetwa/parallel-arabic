import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

// The session itself is persisted at generation time by /api/generate-self-study.
// This endpoint just updates the score after the learner completes the run.
// If sessionId is missing (older flow / persistence failed at generation),
// we fall back to a full insert so the session is still saved.
export const POST: RequestHandler = async ({ request, locals }) => {
    // @ts-expect-error - safeGetSession exists on locals at runtime
    const { user } = await locals.safeGetSession();

    if (!user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, selfStudySession, scorePercent } = await request.json();
    const normalizedScore = typeof scorePercent === 'number' ? Math.round(scorePercent) : null;

    if (sessionId) {
        const { error: updateError } = await supabase
            .from('self_study_sessions')
            .update({ score_percent: normalizedScore })
            .eq('id', sessionId)
            .eq('user_id', user.id);

        if (updateError) {
            console.error('[save-self-study-session] Update failed:', updateError);
            return json({ error: 'Failed to update session score', details: updateError.message }, { status: 500 });
        }

        return json({ success: true, id: sessionId });
    }

    // Fallback: persist from scratch.
    if (!selfStudySession) {
        return json({ error: 'sessionId or selfStudySession is required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const fileName = `${id}.json`;

    const { error: storageError } = await supabase.storage
        .from('generated_self_study')
        .upload(fileName, JSON.stringify(selfStudySession), {
            contentType: 'application/json',
            upsert: true
        });

    if (storageError) {
        console.error('[save-self-study-session] Storage upload failed:', storageError);
        return json({ error: 'Failed to upload session data', details: storageError.message }, { status: 500 });
    }

    const { error: dbError } = await supabase.from('self_study_sessions').insert({
        id,
        user_id: user.id,
        title: selfStudySession.title,
        dialect: selfStudySession.dialect,
        level: selfStudySession.level ?? 'intermediate',
        vocab_count: selfStudySession.vocabulary?.length ?? 0,
        step_count: selfStudySession.steps?.length ?? 0,
        score_percent: normalizedScore,
        session_data_key: fileName,
        created_at: Date.now()
    });

    if (dbError) {
        console.error('[save-self-study-session] DB error:', dbError);
        return json({ error: 'Failed to save session record', details: dbError.message }, { status: 500 });
    }

    return json({ success: true, id });
};
