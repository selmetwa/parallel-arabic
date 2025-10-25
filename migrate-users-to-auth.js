#!/usr/bin/env node

/**
 * Migration script to create Supabase auth users for existing migrated users
 * 
 * This script will:
 * 1. Read all users from your migrated 'user' table
 * 2. Create corresponding entries in Supabase's auth.users table
 * 3. Mark users as migrated in the auth_provider field
 * 
 * Note: Password reset emails need to be handled separately after migration
 * Run with: node migrate-users-to-auth.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://sqqyqxzmlfodupseiyjk.supabase.co"
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxcXlxeHptbGZvZHVwc2VpeWprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg0Njg3NCwiZXhwIjoyMDc0NDIyODc0fQ.e9GTG88QvagrrHGskNVX-D13hlCPP-NoEf3lRmDl4LA"

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('- PUBLIC_VITE_PUBLIC_SUPABASE_URL (or PUBLIC_SUPABASE_URL)');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nMake sure these are set in your .env file');
  process.exit(1);
}

// Create Supabase client with service role key (admin privileges)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Generate a temporary password for new auth users
 */
function generateTemporaryPassword() {
  return Math.random().toString(36).slice(-12) + 'Tmp!';
}

/**
 * Check if a user already exists in auth.users
 */
async function userExistsInAuth(email) {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    
    return data.users.some(user => user.email === email);
  } catch (error) {
    console.error(`Error checking if user exists in auth: ${error.message}`);
    return false;
  }
}

/**
 * Create a user in Supabase auth.users table
 */
async function createAuthUser(userData) {
  const temporaryPassword = generateTemporaryPassword();
  
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirm email since these are existing users
      user_metadata: {
        full_name: userData.name || '',
        avatar_url: userData.picture || '',
        migrated_from_sqlite: true,
        original_user_id: userData.id
      }
    });

    if (error) throw error;

    console.log(`✅ Created auth user for: ${userData.email}`);
    return { success: true, user: data.user, temporaryPassword };
  } catch (error) {
    console.error(`❌ Failed to create auth user for ${userData.email}: ${error.message}`);
    return { success: false, error: error.message };
  }
}


/**
 * Main migration function
 */
async function migrateUsersToAuth() {
  console.log('🚀 Starting user authentication migration...\n');
  
  try {
    // Get all users from your user table
    console.log('📋 Fetching users from database...');
    const { data: users, error: fetchError } = await supabase
      .from('user')
      .select('id, email, name, picture, auth_provider, supabase_auth_id')
      .not('email', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch users: ${fetchError.message}`);
    }

    console.log(`Found ${users.length} users to migrate\n`);

    const results = {
      total: users.length,
      created: 0,
      skipped: 0,
      errors: 0
    };

    // Process each user
    for (const user of users) {
      console.log(`\n--- Processing user: ${user.email} ---`);
      
      // Skip users that already have auth_provider set to 'supabase' or 'google'
      if (user.auth_provider === 'supabase' || user.auth_provider === 'google') {
        console.log(`⏭️  Skipping ${user.email} - already migrated (${user.auth_provider})`);
        results.skipped++;
        continue;
      }

      // Skip users that already have a supabase_auth_id
      if (user.supabase_auth_id) {
        results.skipped++;
        continue;
      }

      // Check if user already exists in auth.users
      const existsInAuth = await userExistsInAuth(user.email);
      if (existsInAuth) {
        console.log(`⏭️  Skipping ${user.email} - already exists in auth`);
        results.skipped++;
        continue;
      }

      // Create the auth user
      const authResult = await createAuthUser(user);
      
      if (authResult.success) {
        results.created++;
        
        // Update the user table to mark as migrated and store Supabase auth ID
        const { error: updateError } = await supabase
          .from('user')
          .update({ 
            auth_provider: 'supabase',
            supabase_auth_id: authResult.user.id  // Store Supabase UUID, keep original user ID intact
          })
          .eq('id', user.id);
          
        if (updateError) {
          console.error(`⚠️  Warning: Could not update auth_provider for ${user.email}`);
        }
      } else {
        results.errors++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 MIGRATION COMPLETE!');
    console.log('='.repeat(50));
    console.log(`📊 Total users processed: ${results.total}`);
    console.log(`✅ Auth users created: ${results.created}`);
    console.log(`⏭️  Users skipped: ${results.skipped}`);
    console.log(`❌ Errors: ${results.errors}`);
    console.log('\n📧 NEXT STEP: Send password reset emails to migrated users');
    console.log('🔗 Users will need to reset their passwords to access their accounts');

  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

/**
 * Run a test migration with a single user (for testing)
 */
async function testMigration() {
  console.log('🧪 Running test migration with 1 user...\n');
  
  try {
    const { data: users, error } = await supabase
      .from('user')
      .select('id, email, name, picture, auth_provider, supabase_auth_id')
      .not('email', 'is', null)
      .limit(5);

    if (error) throw error;
    if (users.length === 0) {
      console.log('No users found for testing');
      return;
    }

    const user = users[1];
    console.log(`Testing with user: ${user.email}`);

    const existsInAuth = await userExistsInAuth(user.email);
    console.log(`User exists in auth: ${existsInAuth}`);

    if (!existsInAuth) {
      const result = await createAuthUser(user);
      console.log(`Create result:`, result.success ? 'SUCCESS' : 'FAILED');
      
      if (result.success) {
        console.log('✅ Auth user created successfully (password reset email not sent in test mode)');
      }
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Command line interface
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🔄 User Authentication Migration Script

Usage:
  node migrate-users-to-auth.js              Run full migration
  node migrate-users-to-auth.js --test       Test with 1 user
  node migrate-users-to-auth.js --help       Show this help

Environment variables required:
  PUBLIC_VITE_PUBLIC_SUPABASE_URL    Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY          Your Supabase service role key

What this script does:
1. Reads all users from your migrated 'user' table
2. Creates corresponding entries in Supabase's auth.users table
3. Updates auth_provider field to track migration status

Note: Password reset emails need to be handled separately after migration.

⚠️  IMPORTANT: This script requires your Supabase service role key!
`);
  process.exit(0);
}

if (args.includes('--test')) {
  testMigration();
} else {
  // Confirm before running full migration
  console.log('💡 Tip: Run with --test flag first to test with 1 user.');
  console.log('\nPress Ctrl+C to cancel, or any key to continue...');
  
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.once('data', () => {
    process.stdin.setRawMode(false);
    migrateUsersToAuth();
  });
}
