/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // await db.schema.dropTable('generated_story').execute();

  await db.schema
    .createTable('generated_story')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('user_id', 'text', (col) => col.notNull())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('difficulty', 'text', (col) => col.notNull())
    .addColumn('story_body', 'json', (col) => col.notNull())
    .addColumn('created_at', 'bigint', (col) => col.defaultTo(sql`(strftime('%s', 'now') * 1000)`))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('generated_story').execute();
}
