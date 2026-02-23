import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const GET: RequestHandler = async ({ params, locals }) => {
  // @ts-expect-error - auth property exists at runtime
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId } = params;

  if (!jobId) {
    return json({ error: 'jobId is required' }, { status: 400 });
  }

  const { data: job, error: jobError } = await supabase
    .from('word_import_job')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single();

  if (jobError || !job) {
    return json({ error: 'Job not found' }, { status: 404 });
  }

  return json({
    job_id: job.id,
    status: job.status,
    total_items: job.total_items,
    processed_count: job.processed_count,
    imported_count: job.imported_count,
    skipped_count: job.skipped_count,
    failed_count: job.failed_count,
    created_at: job.created_at
  });
};
