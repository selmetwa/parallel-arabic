/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  console.log('running migration up');
  await db.schema
    .alterTable('user')
    .addColumn('sentences_viewed', 'integer')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user')
    .dropColumn('sentences_viewed')
    .execute();
}