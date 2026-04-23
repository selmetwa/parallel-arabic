import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { supabase } from '$lib/supabaseClient';
import { ADMIN_ID } from '$env/static/private';
import { sendEmail, sendStreakReminderEmail } from '$lib/server/email';

export const load: PageServerLoad = async ({ locals }) => {
	// @ts-expect-error - auth property exists on locals at runtime
	const session = await locals.auth.validate();

  if (!session) {
    throw redirect(302, '/login');
  }

  const userId = session && session.user?.id || null;
  
  // if (ADMIN_ID !== userId) {
  //   throw redirect(302, '/')
  // }

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
    // @ts-expect-error - auth property exists on locals at runtime
    const session = await locals.auth.validate();

    if (!session?.sessionId) {
      throw redirect(302, '/login');
    }

    const userId = session && session.user.id || null;
    
    // if (ADMIN_ID !== userId) {
    //   throw redirect(302, '/')
    // }

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
        recipients = customEmail
          .split(',')
          .map((e: string) => e.trim())
          .filter((e: string) => e.length > 0);
        if (recipients.length === 0) {
          return { success: false, error: 'No valid email addresses provided' };
        }
      }

      if (recipients.length === 0) {
        return {
          success: false,
          error: 'No recipients found'
        };
      }

      console.log({ recipients })
      // Send emails using Mailgun
      const emailPromises = recipients.map(email =>
        sendEmail(email, subject, message)
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
  },

  sendStreakReminder: async ({ request, locals }) => {
    // @ts-expect-error - auth property exists on locals at runtime
    const session = await locals.auth.validate();

    if (!session?.sessionId) {
      throw redirect(302, '/login');
    }

    const userId = session && session.user.id || null;

    // if (ADMIN_ID !== userId) {
    //   throw redirect(302, '/');
    // }

    const data = await request.formData();
    const email = data.get('streakEmail') as string;
    const streakCount = parseInt(data.get('streakCount') as string, 10);

    if (!email) {
      return { success: false, error: 'Email is required' };
    }
    if (isNaN(streakCount) || streakCount < 1) {
      return { success: false, error: 'Streak count must be a positive number' };
    }

    try {
      await sendStreakReminderEmail(email, streakCount, 'test-user');
      return { success: true, message: `Streak reminder sent to ${email}` };
    } catch (error) {
      console.error('Streak reminder error:', error);
      return { success: false, error: 'Failed to send streak reminder email.' };
    }
  }
};
