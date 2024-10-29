import { Migrator, FileMigrationProvider } from 'kysely';
import { fileURLToPath } from 'url';
import * as path from 'path';
import { promises as fs } from 'fs';
import { db } from './db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateToLatest() {
	const migrator = new Migrator({
		db,
		provider: new FileMigrationProvider({
			fs,
			path,
			migrationFolder: path.join(__dirname, 'migrations'),
		}),
	});

	const { error, results } = await migrator.migrateUp();

  console.log({ db })
	results?.forEach((it) => {
    console.log({it});
		if (it.status === 'Success') {
			console.log(`migration "${it.migrationName}" was executed successfully`);
		} else if (it.status === 'Error') {
			console.error(`failed to execute migration "${it.migrationName}"`);
		} else if (it.status === 'NotExecuted') {
      console.log(`migration "${it.migrationName}" was not executed`);
    }
	});

	if (error) {
		console.error('failed to migrate');
		console.error({error});
		process.exit(1);
	}
	await db.destroy();
}

migrateToLatest();
