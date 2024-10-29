import sqlite from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import type { ColumnType } from 'kysely';
import { readFileSync } from 'fs';
// import { DB_PATH } from '$env/static/private';

// const dbPath = process.env.DB_PATH;
// console.log({ dbPath, DB_PATH });
export const sqliteDatabase = sqlite("data/db.sqlite");

sqliteDatabase.exec(readFileSync('schema.sql', 'utf8'));

const dialect = new SqliteDialect({
	database: sqliteDatabase
});

export const db = new Kysely<Database>({
	dialect
});

type Database = {
	user: UserTable;
	user_session: SessionTable;
	user_key: KeyTable;
	email_verification_token: VerificationTokenTable;
	password_reset_token: VerificationTokenTable;
  story: Story;
  saved_word: SavedWord;
  generated_story: GeneratedStoryTable;
};

type GeneratedStoryTable = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  difficulty: string;
  story_body: JSON;
  created_at: ColumnType<bigint, number>;
}

type UserTable = {
	id: string;
	email: string;
	email_verified: number;
  is_subscriber: boolean;
  subscriber_id: string;
  subscription_end_date: ColumnType<bigint, number>;
  sentences_viewed: number;
  verb_conjugation_tenses_viewed: number;
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

type SavedWord = {
  id: string;
  user_id: string;
  arabic_word: string;
  english_word: string;
  transliterated_word: string;
  created_at: ColumnType<bigint, number>;
}
