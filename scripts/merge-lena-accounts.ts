#!/usr/bin/env node
/**
 * One-off: merge a learner's two accounts (support ticket, 2026-11-01).
 *
 * She signed up with email/password, then later used Sign in with Apple with
 * "Hide My Email", which created a second account on an Apple relay address.
 * The Apple account holds the iOS subscription (RevenueCat app_user_id is its
 * public.user id), so it survives. This script:
 *   1. Retires the email/password account: renames its email and bans it.
 *   2. Puts her real email on the Apple account (confirmed), so "Forgot password"
 *      and email/password login reach the account she pays for.
 * She then sets a password once via "Forgot password".
 *
 * Usage:
 *   vite-node scripts/merge-lena-accounts.ts              (dry run)
 *   vite-node scripts/merge-lena-accounts.ts -- --apply
 *   vite-node scripts/merge-lena-accounts.ts -- --rollback
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const REAL_EMAIL = 'netsitesinc@yahoo.com';
const RETIRED_EMAIL = 'netsitesinc+retired-2026-11-01@yahoo.com';
const RELAY_EMAIL = 'fjgb54cg8c@privaterelay.appleid.com';

const OLD = { authId: '39c65599-0285-4743-8bf3-19e7ee07d182', dbId: '2sqd6x00fdu' };
const APPLE = { authId: '89c319e3-5286-4796-8d0f-a0f361bf510c', dbId: 'nceqo5o97zg' };

const apply = process.argv.includes('--apply');
const rollback = process.argv.includes('--rollback');

const url = process.env.PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function authUser(id: string) {
	const { data, error } = await admin.auth.admin.getUserById(id);
	if (error || !data.user) throw new Error(`auth user ${id}: ${error?.message ?? 'not found'}`);
	return data.user;
}

async function dbUser(id: string) {
	const { data, error } = await admin
		.from('user')
		.select('id, email, supabase_auth_id, is_subscriber')
		.eq('id', id)
		.single();
	if (error || !data) throw new Error(`public.user ${id}: ${error?.message ?? 'not found'}`);
	return data;
}

async function show(label: string) {
	const [oa, aa, od, ad] = await Promise.all([
		authUser(OLD.authId),
		authUser(APPLE.authId),
		dbUser(OLD.dbId),
		dbUser(APPLE.dbId)
	]);
	const providers = (u: typeof oa) => (u.identities ?? []).map((i) => i.provider).join(',');
	console.log(`\n--- ${label} ---`);
	console.log(`old   auth: ${oa.email} [${providers(oa)}] banned_until=${oa.banned_until ?? '-'}`);
	console.log(`old   db:   ${od.email} subscriber=${od.is_subscriber}`);
	console.log(`apple auth: ${aa.email} [${providers(aa)}]`);
	console.log(`apple db:   ${ad.email} subscriber=${ad.is_subscriber}`);
	return { oa, aa, od, ad };
}

async function step(desc: string, fn: () => Promise<{ error: { message: string } | null }>) {
	console.log(`${apply || rollback ? 'RUN ' : 'WOULD'} ${desc}`);
	if (!apply && !rollback) return;
	const { error } = await fn();
	if (error) throw new Error(`${desc}: ${error.message}`);
}

const setDbEmail = (id: string, email: string) => () =>
	admin.from('user').update({ email }).eq('id', id);

const before = await show('before');

if (rollback) {
	await step(`apple auth email -> ${RELAY_EMAIL}`, () =>
		admin.auth.admin.updateUserById(APPLE.authId, { email: RELAY_EMAIL, email_confirm: true })
	);
	await step(`apple db email -> ${RELAY_EMAIL}`, setDbEmail(APPLE.dbId, RELAY_EMAIL));
	await step(`old db email -> ${REAL_EMAIL}`, setDbEmail(OLD.dbId, REAL_EMAIL));
	await step(`old auth email -> ${REAL_EMAIL}, unban`, () =>
		admin.auth.admin.updateUserById(OLD.authId, {
			email: REAL_EMAIL,
			email_confirm: true,
			ban_duration: 'none'
		})
	);
} else {
	// Guard against running on accounts that changed since the investigation.
	if (before.ad.is_subscriber !== true) throw new Error('Apple account is no longer the subscriber; stop');
	if (before.od.is_subscriber) throw new Error('Old account is now a subscriber; stop');
	if (!before.aa.identities?.some((i) => i.provider === 'apple')) throw new Error('Apple identity missing; stop');
	if (before.aa.email === REAL_EMAIL) {
		console.log('\nAlready merged.');
		process.exit(0);
	}

	// Free the email first: auth.users.email and public.user.email are both unique.
	await step(`old auth email -> ${RETIRED_EMAIL}, ban`, () =>
		admin.auth.admin.updateUserById(OLD.authId, {
			email: RETIRED_EMAIL,
			email_confirm: true,
			ban_duration: '876000h'
		})
	);
	await step(`old db email -> ${RETIRED_EMAIL}`, setDbEmail(OLD.dbId, RETIRED_EMAIL));
	await step(`apple auth email -> ${REAL_EMAIL}`, () =>
		admin.auth.admin.updateUserById(APPLE.authId, { email: REAL_EMAIL, email_confirm: true })
	);
	await step(`apple db email -> ${REAL_EMAIL}`, setDbEmail(APPLE.dbId, REAL_EMAIL));
}

if (apply || rollback) await show('after');
