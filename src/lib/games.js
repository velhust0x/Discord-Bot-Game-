import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { addBalance, subtractBalance } from './economy.js';
import { getCurrencyName } from './settings.js';

function renderResultEmbed(title, fields) {
	return new EmbedBuilder().setTitle(title).addFields(...fields).setTimestamp(Date.now());
}

export async function playHiLo(message, bet) {
	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder().setCustomId('low').setLabel('🔻 Low (1-3)').setStyle(ButtonStyle.Danger),
		new ButtonBuilder().setCustomId('high').setLabel('🔺 High (4-6)').setStyle(ButtonStyle.Success)
	);
	const promptEmbed = new EmbedBuilder()
		.setTitle('🎲 HiLo')
		.addFields(
			{ name: 'Bet', value: `${bet} ${getCurrencyName()}`, inline: true },
			{ name: 'Choose', value: '🔻 Low (1-3) or 🔺 High (4-6)', inline: true }
		)
		.setTimestamp(Date.now());
	const prompt = await message.reply({ embeds: [promptEmbed], components: [row] });
	return new Promise((resolve) => {
		const collector = prompt.createMessageComponentCollector({ time: 15000, filter: (i) => i.user.id === message.author.id });
		collector.on('collect', async (interaction) => {
			await interaction.deferUpdate();
			row.components.forEach((b) => b.setDisabled(true));
			subtractBalance(message.guild.id, message.author.id, bet);
			const isHigh = Math.floor(Math.random() * 6) + 1 >= 4;
			const choiceHigh = interaction.customId === 'high';
			const won = choiceHigh === isHigh;
			let reward = 0;
			if (won) {
				reward = bet * 2;
				addBalance(message.guild.id, message.author.id, reward);
			}
			const embed = renderResultEmbed(won ? '🏆 Victory' : '❌ Defeat', [
				{ name: 'Game', value: '🎲 HiLo', inline: true },
				{ name: 'Your Choice', value: choiceHigh ? '🔺 High (4-6)' : '🔻 Low (1-3)', inline: true },
				{ name: 'Reward', value: `${won ? '+' + reward : '+0'} ${getCurrencyName()}`, inline: true },
				{ name: 'Profit', value: `${won ? '+' + (reward - bet) : '-' + bet} ${getCurrencyName()}`, inline: true }
			]);
			await prompt.edit({ content: '', embeds: [embed], components: [row] });
			collector.stop('done');
			resolve();
		});
		collector.on('end', async (collected, reason) => {
			if (reason !== 'done') {
				row.components.forEach((b) => b.setDisabled(true));
				const timeoutEmbed = new EmbedBuilder().setTitle('⌛ Timed out').setDescription('No selection was made in time.').setTimestamp(Date.now());
				await prompt.edit({ embeds: [timeoutEmbed], components: [row] });
				resolve();
			}
		});
	});
}

function drawCard() {
	const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
	return ranks[Math.floor(Math.random() * ranks.length)];
}

function cardValue(rank) {
	if (rank === 'A') return 11;
	if (['J','Q','K'].includes(rank)) return 10;
	return Number(rank);
}

function handValue(cards) {
	let total = cards.reduce((s, r) => s + cardValue(r), 0);
	let aces = cards.filter((r) => r === 'A').length;
	while (total > 21 && aces > 0) { total -= 10; aces--; }
	return total;
}

export async function playBlackjack(message, bet) {
	subtractBalance(message.guild.id, message.author.id, bet);
	let player = [drawCard(), drawCard()];
	let dealer = [drawCard(), drawCard()];

	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder().setCustomId('hit').setLabel('🖐️ Hit').setStyle(ButtonStyle.Primary),
		new ButtonBuilder().setCustomId('stand').setLabel('🛑 Stand').setStyle(ButtonStyle.Secondary)
	);

	const makePromptEmbed = () => new EmbedBuilder()
		.setTitle('🃏 Blackjack')
		.addFields(
			{ name: 'Bet', value: `${bet} ${getCurrencyName()}`, inline: true },
			{ name: 'Your Hand', value: `${player.join(' ')} (${handValue(player)})`, inline: true },
			{ name: 'Dealer Upcard', value: dealer[0], inline: true }
		)
		.setTimestamp(Date.now());

	const prompt = await message.reply({ embeds: [makePromptEmbed()], components: [row] });

	return new Promise((resolve) => {
		const collector = prompt.createMessageComponentCollector({ time: 30000, filter: (i) => i.user.id === message.author.id });
		collector.on('collect', async (interaction) => {
			await interaction.deferUpdate();
			if (interaction.customId === 'hit') {
				player.push(drawCard());
				await prompt.edit({ embeds: [makePromptEmbed()], components: [row] });
				if (handValue(player) < 21) return; // let them decide again
			}
			row.components.forEach((b) => b.setDisabled(true));
			while (handValue(dealer) < 17) dealer.push(drawCard());
			const pVal = handValue(player);
			const dVal = handValue(dealer);
			let title = '❌ Defeat';
			let reward = 0;
			if ((pVal <= 21 && dVal > 21) || (pVal <= 21 && pVal > dVal)) { title = '🏆 Victory'; reward = bet * 2; addBalance(message.guild.id, message.author.id, reward); }
			else if (pVal === dVal && pVal <= 21) { title = '🤝 Push'; reward = bet; addBalance(message.guild.id, message.author.id, reward); }
			const embed = renderResultEmbed(title, [
				{ name: 'Game', value: '🃏 Blackjack', inline: true },
				{ name: 'Your Hand', value: `${player.join(' ')} (${pVal})`, inline: true },
				{ name: 'Dealer Hand', value: `${dealer.join(' ')} (${dVal})`, inline: true },
				{ name: 'Reward', value: `${reward} ${getCurrencyName()}`, inline: true },
				{ name: 'Profit', value: `${reward - bet} ${getCurrencyName()}`, inline: true }
			]);
			await prompt.edit({ content: '', embeds: [embed], components: [row] });
			collector.stop('done');
			resolve();
		});
		collector.on('end', async (collected, reason) => {
			if (reason !== 'done') {
				row.components.forEach((b) => b.setDisabled(true));
				const timeoutEmbed = new EmbedBuilder().setTitle('⌛ Timed out').setDescription('No action taken in time.').setTimestamp(Date.now());
				await prompt.edit({ embeds: [timeoutEmbed], components: [row] });
				resolve();
			}
		});
	});
}

