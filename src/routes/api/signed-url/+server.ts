import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';

const ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY;
const AGENT_ID = env.AGENT_ID;

export const GET: RequestHandler = async ({ request }) => {
	try {
		const response = await fetch(
			`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${AGENT_ID}`,
			{
				method: 'GET',
				headers: {
					'xi-api-key':ELEVENLABS_API_KEY
				}
			}
		);

		if (!response.ok) {
			throw new Error('Failed to get signed URL');
		}

		const data = await response.json();
    return json({ signedUrl: data.signed_url });
		// res.json({ signedUrl: data.signed_url });
	} catch (e) {
		// console.error('Error:', error);
		return error(500, { message: 'Failed to get signed URL' });
		// res.status(500).json({ error: 'Failed to get signed URL' });
	}
};
