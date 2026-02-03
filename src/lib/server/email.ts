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

export const sendWelcomeEmail = async (email: string, userId?: string | null) => {
	// Require admin access
	// if (!await verifyAdmin(userId)) {
	// 	throw new Error('Unauthorized: Admin access required to send emails');
	// }
	
	const siteUrl = 'https://parallel-arabic.com';
	
	// Color values matching the site's design system (tile and text colors)
	// tile-300: hsl(200 20% 75%) ≈ #b8c4d0
	// tile-400: hsl(200 20% 70%) ≈ #a8b8c8  
	// tile-500: hsl(200 20% 65%) ≈ #98a8b8
	// tile-600: hsl(200 20% 60%) ≈ #8898a8
	// text-300: hsl(200 100% 10%) ≈ #001a33
	// text-200: hsl(200 30% 30%) ≈ #4d5c66
	
	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Welcome to Parallel Arabic!</title>
		</head>
		<body style="font-family: 'ReadexPro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #001a33; background-color: #b8c4d0; margin: 0; padding: 0;">
			<table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #b8c4d0; padding: 20px;">
				<tr>
					<td align="center" style="padding: 20px 0;">
						<table role="presentation" style="max-width: 600px; width: 100%; background-color: #a8b8c8; border: 2px solid #8898a8; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
							<!-- Header -->
							<tr>
								<td style="background-color: #98a8b8; border-bottom: 2px solid #8898a8; padding: 30px; text-align: center;">
									<h1 style="color: #001a33; margin: 0; font-size: 28px; font-weight: bold;">🎉 Welcome to Parallel Arabic!</h1>
								</td>
							</tr>
							
							<!-- Main Content -->
							<tr>
								<td style="padding: 30px; background-color: #a8b8c8;">
									<p style="font-size: 16px; color: #001a33; margin-bottom: 20px; line-height: 1.6;">
										Thank you for joining Parallel Arabic! We're excited to help you on your journey to mastering Arabic dialects.
									</p>
									
									<!-- CTA Button -->
									<table role="presentation" style="width: 100%; margin-top: 30px;">
										<tr>
											<td align="center" style="padding: 0;">
												<a href="${siteUrl}/lessons" style="display: inline-block; background-color: #98a8b8; color: #001a33; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; border: 2px solid #8898a8;">
													Start Learning Now →
												</a>
											</td>
										</tr>
									</table>
									
									<!-- Footer -->
									<table role="presentation" style="width: 100%; margin-top: 30px; padding-top: 20px; border-top: 1px solid #8898a8;">
										<tr>
											<td align="center" style="color: #4d5c66; font-size: 14px; line-height: 1.6;">
												<p style="margin: 5px 0;">Questions? Just reply to this email - I'd love to hear from you!</p>
												<p style="margin: 5px 0;">Happy learning,<br><strong style="color: #001a33;">Sherif</strong><br>Founder, Parallel Arabic</p>
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
Welcome to Parallel Arabic!

Thank you for joining Parallel Arabic! We're excited to help you on your journey to mastering Arabic dialects.

FREE FEATURES:
- Stories & Conversations: Access to one conversation with native audio
- AI Practice: 5 AI-generated practice sentences across multiple dialects
- Speaking Practice: Basic pronunciation feedback
- Verb Conjugation: Practice with one verb
- Vocabulary: Access to 156 words for writing and quizzes
- Alphabet: Complete Arabic alphabet learning with native pronunciation
- Wordbank: Save keywords and phrases to your personal collection

UNLOCK PREMIUM FEATURES:
Upgrade to Premium for just $10/month and get:
- Structured Lessons: Comprehensive learning paths for all dialects
- Multiple Dialects: Egyptian, Levantine, Moroccan & Fusha
- AI Tutor: Real-time conversation practice with feedback
- Spaced Repetition: Master 20,000+ vocabulary words
- Interactive Videos: YouTube videos with transcripts & translations
- All Stories: Unlimited conversations with native audio
- Unlimited AI Practice: Generate unlimited practice sentences
- Advanced Speaking: Real-time pronunciation feedback
- All Verbs: Complete verb conjugation practice
- Anki Decks: Custom flashcard exports

Start Learning: ${siteUrl}/lessons
View Pricing: ${siteUrl}/pricing

Questions? Just reply to this email - I'd love to hear from you!

Happy learning,
Sherif
Founder, Parallel Arabic
	`;
	
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
