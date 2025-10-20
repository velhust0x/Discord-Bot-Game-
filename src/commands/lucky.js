import { getBalance } from '../lib/economy.js';
import { getCurrencyName } from '../lib/settings.js';
import { playRandomGame } from '../lib/games.js';
import { EmbedBuilder } from 'discord.js';

export const name = 'lucky';

export async function execute(message, args) {
	const bet = Math.floor(Number(args[0]));
	if (!Number.isFinite(bet) || bet <= 0) {
		const embed = new EmbedBuilder().setTitle('Usage').setDescription('!lucky <bet>').setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}
	const bal = getBalance(message.guild.id, message.author.id);
	if (bal < bet) {
		const embed = new EmbedBuilder().setTitle('Insufficient Balance').setDescription(`You need at least ${bet} ${getCurrencyName()}.`).setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}
	await playRandomGame(message, bet);
} 