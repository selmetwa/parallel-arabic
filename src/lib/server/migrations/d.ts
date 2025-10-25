// add video table
import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  try {
    await db.schema
      .createTable('video')
      .addColumn('id', 'varchar(15)', (col) => col.primaryKey())
      .addColumn('user_id', 'varchar(15)', (col) => col.notNull())
      .addColumn('title', 'varchar(255)', (col) => col.notNull())
      .addColumn('description', 'text', (col) => col.notNull())
      .addColumn('url', 'varchar(255)', (col) => col.notNull())
      .addColumn('thumbnail_url', 'varchar(255)', (col) => col.notNull())
      .addColumn('dialect', 'varchar(50)', (col) => col.notNull())
      .addColumn('created_at', 'bigint', (col) => col.notNull())
      .addColumn('video_body', 'json', (col) => col.notNull())
      .execute();
  } catch (error) {
    console.log('video table already exists, skipping');
  }
  console.log('Running migration d: Adding video table');
}

export async function down(db: Kysely<any>): Promise<void> {
  try {
    await db.schema
      .dropTable('video')
      .execute();
  } catch (error) {
    console.log('video table did not exist, skipping');
  }
  console.log('Rolling back migration d: Removing video table');
}