function baccaratScore(cards) {
	const vals = cards.map((r) => {
		if (r === 'A') return 1; if (['J','Q','K','10'].includes(r)) return 0; return Number(r);
	});
	const sum = vals.reduce((a,b)=>a+b,0);
	return sum % 10;
}

export async function playBaccarat(message, bet) {
	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder().setCustomId('player').setLabel('🟩 Bet Player').setStyle(ButtonStyle.Success),
		new ButtonBuilder().setCustomId('banker').setLabel('🟥 Bet Banker').setStyle(ButtonStyle.Danger)
	);
	const promptEmbed = new EmbedBuilder()
		.setTitle('🎴 Baccarat')
		.addFields(
			{ name: 'Bet', value: `${bet} ${getCurrencyName()}`, inline: true },
			{ name: 'Choose', value: '🟩 Player or 🟥 Banker', inline: true }
		)
		.setTimestamp(Date.now());
	const prompt = await message.reply({ embeds: [promptEmbed], components: [row] });
	return new Promise((resolve) => {
		const collector = prompt.createMessageComponentCollector({ time: 15000, filter: (i) => i.user.id === message.author.id });
		collector.on('collect', async (interaction) => {
			await interaction.deferUpdate();
			row.components.forEach((b) => b.setDisabled(true));
			subtractBalance(message.guild.id, message.author.id, bet);
			const pick = interaction.customId; // player | banker
			const player = [drawCard(), drawCard()];
			const banker = [drawCard(), drawCard()];
			if (baccaratScore(player) < 6) player.push(drawCard());
			if (baccaratScore(banker) < 6) banker.push(drawCard());
			const p = baccaratScore(player);
			const b = baccaratScore(banker);
			let title = '❌ Defeat';
			let reward = 0;
			if ((p > b && pick === 'player') || (b > p && pick === 'banker')) { title = '🏆 Victory'; reward = bet * 2; }
			else if (p === b) { title = '🤝 Tie'; reward = bet; }
			if (reward > 0) addBalance(message.guild.id, message.author.id, reward);
			const embed = renderResultEmbed(title, [
				{ name: 'Game', value: '🎴 Baccarat', inline: true },
				{ name: 'Your Bet', value: pick === 'player' ? '🟩 Player' : '🟥 Banker', inline: true },
				{ name: 'Player', value: `${player.join(' ')} (${p})`, inline: true },
				{ name: 'Banker', value: `${banker.join(' ')} (${b})`, inline: true },
				{ name: 'Reward', value: `${reward} ${getCurrencyName()}`, inline: true },
				{ name: 'Profit', value: `${reward - bet} ${getCurrencyName()}`, inline: true }
			]);
			await prompt.edit({ content: '', embeds: [embed], components: [row] });
			collector.stop('done');
			resolve();
		});
		collector.on('end', async (collected, reason) => {
			if (reason !== 'done') {
				row.components.forEach((b) => b.setDisabled(true));
				const timeoutEmbed = new EmbedBuilder().setTitle('⌛ Timed out').setDescription('No selection was made in time.').setTimestamp(Date.now());
				await prompt.edit({ embeds: [timeoutEmbed], components: [row] });
				resolve();
			}
		});
	});
}

export async function playRandomGame(message, bet) {
	const games = [playHiLo, playBlackjack, playBaccarat];
	const game = games[Math.floor(Math.random() * games.length)];
	await game(message, bet);
}
