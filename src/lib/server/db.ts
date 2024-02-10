import sqlite from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import type { ColumnType } from 'kysely';
import { readFileSync } from 'fs';

export const sqliteDatabase = sqlite('db.sqlite');
sqliteDatabase.exec(readFileSync('schema.sql', 'utf8'));

const dialect = new SqliteDialect({
	database: sqliteDatabase
});

export const db = new Kysely<Database>({
	dialect
});

// const a = uuidv4()
// console.log({ a })

// db.insertInto('story').values({
//   id: uuidv4(),
//   title: 'Omar and Sarah',
//   key: 'omar-and-sarah',
//   description: 'This is the first story.',
//   difficulty: 1,
//   created_at: Date.now()
// }).execute();

type Database = {
	user: UserTable;
	user_session: SessionTable;
	user_key: KeyTable;
	email_verification_token: VerificationTokenTable;
	password_reset_token: VerificationTokenTable;
  story: Story;
};

type UserTable = {
	id: string;
	email: string;
	email_verified: number;
};

type SessionTable = {
	id: string;
	user_id: string;
	idle_expires: ColumnType<bigint, number>;
	active_expires: ColumnType<bigint, number>;
};

type KeyTable = {
	id: string;
	user_id: string;
	hashed_password: null | string;
};

type VerificationTokenTable = {
	id: string;
	user_id: string;
	expires: ColumnType<bigint, number>;
};

type Story = {
  id: string;
  title: string;
  key: string;
  description: string;
  difficulty: number;
  created_at: ColumnType<bigint, number>;
}