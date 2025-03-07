import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

const transporter = nodemailer.createTransport({
  host:env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true, // true for 465, false for other ports
  auth: {
    user:env.SMTP_USER,
    pass:env.SMTP_PASSWORD,
  },
});

async function sendEmail(resetUrl: string, email: string) {
  const info = await transporter.sendMail({
    from:env.SMTP_FROM_EMAIL,
    to: email,
    subject: "Parallel Arabic - Password Reset Request",
    text: `
    Hey! Its Sherif from Parallel Arabic.
    I received a request to reset your password.
    If you did not request a password reset, please ignore this email.
    Click this link to reset your password: ${resetUrl}
    `,
    html: `
    <p>Hey! Its Sherif from Parallel Arabic.</p>
    <p>I received a request to reset your password.</p>
    <p>If you did not request a password reset, please ignore this email.</p>
    <p>Click <a href="${resetUrl}">this link</a> to reset your password.</p>
    `,
  });

  return info;
}

export const isValidEmail = (maybeEmail: unknown): maybeEmail is string => {
	if (typeof maybeEmail !== 'string') return false;
	if (maybeEmail.length > 255) return false;
	const emailRegexp = /^.+@.+$/; // [one or more character]@[one or more character]
	return emailRegexp.test(maybeEmail);
};

export const sendPasswordResetLink = async (token: string, _email: string) => {
	const url = `https://parallel-arabic.com/password-reset/token=${token}`;
  console.log({ url });
	const email = await sendEmail(url, _email);
  console.log({ email });
	return email;
};
