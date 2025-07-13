/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Check what columns exist by querying the table info
  const tableInfo = await db.selectFrom('sqlite_master')
    .select('sql')
    .where('type', '=', 'table')
    .where('name', '=', 'user')
    .executeTakeFirst();

  console.log('Current user table schema:', tableInfo?.sql);

  // Add columns only if they don't exist
  // We'll use a try-catch approach since SQLite doesn't have IF NOT EXISTS for columns
  
  try {
    await db.schema
      .alterTable('user')
      .addColumn('google_id', 'text')
      .execute();
    console.log('Added google_id column');
  } catch (error) {
    console.log('google_id column already exists, skipping');
  }

  try {
    await db.schema
      .alterTable('user')
      .addColumn('name', 'text')
      .execute();
    console.log('Added name column');
  } catch (error) {
    console.log('name column already exists, skipping');
  }

  try {
    await db.schema
      .alterTable('user')
      .addColumn('picture', 'text')
      .execute();
    console.log('Added picture column');
  } catch (error) {
    console.log('picture column already exists, skipping');
  }

  try {
    await db.schema
      .alterTable('user')
      .addColumn('auth_provider', 'text')
      .execute();
    console.log('Added auth_provider column');
  } catch (error) {
    console.log('auth_provider column already exists, skipping');
  }

  // Set default value for existing rows
  await db
    .updateTable('user')
    .set({ auth_provider: 'email' })
    .where('auth_provider', 'is', null)
    .execute();

  // Create unique index if it doesn't exist
  try {
    await db.schema
      .createIndex('user_google_id_unique')
      .on('user')
      .column('google_id')
      .unique()
      .execute();
    console.log('Created unique index on google_id');
  } catch (error) {
    console.log('Unique index already exists, skipping');
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop the unique index
  try {
    await db.schema
      .dropIndex('user_google_id_unique')
      .execute();
  } catch (error) {
    console.log('Index did not exist, skipping');
  }

  // Drop columns
  try {
    await db.schema
      .alterTable('user')
      .dropColumn('auth_provider')
      .execute();
  } catch (error) {
    console.log('auth_provider column did not exist, skipping');
  }

  try {
    await db.schema
      .alterTable('user')
      .dropColumn('picture')
      .execute();
  } catch (error) {
    console.log('picture column did not exist, skipping');
  }

  try {
    await db.schema
      .alterTable('user')
      .dropColumn('name')
      .execute();
  } catch (error) {
    console.log('name column did not exist, skipping');
  }

  try {
    await db.schema
      .alterTable('user')
      .dropColumn('google_id')
      .execute();
  } catch (error) {
    console.log('google_id column did not exist, skipping');
  }
}