import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { env } from '$env/dynamic/private';
import { ADMIN_ID } from '$env/static/private';

// Centralized Mailgun client - only accessible by admin
let mailgunClient: ReturnType<InstanceType<typeof Mailgun>['client']> | null = null;

export function getMailgunClient() {
  if (!mailgunClient) {
    const mailgun = new Mailgun(FormData);
    mailgunClient = mailgun.client({
      username: 'api',
      key: env.MAILGUN_KEY || '',
      url: env.MAILGUN_BASE_URL || 'https://api.mailgun.net',
    });
  }
  return mailgunClient;
}

const MAILGUN_DOMAIN = 'parallel-arabic.com';
const FROM_EMAIL = 'Sherif from Parallel Arabic <postmaster@parallel-arabic.com>';

// Admin verification helper
export async function verifyAdmin(userId: string | null | undefined): Promise<boolean> {
  if (!userId || !ADMIN_ID) {
    return false;
  }
  return ADMIN_ID === userId;
}

async function sendPasswordResetEmail(resetUrl: string, email: string) {
  const mg = getMailgunClient();
  const data = await mg.messages.create(MAILGUN_DOMAIN, {
    from: FROM_EMAIL,
    to: [email],
    subject: 'Parallel Arabic - Password Reset Request',
    text: `
Hey! Its Sherif from Parallel Arabic.
I received a request to reset your password.
If you did not request a password reset, please ignore this email.
Click this link to reset your password: ${resetUrl}
    `.trim(),
    html: `
<p>Hey! Its Sherif from Parallel Arabic.</p>
<p>I received a request to reset your password.</p>
<p>If you did not request a password reset, please ignore this email.</p>
<p>Click <a href="${resetUrl}">this link</a> to reset your password.</p>
    `.trim(),
  });

  return data;
}

export const isValidEmail = (maybeEmail: unknown): maybeEmail is string => {
	if (typeof maybeEmail !== 'string') return false;
	if (maybeEmail.length > 255) return false;
	const emailRegexp = /^.+@.+$/; // [one or more character]@[one or more character]
	return emailRegexp.test(maybeEmail);
};

// Generic email sending function for admin email sender
export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string
) => {
  const mg = getMailgunClient();
  console.log({ mg })

  const data = await mg.messages.create(MAILGUN_DOMAIN, {
    from: FROM_EMAIL,
    to: [to],
    subject,
    text,
    html: html || text.replace(/\n/g, '<br>'),
  });

  console.log({ data })
  return data;
};

export const sendPasswordResetLink = async (token: string, _email: string, userId?: string | null) => {
	// Require admin access
	// if (!await verifyAdmin(userId)) {
	// 	throw new Error('Unauthorized: Admin access required to send emails');
	// }

	const url = `https://parallel-arabic.com/password-reset/token=${token}`;
	const result = await sendPasswordResetEmail(url, _email);
	return result;
};

export const sendStreakReminderEmail = async (email: string, streakCount: number, userId: string) => {
	const siteUrl = 'https://parallel-arabic.com';
	const profileUrl = `${siteUrl}/profile`;

	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Don't lose your streak!</title>
		</head>
		<body style="font-family: 'ReadexPro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #001a33; background-color: #b8c4d0; margin: 0; padding: 0;">
			<table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #b8c4d0; padding: 20px;">
				<tr>
					<td align="center" style="padding: 20px 0;">
						<table role="presentation" style="max-width: 600px; width: 100%; background-color: #a8b8c8; border: 2px solid #8898a8; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
							<!-- Header -->
							<tr>
								<td style="background-color: #98a8b8; border-bottom: 2px solid #8898a8; padding: 30px; text-align: center;">
									<h1 style="color: #001a33; margin: 0; font-size: 28px; font-weight: bold;">🔥 ${streakCount}-Day Streak at Risk!</h1>
								</td>
							</tr>

							<!-- Main Content -->
							<tr>
								<td style="padding: 30px; background-color: #a8b8c8;">
									<p style="font-size: 16px; color: #001a33; margin-bottom: 20px; line-height: 1.6;">
										You've built an impressive <strong>${streakCount}-day streak</strong> on Parallel Arabic — don't let it slip away today!
									</p>
									<p style="font-size: 16px; color: #001a33; margin-bottom: 20px; line-height: 1.6;">
										Just a few minutes of practice is all it takes to keep your streak alive and continue your Arabic learning journey.
									</p>

									<!-- CTA Button -->
									<table role="presentation" style="width: 100%; margin-top: 30px;">
										<tr>
											<td align="center" style="padding: 0;">
												<a href="${siteUrl}/lessons" style="display: inline-block; background-color: #98a8b8; color: #001a33; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; border: 2px solid #8898a8;">
													Continue Learning →
												</a>
											</td>
										</tr>
									</table>

									<!-- Footer -->
									<table role="presentation" style="width: 100%; margin-top: 30px; padding-top: 20px; border-top: 1px solid #8898a8;">
										<tr>
											<td align="center" style="color: #4d5c66; font-size: 14px; line-height: 1.6;">
												<p style="margin: 5px 0;">Happy learning,<br><strong style="color: #001a33;">Sherif</strong><br>Founder, Parallel Arabic</p>
												<p style="margin: 15px 0 5px 0; font-size: 12px;">
													<a href="${profileUrl}" style="color: #4d5c66;">Manage notification settings</a>
												</p>
											</td>
										</tr>
									</table>
								</td>
							</tr>
						</table>
					</td>
				</tr>
			</table>
		</body>
		</html>
	`;

	const text = `
Don't lose your ${streakCount}-day streak!

You've built an impressive ${streakCount}-day streak on Parallel Arabic — don't let it slip away today!

Just a few minutes of practice is all it takes to keep your streak alive and continue your Arabic learning journey.

Continue Learning: ${siteUrl}/lessons

Happy learning,
Sherif
Founder, Parallel Arabic

---
To manage notification settings, visit: ${profileUrl}
	`.trim();

	try {
		const mg = getMailgunClient();
		const data = await mg.messages.create(MAILGUN_DOMAIN, {
			from: FROM_EMAIL,
			to: [email],
			subject: `Don't lose your ${streakCount}-day streak! 🔥`,
			text,
			html,
		});

		return data;
	} catch (error) {
		console.error('Error sending streak reminder email:', error);
		throw error;
	}
};


