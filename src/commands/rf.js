import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { addBalance, getBalance, subtractBalance } from '../lib/economy.js';
import { getCurrencyName, getWhitelistedRoleIds } from '../lib/settings.js';

export const name = 'rf';

export async function execute(message, args) {
	// Permissions: same as GA
	const allowedRoles = new Set(getWhitelistedRoleIds());
	const hasWhitelistedRole = message.member.roles.cache.some((r) => allowedRoles.has(r.id));
	if (!(message.member.permissions.has('ManageGuild') || hasWhitelistedRole)) {
		const embed = new EmbedBuilder().setTitle('Permission Denied').setDescription('You are not allowed to start a raffle.').setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}

	const entryFee = Number(args[0]);
	const seconds = Number(args[1]);
	if (!Number.isFinite(entryFee) || entryFee <= 0 || !Number.isFinite(seconds) || seconds <= 0) {
		const embed = new EmbedBuilder().setTitle('Usage').setDescription('!rf <entryFee> <seconds> (e.g. !rf 50 120)').setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}
	const currency = getCurrencyName();
	const durationMs = Math.floor(seconds * 1000);
	const endAt = Date.now() + durationMs;

	const tickets = new Map(); // userId -> numTickets

	const embed = new EmbedBuilder()
		.setTitle('Raffle — Winner Takes All')
		.addFields(
			{ name: 'Entry Fee', value: `${entryFee} ${currency}`, inline: true },
			{ name: 'Ends', value: `<t:${Math.floor(endAt/1000)}:R>`, inline: true },
			{ name: 'Pool', value: `0 ${currency}`, inline: true },
		)
		.addFields({ name: 'Participants', value: 'None yet', inline: false })
		.setTimestamp(endAt);

	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder().setCustomId('raffle_join').setLabel(`Buy Ticket`).setStyle(ButtonStyle.Primary)
	);

	const msg = await message.reply({ embeds: [embed], components: [row] });

	const collector = msg.createMessageComponentCollector({ time: durationMs });

	collector.on('collect', async (interaction) => {
		if (interaction.customId !== 'raffle_join') return interaction.deferUpdate();
		if (interaction.user.bot) return interaction.deferUpdate();
		const bal = getBalance(message.guild.id, interaction.user.id);
		if (bal < entryFee) {
			return interaction.reply({ content: `Insufficient balance. You need ${entryFee} ${currency}.`, flags: 64 });
		}
		subtractBalance(message.guild.id, interaction.user.id, entryFee);
		const current = tickets.get(interaction.user.id) || 0;
		tickets.set(interaction.user.id, current + 1);
		await interaction.deferUpdate();
		// Update embed
		const totalTickets = Array.from(tickets.values()).reduce((a,b)=>a+b,0);
		const pool = totalTickets * entryFee;
		const names = Array.from(tickets.keys()).map((id) => interaction.guild.members.cache.get(id)?.user.username || 'Unknown');
		const list = names.length > 0 ? names.slice(0, 10).join(', ') + (names.length > 10 ? ` and ${names.length - 10} more` : '') : 'None yet';
		embed.setFields(
			{ name: 'Entry Fee', value: `${entryFee} ${currency}`, inline: true },
			{ name: 'Ends', value: `<t:${Math.floor(endAt/1000)}:R>`, inline: true },
			{ name: 'Pool', value: `${pool} ${currency}`, inline: true },
			{ name: 'Participants', value: list, inline: false }
		);
		await msg.edit({ embeds: [embed], components: [row] });
	});

	collector.on('end', async () => {
		row.components.forEach((b) => b.setDisabled(true));
		await msg.edit({ components: [row] });
		const entries = [];
		for (const [userId, count] of tickets.entries()) {
			for (let i = 0; i < count; i++) entries.push(userId);
		}
		if (entries.length === 0) {
			return msg.reply('No participants.');
		}
		const winnerId = entries[Math.floor(Math.random() * entries.length)];
		const pool = entries.length * entryFee;
		addBalance(message.guild.id, winnerId, pool);
		const winEmbed = new EmbedBuilder()
			.setTitle('Raffle Winner')
			.addFields(
				{ name: 'Winner', value: `<@${winnerId}>`, inline: true },
				{ name: 'Amount', value: `${pool} ${currency}`, inline: true }
			)
			.setTimestamp(Date.now());
		await msg.reply({ embeds: [winEmbed] });
	});
}
