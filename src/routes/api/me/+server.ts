import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserContext } from '$lib/server/user-context';

// Used by +layout.ts on prerendered pages, whose layout data was built without a user.
export const GET: RequestHandler = async ({ locals }) => {
  const { user } = locals as { user?: Parameters<typeof getUserContext>[0] | null };
  const headers = { 'Cache-Control': 'private, no-store' };

  if (!user) {
    return json({ error: 'Not logged in' }, { status: 401, headers });
  }

  return json(getUserContext(user), { headers });
};
