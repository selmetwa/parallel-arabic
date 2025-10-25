import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { supabase } from '$lib/supabaseClient';
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

  const userId = session && session.user?.id || null;
  
  if (ADMIN_ID !== userId) {
    throw redirect(302, '/')
  }

  // Get all users with basic info
  const { data: users, error } = await supabase
    .from('user')
    .select('id, email, is_subscriber');

  if (error) {
    console.error('Error fetching users:', error);
    throw redirect(302, '/');
  }

  const userList = users || [];
  const userCount = userList.length;
  const subscriberCount = userList.filter(u => u.is_subscriber).length;

	return {
    users: userList,
    userCount,
    subscriberCount
	};
};

export const actions: Actions = {
  sendEmail: async ({ request, locals }) => {
    const session = await locals.auth.validate();

    if (!session?.sessionId) {
      throw redirect(302, '/login');
    }

    const userId = session && session.user.id || null;
    
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
        const { data: users, error } = await supabase
          .from('user')
          .select('email');
        if (error) {
          console.error('Error fetching users for email:', error);
          throw new Error('Failed to fetch users');
        }
        recipients = (users || []).map(u => u.email);
      } else if (recipientType === 'subscribers') {
        const { data: subscribers, error } = await supabase
          .from('user')
          .select('email')
          .eq('is_subscriber', true);
        if (error) {
          console.error('Error fetching subscribers for email:', error);
          throw new Error('Failed to fetch subscribers');
        }
        recipients = (subscribers || []).map(u => u.email);
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
