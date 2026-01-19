import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { getUserHasActiveSubscription } from '$lib/helpers/get-user-has-active-subscription';

export const GET: RequestHandler = async ({ url, locals }) => {
  const dialect = url.searchParams.get('dialect');
  const category = url.searchParams.get('category');

  if (!dialect) {
    return json({ error: 'Dialect is required' }, { status: 400 });
  }

  // Check authentication and subscription for paywalled content
  const { sessionId, user } = await locals?.auth?.validate() || {};

  // For "all" category, require subscription
  if (category === 'all') {
    if (!sessionId || !user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const hasSubscription = await getUserHasActiveSubscription(user.id);
    if (!hasSubscription) {
      return json({ error: 'Subscription required for full deck download' }, { status: 403 });
    }
  }

  try {
    // Build the query
    let query = supabase
      .from('word')
      .select('arabic_word, english_word, transliterated_word, audio_url')
      .eq('dialect', dialect)
      .order('frequency', { ascending: false, nullsFirst: false });

    // Apply category filter if not "all"
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: words, error } = await query;

    if (error) {
      console.error('Error fetching words for Anki export:', error);
      return json({ error: 'Failed to fetch vocabulary' }, { status: 500 });
    }

    if (!words || words.length === 0) {
      return json({ error: 'No words found for this selection' }, { status: 404 });
    }

    // Generate tab-separated text file for Anki import
    // Format: Front (Arabic) \t Back (English + Transliteration + Audio)
    const lines: string[] = [];

    for (const word of words) {
      const front = word.arabic_word;

      // Build the back card with HTML formatting
      let back = `<div style="font-size: 24px; margin-bottom: 10px;"><strong>${escapeHtml(word.english_word)}</strong></div>`;
      back += `<div style="font-size: 16px; color: #666; font-style: italic;">${escapeHtml(word.transliterated_word)}</div>`;

      // Add audio if available
      if (word.audio_url) {
        // Anki uses [sound:filename] syntax, but for URLs we use HTML audio
        back += `<br><audio controls src="${escapeHtml(word.audio_url)}" style="margin-top: 10px;"></audio>`;
      }

      // Tab-separated: front \t back
      lines.push(`${escapeForTsv(front)}\t${escapeForTsv(back)}`);
    }

    const content = lines.join('\n');

    // Return as downloadable text file
    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${dialect}-${category || 'vocabulary'}.txt"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error generating Anki export:', error);
    return json({ error: 'Failed to generate export' }, { status: 500 });
  }
};

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeForTsv(text: string): string {
  if (!text) return '';
  // Replace tabs and newlines to prevent breaking TSV format
  return text
    .replace(/\t/g, ' ')
    .replace(/\n/g, '<br>')
    .replace(/\r/g, '');
}
