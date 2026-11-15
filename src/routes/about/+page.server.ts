import type { PageServerLoad } from './$types';
import { getSocialProof } from '$lib/server/social-proof';

export const load: PageServerLoad = async () => {
	const { learners } = await getSocialProof();
	return { learners };
};
