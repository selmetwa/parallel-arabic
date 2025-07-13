import { db } from './db';

export async function linkGoogleToExistingAccount(googleId: string, email: string) {
	const existingUser = await db
		.selectFrom('user')
		.selectAll()
		.where('email', '=', email)
		.executeTakeFirst();

	if (existingUser) {
		await db
			.updateTable('user')
			.set({
				google_id: googleId,
				auth_provider: 'both'
			})
			.where('id', '=', existingUser.id)
			.execute();
		return existingUser;
	}
	return null;
}