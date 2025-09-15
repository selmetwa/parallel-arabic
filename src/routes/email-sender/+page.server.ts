import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { ADMIN_ID } from '$env/static/private';
import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: true,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();

  if (!session) {
    throw redirect(302, '/login');
  }

  const userId = session && session.user.userId || null;
  
  if (ADMIN_ID !== userId) {
    throw redirect(302, '/')
  }

  // Get all users with basic info
  const users = await db
    .selectFrom('user')
    .select(['id', 'email', 'is_subscriber'])
    .execute();

  const userCount = users.length;
  const subscriberCount = users.filter(u => u.is_subscriber).length;

	return {
    users,
    userCount,
    subscriberCount
	};
};

export const actions: Actions = {
  sendEmail: async ({ request, locals }) => {
    const session = await locals.auth.validate();

    if (!session) {
      throw redirect(302, '/login');
    }

    const userId = session && session.user.userId || null;
    
    if (ADMIN_ID !== userId) {
      throw redirect(302, '/')
    }

    const data = await request.formData();
    const recipientType = data.get('recipientType') as string;
    const customEmail = data.get('customEmail') as string;
    const subject = data.get('subject') as string;
    const message = data.get('message') as string;

    if (!subject || !message) {
      return {
        success: false,
        error: 'Subject and message are required'
      };
    }

    try {
      let recipients: string[] = [];

      if (recipientType === 'all') {
        const users = await db
          .selectFrom('user')
          .select(['email'])
          .execute();
        recipients = users.map(u => u.email);
      } else if (recipientType === 'subscribers') {
        const subscribers = await db
          .selectFrom('user')
          .select(['email'])
          .where('is_subscriber', '=', true)
          .execute();
        recipients = subscribers.map(u => u.email);
      } else if (recipientType === 'custom') {
        if (!customEmail) {
          return {
            success: false,
            error: 'Custom email is required when using custom recipient type'
          };
        }
        recipients = [customEmail];
      }

      if (recipients.length === 0) {
        return {
          success: false,
          error: 'No recipients found'
        };
      }

      // Send emails
      const emailPromises = recipients.map(email => 
        transporter.sendMail({
          from: env.SMTP_FROM_EMAIL,
          to: email,
          subject: subject,
          text: message,
          html: message.replace(/\n/g, '<br>'),
        })
      );

      await Promise.all(emailPromises);

      return {
        success: true,
        message: `Email sent successfully to ${recipients.length} recipient(s)`
      };

    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: 'Failed to send email. Please try again.'
      };
    }
  }
};
