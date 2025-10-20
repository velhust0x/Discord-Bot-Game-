import { getBalance } from '../lib/economy.js';
import { getCurrencyName } from '../lib/settings.js';
import { playBaccarat } from '../lib/games.js';
import { EmbedBuilder } from 'discord.js';

export const name = 'bar';

export async function execute(message, args) {
	const bet = Math.floor(Number(args[0]));
	if (!Number.isFinite(bet)) {
		const embed = new EmbedBuilder().setTitle('Usage').setDescription('!bar <bet>').setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}
	if (bet < 1 || bet > 6969) {
		const embed = new EmbedBuilder().setTitle('Invalid Bet').setDescription('Bet must be between 1 and 6969.').setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}
	const bal = getBalance(message.guild.id, message.author.id);
	if (bal < bet) {
		const embed = new EmbedBuilder().setTitle('Insufficient Balance').setDescription(`You need at least ${bet} ${getCurrencyName()}.`).setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}
	await playBaccarat(message, bet);
}
