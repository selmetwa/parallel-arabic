// import { Kysely, sql } from 'kysely'

// export async function up(db: Kysely<any>): Promise<void> {
//   await db.schema
//     .createTable('story')
//     .addColumn('id', 'uuid', (col) => col.primaryKey())
//     .addColumn('title', 'varchar', (col) => col.notNull())
//     .addColumn('key', 'varchar', (col) => col.notNull())
//     .addColumn('description', 'varchar', (col) => col.notNull())
//     .addColumn('difficulty', 'integer', (col) => col.notNull())
//     .addColumn('created_at', 'varchar', (col) =>
//       col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
//     )
//     .execute()
// };