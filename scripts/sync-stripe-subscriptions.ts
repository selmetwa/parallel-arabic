#!/usr/bin/env node
/**
 * Sync Stripe Subscription Data to Database
 * 
 * This script fetches all users with subscriber_id from the database,
 * checks their subscription status in Stripe, and updates the database
 * with the correct values.
 * 
 * Usage:
 *   npm run sync:subscriptions
 *   npm run sync:subscriptions -- --dry-run  (preview changes without updating)
 *   npm run sync:subscriptions -- --user-id=<userId>  (sync specific user)
 */

import { Stripe } from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const STRIPE_SECRET = process.env.STRIPE_SECRET;
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!STRIPE_SECRET) {
  console.error('❌ STRIPE_SECRET environment variable is required');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET, {
  apiVersion: '2024-06-20'
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface SyncResult {
  userId: string;
  email: string;
  subscriberId: string;
  status: 'updated' | 'skipped' | 'error' | 'not_found';
  changes: {
    is_subscriber?: { old: boolean; new: boolean };
    subscription_end_date?: { old: number | null; new: number | null };
  };
  error?: string;
}

const activeStatuses = ['active', 'trialing', 'past_due'];

async function syncUserSubscription(
  userId: string,
  subscriberId: string,
  currentData: { is_subscriber: boolean; subscription_end_date: number | null },
  dryRun: boolean
): Promise<SyncResult> {
  try {
    // Fetch subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriberId);

    if (!subscription) {
      return {
        userId,
        subscriberId,
        email: '',
        status: 'not_found',
        changes: {}
      };
    }

    // Determine if subscription is active
    const isActive = activeStatuses.includes(subscription.status) &&
      subscription.current_period_end &&
      subscription.current_period_end > Math.floor(Date.now() / 1000);

    // Get subscription end date (Unix timestamp in seconds)
    const subscriptionEndDate = subscription.current_period_end || null;

    // Check if changes are needed
    const needsUpdate = 
      currentData.is_subscriber !== isActive ||
      currentData.subscription_end_date !== subscriptionEndDate;

    if (!needsUpdate) {
      return {
        userId,
        subscriberId,
        email: '',
        status: 'skipped',
        changes: {}
      };
    }

    // Prepare update data
    const updateData: {
      is_subscriber: boolean;
      subscription_end_date: number | null;
    } = {
      is_subscriber: isActive,
      subscription_end_date: subscriptionEndDate
    };

    if (!dryRun) {
      // Update database
      const { error } = await supabase
        .from('user')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        return {
          userId,
          subscriberId,
          email: '',
          status: 'error',
          changes: {
            is_subscriber: { old: currentData.is_subscriber, new: isActive },
            subscription_end_date: { old: currentData.subscription_end_date, new: subscriptionEndDate }
          },
          error: error.message
        };
      }
    }

    return {
      userId,
      subscriberId,
      email: '',
      status: 'updated',
      changes: {
        is_subscriber: { old: currentData.is_subscriber, new: isActive },
        subscription_end_date: { old: currentData.subscription_end_date, new: subscriptionEndDate }
      }
    };
  } catch (error: any) {
    return {
      userId,
      subscriberId,
      email: '',
      status: 'error',
      changes: {},
      error: error.message || 'Unknown error'
    };
  }
}

async function syncAllSubscriptions(dryRun: boolean = false, specificUserId?: string) {
  console.log('🔄 Starting subscription sync...');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (will update database)'}`);
  console.log('');

  try {
    // Fetch users with subscriber_id
    let query = supabase
      .from('user')
      .select('id, email, subscriber_id, is_subscriber, subscription_end_date')
      .not('subscriber_id', 'is', null);

    if (specificUserId) {
      query = query.eq('id', specificUserId);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('❌ Error fetching users:', error);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log('ℹ️  No users with subscriber_id found');
      return;
    }

    console.log(`📊 Found ${users.length} user(s) with subscriptions`);
    console.log('');

    const results: SyncResult[] = [];
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    let notFound = 0;

    // Process each user
    for (const user of users) {
      if (!user.subscriber_id) continue;

      console.log(`Processing user: ${user.email || user.id} (${user.subscriber_id})`);

      const result = await syncUserSubscription(
        user.id,
        user.subscriber_id,
        {
          is_subscriber: user.is_subscriber || false,
          subscription_end_date: user.subscription_end_date
        },
        dryRun
      );

      result.email = user.email || '';

      // Display changes
      if (result.status === 'updated') {
        console.log('  ✅ Updated:');
        if (result.changes.is_subscriber) {
          console.log(`     is_subscriber: ${result.changes.is_subscriber.old} → ${result.changes.is_subscriber.new}`);
        }
        if (result.changes.subscription_end_date) {
          const oldDate = result.changes.subscription_end_date.old 
            ? new Date(result.changes.subscription_end_date.old * 1000).toISOString()
            : 'null';
          const newDate = result.changes.subscription_end_date.new
            ? new Date(result.changes.subscription_end_date.new * 1000).toISOString()
            : 'null';
          console.log(`     subscription_end_date: ${oldDate} → ${newDate}`);
        }
        updated++;
      } else if (result.status === 'skipped') {
        console.log('  ⏭️  Skipped (no changes needed)');
        skipped++;
      } else if (result.status === 'error') {
        console.log(`  ❌ Error: ${result.error}`);
        errors++;
      } else if (result.status === 'not_found') {
        console.log('  ⚠️  Subscription not found in Stripe');
        notFound++;
      }

      console.log('');
      results.push(result);

      // Rate limiting: small delay to avoid hitting Stripe rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 Summary:');
    console.log(`   Total users processed: ${users.length}`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   ⚠️  Not found: ${notFound}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (dryRun && updated > 0) {
      console.log('');
      console.log('💡 Run without --dry-run to apply these changes');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const userIdArg = args.find(arg => arg.startsWith('--user-id='));
const specificUserId = userIdArg ? userIdArg.split('=')[1] : undefined;

// Run sync
syncAllSubscriptions(dryRun, specificUserId)
  .then(() => {
    console.log('');
    console.log('✅ Sync completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  });

