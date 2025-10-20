export function getPrefix() {
	return process.env.PREFIX || '!';
}

export function getCurrencyName() {
	return process.env.CURRENCY_NAME || '$NEKO';
}

export function getDailyReward() {
	return Number(process.env.DAILY_REWARD || 50);
}

export function getStartingBalance() {
	return Number(process.env.STARTING_BALANCE || 0);
}

export function getWhitelistedRoleIds() {
	const raw = process.env.WHITELIST_ROLE_IDS || '';
	return raw
		.split(',')
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
}

export function getAllowedChannelIds() {
	const raw = process.env.ALLOWED_CHANNEL_IDS || '';
	return raw
		.split(',')
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
}

export function getGreetingChannelId() {
	return (process.env.GREETING_CHANNEL_ID || '').trim();
}

export function getGreetingTime() {
	// Format HH:MM in 24h, server timezone
	const t = (process.env.GREETING_TIME || '09:00').trim();
	return /^\d{2}:\d{2}$/.test(t) ? t : '09:00';
} 