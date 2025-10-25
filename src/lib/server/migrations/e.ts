/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {

  // Add supabase_auth_id column to user table
  try {
    await db.schema
      .alterTable('user')
      .addColumn('supabase_auth_id', 'text')
      .execute();
  } catch (error) {
    // supabase_auth_id column already exists, skipping
  }

  // Create index for better query performance on supabase_auth_id lookups
  try {
    await db.schema
      .createIndex('idx_user_supabase_auth_id')
      .on('user')
      .column('supabase_auth_id')
      .unique()
      .execute();
  } catch (error) {
    // Index idx_user_supabase_auth_id already exists, skipping
  }
}

export async function down(db: Kysely<any>): Promise<void> {

  // Drop the unique index
  try {
    await db.schema
      .dropIndex('idx_user_supabase_auth_id')
      .execute();
  } catch (error) {
    // Index idx_user_supabase_auth_id did not exist, skipping
  }

  // Drop supabase_auth_id column
  try {
    await db.schema
      .alterTable('user')
      .dropColumn('supabase_auth_id')
      .execute();
  } catch (error) {
    // supabase_auth_id column did not exist, skipping
  }
}
