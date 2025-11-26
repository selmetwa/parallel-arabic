import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { trackActivitySimple } from '$lib/helpers/track-activity';

export const POST: RequestHandler = async ({ request, locals }) => {
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  // Track story view activity (non-blocking)
  const result = await trackActivitySimple(userId, 'story', 1);

  if (!result.success) {
    console.error('Error tracking story view:', result.error);
    // Don't fail the request if tracking fails
  }

  return json({ success: true });
};

