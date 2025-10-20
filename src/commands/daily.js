import { EmbedBuilder } from 'discord.js';
import { addBalance, canClaimDaily, setDailyClaimed } from '../lib/economy.js';
import { getCurrencyName, getDailyReward } from '../lib/settings.js';

export const name = 'gneko';

export async function execute(message) {
	const { canClaim, remainingMs } = canClaimDaily(message.guild.id, message.author.id);
	if (!canClaim) {
		const hours = Math.floor(remainingMs / 3600000);
		const minutes = Math.ceil((remainingMs % 3600000) / 60000);
		const hourText = hours > 0 ? `${hours} hour${hours !== 1 ? 's' : ''}` : '';
		const minuteText = minutes > 0 ? `${minutes} minute${minutes !== 1 ? 's' : ''}` : '';
		const spacer = hourText && minuteText ? ' ' : '';
		const embed = new EmbedBuilder().setTitle('Cooldown').setDescription(`You already claimed today. Try again in ${hourText}${spacer}${minuteText}.`).setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}
	const reward = getDailyReward();
	addBalance(message.guild.id, message.author.id, reward);
	setDailyClaimed(message.guild.id, message.author.id);
	const embed = new EmbedBuilder()
		.setTitle('Daily Reward')
		.setDescription(`You received ${reward} ${getCurrencyName()}.`)
		.setTimestamp(Date.now());
	await message.reply({ embeds: [embed] });
} 