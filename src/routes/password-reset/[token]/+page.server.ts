// // routes/password-reset/[token]/+page.server.ts
// import { auth } from "$lib/server/lucia";
// import { fail, redirect } from "@sveltejs/kit";
// import { validatePasswordResetToken } from "$lib/server/token";

// import type { Actions } from "./$types";

// export const actions: Actions = {
// 	default: async ({ request, params, locals }) => {
// 		const formData = await request.formData();
// 		const password = formData.get("password");
//     const email = formData.get("email");

// 		// basic check
// 		if (
// 			typeof password !== "string" ||
// 			password.length < 6 ||
// 			password.length > 255
// 		) {
// 			return fail(400, {
// 				message: "Invalid password"
// 			});
// 		}
// 		try {
// 			const { token } = params;
//       console.log({ token });
// 			if (typeof email !== "string") {
// 				throw new Error("Invalid email");
// 			}
// 			const userId = await validatePasswordResetToken(email, token);
//       console.log({ userId });
// 			let user = await auth.getUser(userId);
//       console.log({ user });
// 			await auth.invalidateAllUserSessions(user.userId);
// 			await auth.updateKeyPassword("email", user.email, password);
// 			if (!user.emailVerified) {
// 				user = await auth.updateUserAttributes(user.userId, {
// 					email_verified: Number(true)
// 				});
// 			}
// 			const session = await auth.createSession({
// 				userId: user.userId,
// 				attributes: {}
// 			});
// 			locals.auth.setSession(session);
// 		} catch (e) {
// 			return fail(400, {
// 				message: "Invalid or expired password reset link"
// 			});
// 		}
// 		throw redirect(302, "/");
// 	}
// };