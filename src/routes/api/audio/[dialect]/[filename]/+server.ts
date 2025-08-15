import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

// Helper function to get the base data directory
function getDataDirectory(): string {
  return '/data';
  // return 'data' // for local development
}

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { dialect, filename } = params;

		if (!dialect || !filename) {
			return error(400, { message: 'Dialect and filename are required' });
		}

		// Validate filename to prevent directory traversal attacks
		if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
			return error(400, { message: 'Invalid filename' });
		}

		// Validate dialect to prevent directory traversal attacks
		if (dialect.includes('..') || dialect.includes('/') || dialect.includes('\\')) {
			return error(400, { message: 'Invalid dialect' });
		}

		// Only allow .mp3 files for now
		if (!filename.endsWith('.mp3')) {
			return error(400, { message: 'Only MP3 files are supported' });
		}

		const dataDir = getDataDirectory();
		const filePath = path.join(dataDir, 'audio', dialect, filename);

		// Check if file exists
		if (!fs.existsSync(filePath)) {
			return error(404, { message: 'Audio file not found' });
		}

		// Read the file
		const audioBuffer = fs.readFileSync(filePath);

		// Return the audio file with proper headers
		return new Response(audioBuffer, {
			headers: {
				'Content-Type': 'audio/mpeg',
				'Content-Length': audioBuffer.length.toString(),
				'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
				'Content-Disposition': `inline; filename="${filename}"`
			}
		});

	} catch (err) {
		console.error('Error serving audio file:', err);
		return error(500, { message: 'Failed to serve audio file' });
	}
}; 