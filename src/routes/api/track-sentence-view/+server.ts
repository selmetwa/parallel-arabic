import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { trackActivitySimple } from '$lib/helpers/track-activity';

export const POST: RequestHandler = async ({ request, locals }) => {
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const { count = 1 } = await request.json().catch(() => ({}));

  // Track sentence view activity (non-blocking)
  const result = await trackActivitySimple(userId, 'sentence', count);

  if (!result.success) {
    console.error('Error tracking sentence view:', result.error);
    // Don't fail the request if tracking fails
  }

  return json({ success: true });
};

