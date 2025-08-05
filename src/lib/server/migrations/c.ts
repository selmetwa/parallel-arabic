/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  console.log('Running migration c: Adding dialect column and indexes to generated_story table');

  // Add dialect column to generated_story table
  try {
    await db.schema
      .alterTable('generated_story')
      .addColumn('dialect', 'text', (col) => col.notNull().defaultTo('egyptian-arabic'))
      .execute();
    console.log('Added dialect column to generated_story table');
  } catch (error) {
    console.log('dialect column already exists, skipping');
  }

  // Set default dialect for existing rows that might have null values
  await db
    .updateTable('generated_story')
    .set({ dialect: 'egyptian-arabic' })
    .where('dialect', 'is', null)
    .execute();

  // Create indexes for better query performance
  try {
    await db.schema
      .createIndex('idx_generated_story_user_id')
      .on('generated_story')
      .column('user_id')
      .execute();
    console.log('Created index on user_id');
  } catch (error) {
    console.log('Index idx_generated_story_user_id already exists, skipping');
  }

  try {
    await db.schema
      .createIndex('idx_generated_story_created_at')
      .on('generated_story')
      .column('created_at')
      .execute();
    console.log('Created index on created_at');
  } catch (error) {
    console.log('Index idx_generated_story_created_at already exists, skipping');
  }

  try {
    await db.schema
      .createIndex('idx_generated_story_dialect')
      .on('generated_story')
      .column('dialect')
      .execute();
    console.log('Created index on dialect');
  } catch (error) {
    console.log('Index idx_generated_story_dialect already exists, skipping');
  }

  try {
    await db.schema
      .createIndex('idx_generated_story_user_dialect')
      .on('generated_story')
      .columns(['user_id', 'dialect'])
      .execute();
    console.log('Created composite index on user_id and dialect');
  } catch (error) {
    console.log('Index idx_generated_story_user_dialect already exists, skipping');
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  console.log('Rolling back migration c: Removing dialect column and indexes from generated_story table');

  // Drop indexes
  try {
    await db.schema
      .dropIndex('idx_generated_story_user_dialect')
      .execute();
    console.log('Dropped composite index on user_id and dialect');
  } catch (error) {
    console.log('Index idx_generated_story_user_dialect did not exist, skipping');
  }

  try {
    await db.schema
      .dropIndex('idx_generated_story_dialect')
      .execute();
    console.log('Dropped index on dialect');
  } catch (error) {
    console.log('Index idx_generated_story_dialect did not exist, skipping');
  }

  try {
    await db.schema
      .dropIndex('idx_generated_story_created_at')
      .execute();
    console.log('Dropped index on created_at');
  } catch (error) {
    console.log('Index idx_generated_story_created_at did not exist, skipping');
  }

  try {
    await db.schema
      .dropIndex('idx_generated_story_user_id')
      .execute();
    console.log('Dropped index on user_id');
  } catch (error) {
    console.log('Index idx_generated_story_user_id did not exist, skipping');
  }

  // Drop dialect column
  try {
    await db.schema
      .alterTable('generated_story')
      .dropColumn('dialect')
      .execute();
    console.log('Dropped dialect column from generated_story table');
  } catch (error) {
    console.log('dialect column did not exist, skipping');
  }
} 