import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import {
  isStructuredCSV,
  parseCSV,
  parseUnstructuredText,
  normalizeDialect
} from './_helpers';

export const POST: RequestHandler = async ({ request, locals }) => {
  // @ts-expect-error - auth property exists at runtime
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userDialect = formData.get('dialect') as string;

    if (!file) {
      return json({ error: 'No file provided' }, { status: 400 });
    }

    if (!userDialect) {
      return json({ error: 'Dialect is required' }, { status: 400 });
    }

    const normalizedUserDialect = normalizeDialect(userDialect);
    const fileText = await file.text();
    const isStructured = isStructuredCSV(fileText);

    let rows: Array<Record<string, string>> = [];
    if (isStructured) {
      rows = parseCSV(fileText);
    } else {
      rows = parseUnstructuredText(fileText);
    }

    if (rows.length === 0) {
      const msg = isStructured
        ? 'No valid rows found in CSV file'
        : 'No lines with Arabic text found. Please ensure your text file contains Arabic characters.';
      return json({ error: msg }, { status: 400 });
    }

    // Attach dialect to each row if not already present
    const rowsWithDialect = rows.map(row => ({
      ...row,
      dialect: row.dialect || normalizedUserDialect
    }));

    // Create the import job
    const { data: job, error: jobError } = await supabase
      .from('word_import_job')
      .insert({
        user_id: userId,
        status: 'pending',
        dialect: normalizedUserDialect,
        file_name: file.name,
        total_items: rowsWithDialect.length
      })
      .select('id')
      .single();

    if (jobError || !job) {
      console.error('Error creating import job:', jobError);
      return json({ error: 'Failed to create import job' }, { status: 500 });
    }

    // Bulk-insert all parsed rows as import items
    const items = rowsWithDialect.map(row => ({
      job_id: job.id,
      status: 'pending',
      row_data: row
    }));

    // Supabase has a row limit per insert; chunk into batches of 500
    const CHUNK_SIZE = 500;
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      const { error: itemError } = await supabase
        .from('word_import_item')
        .insert(chunk);

      if (itemError) {
        console.error('Error inserting import items:', itemError);
        // Clean up the job on failure
        await supabase.from('word_import_job').delete().eq('id', job.id);
        return json({ error: 'Failed to save import items' }, { status: 500 });
      }
    }

    // Mark job as processing now that items are ready
    await supabase
      .from('word_import_job')
      .update({ status: 'processing' })
      .eq('id', job.id);

    return json({ job_id: job.id, total: rowsWithDialect.length });
  } catch (err) {
    console.error('Error in import-words-csv endpoint:', err);
    return json({
      error: err instanceof Error ? err.message : 'Failed to process file'
    }, { status: 500 });
  }
};
