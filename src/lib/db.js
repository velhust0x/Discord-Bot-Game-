import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = process.env.DATABASE_PATH || './data/economy.db';
const dataDir = path.dirname(dbPath);

let db;

export async function ensureDatabase() {
	if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
	db = new Database(dbPath);
	db.pragma('journal_mode = WAL');
	db.exec(`CREATE TABLE IF NOT EXISTS balances (
		guild_id TEXT NOT NULL,
		user_id TEXT NOT NULL,
		balance INTEGER NOT NULL DEFAULT 0,
		PRIMARY KEY (guild_id, user_id)
	);`);
	db.exec(`CREATE TABLE IF NOT EXISTS claims (
		guild_id TEXT NOT NULL,
		user_id TEXT NOT NULL,
		last_daily INTEGER NOT NULL DEFAULT 0,
		PRIMARY KEY (guild_id, user_id)
	);`);
	return db;
}

export function getDb() {
	return db;
} 