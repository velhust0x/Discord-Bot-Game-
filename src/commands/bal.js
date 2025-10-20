import { EmbedBuilder } from 'discord.js';
import { getBalance } from '../lib/economy.js';
import { getCurrencyName } from '../lib/settings.js';

export const name = 'bal';

export async function execute(message, args) {
	const target = message.mentions.users.first() || message.author;
	const balance = getBalance(message.guild.id, target.id);
	const embed = new EmbedBuilder()
		.setTitle('Balance')
		.setThumbnail(target.displayAvatarURL({ size: 128 }))
		.addFields(
			{ name: 'User', value: target.username, inline: true },
			{ name: 'Balance', value: `${balance} ${getCurrencyName()}`, inline: true }
		)
		.setTimestamp(Date.now());
	await message.reply({ embeds: [embed] });
} 