import { transferBalance } from '../lib/economy.js';
import { getCurrencyName } from '../lib/settings.js';
import { EmbedBuilder } from 'discord.js';

export const name = 'transfer';

export async function execute(message, args) {
	const target = message.mentions.users.first();
	const amount = Number(args[1] ?? args[0]);
	if (!target || !Number.isFinite(amount) || amount <= 0) {
		const embed = new EmbedBuilder().setTitle('Usage').setDescription('!transfer @user <amount>').setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}
	if (target.id === message.author.id) {
		const embed = new EmbedBuilder().setTitle('Invalid').setDescription('You cannot transfer to yourself.').setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}
	try {
		transferBalance(message.guild.id, message.author.id, target.id, Math.floor(amount));
		const embed = new EmbedBuilder()
			.setTitle('Transfer')
			.addFields(
				{ name: 'To', value: target.username, inline: true },
				{ name: 'Amount', value: `${amount} ${getCurrencyName()}`, inline: true }
			)
			.setTimestamp(Date.now());
		await message.reply({ embeds: [embed] });
	} catch (e) {
		const embed = new EmbedBuilder().setTitle('Insufficient Balance').setDescription('You do not have enough funds.').setTimestamp(Date.now());
		await message.reply({ embeds: [embed] });
	}
} 