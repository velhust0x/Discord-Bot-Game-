import { EmbedBuilder } from 'discord.js';
import items from '../data/items.js';
import { getCurrencyName } from '../lib/settings.js';
import { getBalance } from '../lib/economy.js';

export const name = 'shop';

export async function execute(message) {
	const balance = getBalance(message.guild.id, message.author.id);
	const lines = items.map((it) => `${it.name} — ${it.price} ${getCurrencyName()}`);
	const embed = new EmbedBuilder()
		.setTitle('Shop')
		.setDescription([
			`Your current balance: ${balance} ${getCurrencyName()}`,
			'',
			'Available Items',
			'```',
			...lines,
			'```'
		].join('\n'))
		.setTimestamp(Date.now());
	await message.reply({ embeds: [embed] });
} 