export const sendWelcomeEmail = async (email: string, userId?: string | null) => {
	// Require admin access
	// if (!await verifyAdmin(userId)) {
	// 	throw new Error('Unauthorized: Admin access required to send emails');
	// }
	
	const text = `
I'm Sherif, the founder of Parallel Arabic.

I'm a first-time founder, so having you as a member means a lot!

If you have ideas for new features, anything that can be improved, or just want to share your thoughts I would love to hear from you.

You can:
 - Email me directly at selmetwa@gmail.com
 - Text me at 917-494-4802

I look forward to hearing from you, and hope you enjoy Parallel Arabic.

Cheers,
Sherif
	`.trim();

	const html = text
		.split('\n\n')
		.map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
		.join('\n');

	
	try {
		const mg = getMailgunClient();
		const data = await mg.messages.create(MAILGUN_DOMAIN, {
			from: FROM_EMAIL,
			to: [email],
			subject: 'Welcome to Parallel Arabic!',
			text: text,
			html: html,
		});

		return data;
	} catch (error) {
		console.error('Error sending welcome email:', error);
		throw error;
	}
};

export const sendOnboardingNudgeEmail = async (
	email: string,
	userId: string,
	day: 1 | 3,
	ctaUrl: string
) => {
	const siteUrl = 'https://parallel-arabic.com';
	const profileUrl = `${siteUrl}/profile`;
	const fullCtaUrl = `${siteUrl}${ctaUrl}`;

	const subject = day === 1
		? 'Your Arabic lessons are waiting for you 👋'
		: "Still want to learn Arabic? Let's pick up where you left off 🌱";

	const headerEmoji = day === 1 ? '👋' : '🌱';
	const headerTitle = day === 1 ? 'Ready when you are!' : "Don't let your Arabic goals slip away";

	const bodyCopy = day === 1
		? "You set up your Parallel Arabic profile yesterday but haven't started your first lesson yet. Jump back in — it only takes a couple of minutes to get going."
		: "It's been a few days since you set up your Parallel Arabic account. Whatever got in the way, your personalized lessons are still right where you left them.";

	const ctaLabel = day === 1 ? 'Start Your First Lesson →' : 'Jump Back In →';

	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>${subject}</title>
		</head>
		<body style="font-family: 'ReadexPro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #001a33; background-color: #b8c4d0; margin: 0; padding: 0;">
			<table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #b8c4d0; padding: 20px;">
				<tr>
					<td align="center" style="padding: 20px 0;">
						<table role="presentation" style="max-width: 600px; width: 100%; background-color: #a8b8c8; border: 2px solid #8898a8; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
							<!-- Header -->
							<tr>
								<td style="background-color: #98a8b8; border-bottom: 2px solid #8898a8; padding: 30px; text-align: center;">
									<h1 style="color: #001a33; margin: 0; font-size: 28px; font-weight: bold;">${headerEmoji} ${headerTitle}</h1>
								</td>
							</tr>

							<!-- Main Content -->
							<tr>
								<td style="padding: 30px; background-color: #a8b8c8;">
									<p style="font-size: 16px; color: #001a33; margin-bottom: 20px; line-height: 1.6;">
										${bodyCopy}
									</p>

									<!-- CTA Button -->
									<table role="presentation" style="width: 100%; margin-top: 30px;">
										<tr>
											<td align="center" style="padding: 0;">
												<a href="${fullCtaUrl}" style="display: inline-block; background-color: #98a8b8; color: #001a33; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; border: 2px solid #8898a8;">
													${ctaLabel}
												</a>
											</td>
										</tr>
									</table>

									<!-- Footer -->
									<table role="presentation" style="width: 100%; margin-top: 30px; padding-top: 20px; border-top: 1px solid #8898a8;">
										<tr>
											<td align="center" style="color: #4d5c66; font-size: 14px; line-height: 1.6;">
												<p style="margin: 5px 0;">Happy learning,<br><strong style="color: #001a33;">Sherif</strong><br>Founder, Parallel Arabic</p>
												<p style="margin: 15px 0 5px 0; font-size: 12px;">
													<a href="${profileUrl}" style="color: #4d5c66;">Manage notification settings</a>
												</p>
											</td>
										</tr>
									</table>
								</td>
							</tr>
						</table>
					</td>
				</tr>
			</table>
		</body>
		</html>
	`;

	const text = `
${headerTitle}

${bodyCopy}

${ctaLabel.replace(' →', '')}: ${fullCtaUrl}

Happy learning,
Sherif
Founder, Parallel Arabic

---
To manage notification settings, visit: ${profileUrl}
	`.trim();

	try {
		const mg = getMailgunClient();
		const data = await mg.messages.create(MAILGUN_DOMAIN, {
			from: FROM_EMAIL,
			to: [email],
			subject,
			text,
			html,
		});

		return data;
	} catch (error) {
		console.error(`Error sending day-${day} onboarding nudge email to user ${userId}:`, error);
		throw error;
	}
};
