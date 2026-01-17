import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { trackActivitySimple } from '$lib/helpers/track-activity';

export const POST: RequestHandler = async ({ request, locals }) => {
  // @ts-expect-error - auth property exists on locals at runtime
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const { count = 1 } = await request.json().catch(() => ({}));

  // Track short view activity (non-blocking)
  const result = await trackActivitySimple(userId, 'short', count);

  if (!result.success) {
    console.error('Error tracking short view:', result.error);
    // Don't fail the request if tracking fails
  }

  return json({ success: true });
};

