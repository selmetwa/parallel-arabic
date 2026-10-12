/**
 * Sends push notifications to the iOS app through Apple (APNs).
 *
 * Needs three env vars, from an APNs auth key made in the Apple Developer
 * portal (Certificates, IDs & Profiles → Keys):
 *   APNS_KEY      the contents of the .p8 file
 *   APNS_KEY_ID   the key's 10-character ID
 *   APNS_SANDBOX  "true" only when testing a build run from Xcode; TestFlight
 *                 and App Store builds use production
 */
import http2 from 'node:http2';
import { sign } from 'node:crypto';
import { env } from '$env/dynamic/private';

const TEAM_ID = 'KY47LR49D8';
const BUNDLE_ID = 'com.parallelarabic.app';
/** A reminder for tonight is no use tomorrow: Apple drops it if the phone stays offline this long. */
const EXPIRES_AFTER_S = 6 * 60 * 60;

export interface PushMessage {
	token: string;
	title: string;
	body: string;
	/** Where tapping the notification lands, as a site path. */
	url: string;
}

export interface PushResult {
	token: string;
	ok: boolean;
	/** The token is dead (app deleted, or notifications revoked): stop using it. */
	gone: boolean;
}

export function apnsConfigured(): boolean {
	return !!(env.APNS_KEY && env.APNS_KEY_ID);
}

function providerToken(): string {
	const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
	const unsigned = `${encode({ alg: 'ES256', kid: env.APNS_KEY_ID })}.${encode({
		iss: TEAM_ID,
		iat: Math.floor(Date.now() / 1000)
	})}`;
	// Env vars often hold the key's line breaks as a literal "\n".
	const key = (env.APNS_KEY ?? '').replace(/\\n/g, '\n');
	const signature = sign('sha256', new TextEncoder().encode(unsigned), { key, dsaEncoding: 'ieee-p1363' });
	return `${unsigned}.${signature.toString('base64url')}`;
}

export async function sendPushes(messages: PushMessage[]): Promise<PushResult[]> {
	if (messages.length === 0) return [];

	const host = env.APNS_SANDBOX === 'true' ? 'api.sandbox.push.apple.com' : 'api.push.apple.com';
	const session = http2.connect(`https://${host}`);
	// Without a listener a connection error would crash the process; each request still fails on its own.
	session.on('error', () => {});

	const authorization = `bearer ${providerToken()}`;
	const expiration = String(Math.floor(Date.now() / 1000) + EXPIRES_AFTER_S);

	const send = (message: PushMessage) =>
		new Promise<PushResult>((resolve) => {
			const request = session.request({
				':method': 'POST',
				':path': `/3/device/${message.token}`,
				authorization,
				'apns-topic': BUNDLE_ID,
				'apns-push-type': 'alert',
				'apns-expiration': expiration
			});

			let status = 0;
			let responseBody = '';
			request.on('response', (headers) => (status = Number(headers[':status'])));
			request.on('data', (chunk) => (responseBody += chunk));
			request.on('error', (err) => {
				console.error('APNs request failed:', err);
				resolve({ token: message.token, ok: false, gone: false });
			});
			request.on('end', () => {
				if (status === 200) return resolve({ token: message.token, ok: true, gone: false });
				console.error(`APNs rejected a push (${status}):`, responseBody);
				const gone = status === 410 || responseBody.includes('BadDeviceToken');
				resolve({ token: message.token, ok: false, gone });
			});

			request.end(
				JSON.stringify({
					aps: { alert: { title: message.title, body: message.body }, sound: 'default' },
					url: message.url
				})
			);
		});

	try {
		return await Promise.all(messages.map(send));
	} finally {
		session.close();
	}
}
