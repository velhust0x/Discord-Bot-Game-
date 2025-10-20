import { addBalance } from '../lib/economy.js';
import { getCurrencyName } from '../lib/settings.js';
import { getWhitelistedRoleIds } from '../lib/settings.js';
import { EmbedBuilder } from 'discord.js';

export const name = 'give';

export async function execute(message, args) {
	const allowedRoles = new Set(getWhitelistedRoleIds());
	const hasWhitelistedRole = message.member.roles.cache.some((r) => allowedRoles.has(r.id));
	if (!(message.member.permissions.has('ManageGuild') || hasWhitelistedRole)) {
		const embed = new EmbedBuilder().setTitle('Permission Denied').setDescription('You are not allowed to use this command.').setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}
	const target = message.mentions.users.first();
	const amount = Number(args[1] ?? args[0]);
	if (!target || !Number.isFinite(amount) || amount <= 0) {
		const embed = new EmbedBuilder().setTitle('Usage').setDescription('!give @user <amount>').setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}
	addBalance(message.guild.id, target.id, Math.floor(amount));
	const embed = new EmbedBuilder()
		.setTitle('Grant')
		.addFields(
			{ name: 'Recipient', value: target.username, inline: true },
			{ name: 'Amount', value: `${amount} ${getCurrencyName()}`, inline: true }
		)
		.setTimestamp(Date.now());
	await message.reply({ embeds: [embed] });
} 