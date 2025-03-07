import { generateRandomString, isWithinExpiration } from "lucia/utils";
import { db } from "./db";
const EXPIRES_IN = 1000 * 60 * 60 * 2; // 2 hours

export const generatePasswordResetToken = async (userId: string) => {
	const storedUserTokens = await db
		.selectFrom("password_reset_token")
		.selectAll()
		.where("user_id", "=", userId)
		.execute();
	if (storedUserTokens.length > 0) {
		const reusableStoredToken = storedUserTokens.find((token) => {
			// check if expiration is within 1 hour
			// and reuse the token if true
			return isWithinExpiration(Number(token.expires) - EXPIRES_IN / 2);
		});
		if (reusableStoredToken) return reusableStoredToken.id;
	}
	const token = generateRandomString(63);
	await db
		.insertInto("password_reset_token")
		.values({
			id: token,
			expires: new Date().getTime() + EXPIRES_IN,
			user_id: userId
		})
		.executeTakeFirst();
	return token;
};

export const validatePasswordResetToken = async (email: string, token: string) => {
  const user = await db.selectFrom("user").selectAll().where("email", "=", email).executeTakeFirst();

  if (!user) throw new Error("User not found");
  
	return user.id;
};