import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from "@google/genai";
import { normalizeArabicText } from '$lib/utils/arabic-normalization';
import { completeWordWithGemini, normalizeDialect } from '../_helpers';

const BATCH_SIZE = 5;

export const POST: RequestHandler = async ({ request, locals }) => {
  // @ts-expect-error - auth property exists at runtime
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const apiKey = env['GEMINI_API_KEY'];

  if (!apiKey) {
    return error(500, { message: 'GEMINI_API_KEY is not configured' });
  }

  try {
    const { job_id } = await request.json();

    if (!job_id) {
      return json({ error: 'job_id is required' }, { status: 400 });
    }

    // Verify user owns this job
    const { data: job, error: jobError } = await supabase
      .from('word_import_job')
      .select('*')
      .eq('id', job_id)
      .eq('user_id', userId)
      .single();

    if (jobError || !job) {
      return json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status === 'completed') {
      return json({
        processed: 0,
        remaining: 0,
        imported_so_far: job.imported_count,
        skipped_so_far: job.skipped_count,
        failed_so_far: job.failed_count,
        status: 'completed'
      });
    }

    // Fetch next batch of pending items
    const { data: pendingItems, error: fetchError } = await supabase
      .from('word_import_item')
      .select('*')
      .eq('job_id', job_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error('Error fetching pending items:', fetchError);
      return json({ error: 'Failed to fetch pending items' }, { status: 500 });
    }

    if (!pendingItems || pendingItems.length === 0) {
      // No more pending items -- mark job complete
      await supabase
        .from('word_import_job')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', job_id);

      return json({
        processed: 0,
        remaining: 0,
        imported_so_far: job.imported_count,
        skipped_so_far: job.skipped_count,
        failed_so_far: job.failed_count,
        status: 'completed'
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const jobDialect = job.dialect;

    // Load existing saved words for this user to check duplicates
    // We only check the specific arabic words in this batch after Gemini completion,
    // but we also need to handle words added by earlier batches in this job.
    // Query all user's saved_word arabic_words for duplicate detection.
    const { data: existingSavedWords } = await supabase
      .from('saved_word')
      .select('arabic_word')
      .eq('user_id', userId);

    const existingSet = new Set(
      (existingSavedWords || []).map(w => normalizeArabicText(w.arabic_word))
    );

    let batchImported = 0;
    let batchSkipped = 0;
    let batchFailed = 0;

    for (const item of pendingItems) {
      const rowData = item.row_data as Record<string, string>;

      try {
        const rowWithDialect = { ...rowData };
        if (!rowData.dialect) {
          rowWithDialect.dialect = jobDialect;
        }

        const completed = await completeWordWithGemini(rowWithDialect, ai, jobDialect);

        if (!completed.arabic || !completed.english) {
          // Mark as failed -- Gemini couldn't complete the word
          await supabase
            .from('word_import_item')
            .update({ status: 'failed', error_message: 'Could not complete word data' })
            .eq('id', item.id);
          batchFailed++;
          continue;
        }

        const normalizedArabic = normalizeArabicText(completed.arabic);

        if (existingSet.has(normalizedArabic)) {
          await supabase
            .from('word_import_item')
            .update({ status: 'skipped' })
            .eq('id', item.id);
          batchSkipped++;
          continue;
        }

        // Insert into saved_word
        const { error: insertError } = await supabase
          .from('saved_word')
          .insert({
            id: uuidv4(),
            user_id: userId,
            arabic_word: normalizedArabic,
            english_word: completed.english.trim(),
            transliterated_word: completed.transliteration.trim(),
            dialect: completed.dialect,
            ease_factor: 2.5,
            interval_days: 0,
            repetitions: 0,
            is_learning: true,
            mastery_level: 0,
            created_at: Date.now()
          });

        if (insertError) {
          console.error('Error inserting saved word:', insertError);
          await supabase
            .from('word_import_item')
            .update({ status: 'failed', error_message: insertError.message })
            .eq('id', item.id);
          batchFailed++;
          continue;
        }

        // Track in the local set so later items in the same batch don't duplicate
        existingSet.add(normalizedArabic);

        await supabase
          .from('word_import_item')
          .update({ status: 'completed' })
          .eq('id', item.id);
        batchImported++;
      } catch (err) {
        console.error('Error processing import item:', err);
        await supabase
          .from('word_import_item')
          .update({
            status: 'failed',
            error_message: err instanceof Error ? err.message : 'Unknown error'
          })
          .eq('id', item.id);
        batchFailed++;
      }
    }

    // Update job counters
    const newProcessed = job.processed_count + pendingItems.length;
    const newImported = job.imported_count + batchImported;
    const newSkipped = job.skipped_count + batchSkipped;
    const newFailed = job.failed_count + batchFailed;
    const remaining = job.total_items - newProcessed;
    const isComplete = remaining <= 0;

    await supabase
      .from('word_import_job')
      .update({
        processed_count: newProcessed,
        imported_count: newImported,
        skipped_count: newSkipped,
        failed_count: newFailed,
        status: isComplete ? 'completed' : 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', job_id);

    return json({
      processed: pendingItems.length,
      remaining: Math.max(0, remaining),
      imported_so_far: newImported,
      skipped_so_far: newSkipped,
      failed_so_far: newFailed,
      status: isComplete ? 'completed' : 'processing'
    });
  } catch (err) {
    console.error('Error in process-batch endpoint:', err);
    return json({
      error: err instanceof Error ? err.message : 'Failed to process batch'
    }, { status: 500 });
  }
};
