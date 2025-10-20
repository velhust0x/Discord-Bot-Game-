import { EmbedBuilder } from 'discord.js';
import { getCurrencyName } from '../lib/settings.js';

export const name = 'farm';

export async function execute(message) {
	const cur = getCurrencyName();
	const embed = new EmbedBuilder()
		.setTitle('Available Games')
		.setDescription('Play games to earn or risk your balance.')
		.addFields(
			{ name: '🎲 HiLo', value: `Guess Low (1-3) or High (4-6).\nUsage: !hilo <bet>`, inline: false },
			{ name: '🃏 Blackjack', value: `Hit or Stand vs the dealer.\nUsage: !bj <bet>`, inline: false },
			{ name: '🎴 Baccarat', value: `Bet Player or Banker.\nUsage: !bar <bet>`, inline: false },
			{ name: '🎯 Lucky (Random)', value: `Randomly picks one of HiLo, Blackjack, or Baccarat.\nUsage: !lucky <bet>`, inline: false },
			{ name: '🎁 Giveaway', value: `Admins/whitelisted can start: !ga <amount> <seconds>. Users join via button. Rewards in ${cur}.`, inline: false },
			{ name: '🏆 Raffle', value: `Winner-takes-all prize pool with weighted tickets. Admins start: !rf <entryFee> <seconds>. Users buy tickets via button.`, inline: false }
		)
		.setTimestamp(Date.now());
	await message.reply({ embeds: [embed] });
}
