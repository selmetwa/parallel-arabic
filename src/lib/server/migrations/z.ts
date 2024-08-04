import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  console.log('running migration up');
  await db.schema
    .alterTable('user')
    .addColumn('is_subscriber', 'boolean', (col) => col.notNull().defaultTo(false))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user')
    .dropColumn('is_subscriber')
    .execute();
}