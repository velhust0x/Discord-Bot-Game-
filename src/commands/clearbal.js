import { setBalance } from '../lib/economy.js';
import { EmbedBuilder } from 'discord.js';
import { getWhitelistedRoleIds } from '../lib/settings.js';

export const name = 'clearbal';

export async function execute(message, args) {
	const allowedRoles = new Set(getWhitelistedRoleIds());
	const hasWhitelistedRole = message.member.roles.cache.some((r) => allowedRoles.has(r.id));
	if (!(message.member.permissions.has('ManageGuild') || hasWhitelistedRole)) {
		const embed = new EmbedBuilder().setTitle('Permission Denied').setDescription('You are not allowed to use this command.').setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}
	const target = message.mentions.users.first();
	if (!target) {
		const embed = new EmbedBuilder().setTitle('Usage').setDescription('!clearbal @user').setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}
	setBalance(message.guild.id, target.id, 0);
	const embed = new EmbedBuilder().setTitle('Balance Cleared').setDescription(`Set ${target.username}'s balance to 0.`).setTimestamp(Date.now());
	await message.reply({ embeds: [embed] });
}
