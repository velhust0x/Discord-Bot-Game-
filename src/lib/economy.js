import { getDb } from './db.js';
import { getStartingBalance } from './settings.js';

function ensureBalanceRow(guildId, userId) {
	const db = getDb();
	const row = db.prepare('SELECT balance FROM balances WHERE guild_id=? AND user_id=?').get(guildId, userId);
	if (!row) {
		db.prepare('INSERT INTO balances (guild_id, user_id, balance) VALUES (?,?,?)').run(guildId, userId, getStartingBalance());
		return { balance: getStartingBalance() };
	}
	return row;
}

export function getBalance(guildId, userId) {
	return ensureBalanceRow(guildId, userId).balance;
}

export function addBalance(guildId, userId, amount) {
	const db = getDb();
	ensureBalanceRow(guildId, userId);
	db.prepare('UPDATE balances SET balance = balance + ? WHERE guild_id=? AND user_id=?').run(amount, guildId, userId);
	return getBalance(guildId, userId);
}

export function subtractBalance(guildId, userId, amount) {
	return addBalance(guildId, userId, -Math.abs(amount));
}

export function setBalance(guildId, userId, amount) {
	const db = getDb();
	ensureBalanceRow(guildId, userId);
	db.prepare('UPDATE balances SET balance = ? WHERE guild_id=? AND user_id=?').run(Math.max(0, Math.floor(amount)), guildId, userId);
	return getBalance(guildId, userId);
}

export function transferBalance(guildId, fromUserId, toUserId, amount) {
	const db = getDb();
	const trans = db.transaction(() => {
		const from = getBalance(guildId, fromUserId);
		if (from < amount) throw new Error('Insufficient funds');
		subtractBalance(guildId, fromUserId, amount);
		addBalance(guildId, toUserId, amount);
	});
	trans();
}

export function canClaimDaily(guildId, userId) {
	const db = getDb();
	const row = db.prepare('SELECT last_daily FROM claims WHERE guild_id=? AND user_id=?').get(guildId, userId);
	if (!row) return { canClaim: true, remainingMs: 0 };
	const now = Date.now();
	const reset = row.last_daily + 24 * 60 * 60 * 1000;
	return { canClaim: now >= reset, remainingMs: Math.max(0, reset - now) };
}

export function setDailyClaimed(guildId, userId) {
	const db = getDb();
	const existing = db.prepare('SELECT 1 FROM claims WHERE guild_id=? AND user_id=?').get(guildId, userId);
	if (!existing) db.prepare('INSERT INTO claims (guild_id, user_id, last_daily) VALUES (?,?,?)').run(guildId, userId, Date.now());
	else db.prepare('UPDATE claims SET last_daily=? WHERE guild_id=? AND user_id=?').run(Date.now(), guildId, userId);
} 