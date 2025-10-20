import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { addBalance } from '../lib/economy.js';
import { getWhitelistedRoleIds, getCurrencyName } from '../lib/settings.js';

export const name = 'ga';

export async function execute(message, args) {
	const allowedRoles = new Set(getWhitelistedRoleIds());
	const hasWhitelistedRole = message.member.roles.cache.some((r) => allowedRoles.has(r.id));
	if (!(message.member.permissions.has('ManageGuild') || hasWhitelistedRole)) {
		const embed = new EmbedBuilder().setTitle('Permission Denied').setDescription('You are not allowed to start a giveaway.').setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}

	const amount = Number(args[0]);
	const seconds = Number(args[1]);
	if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(seconds) || seconds <= 0) {
		const embed = new EmbedBuilder().setTitle('Usage').setDescription('!ga <amount> <seconds> (e.g. !ga 100 120)').setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}
	const currency = getCurrencyName();
	const durationMs = Math.floor(seconds * 1000);
	const endAt = Date.now() + durationMs;

	const participants = new Map(); // userId -> username

	const embed = new EmbedBuilder()
		.setTitle(`🪂 ${currency} Airdrop! 🪂`)
		.setDescription(`A generous user is airdropping ${amount} ${currency}!\nClick the button below to claim your share.`)
		.addFields(
			{ name: 'Amount', value: `${amount} ${currency}`, inline: true },
			{ name: 'Participants', value: '0', inline: true },
			{ name: 'Time Left', value: `${seconds} seconds`, inline: true }
		)
		.setFooter({ text: 'The reward will be distributed equally among all participants when time expires.' })
		.setTimestamp(endAt);

	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder().setCustomId('ga_join').setLabel(`$ Claim`).setStyle(ButtonStyle.Success)
	);

	const msg = await message.reply({ embeds: [embed], components: [row] });

	const collector = msg.createMessageComponentCollector({ time: durationMs });

	collector.on('collect', async (interaction) => {
		if (interaction.customId !== 'ga_join') return interaction.deferUpdate();
		if (interaction.user.bot) return interaction.deferUpdate();
		if (participants.has(interaction.user.id)) {
			return interaction.reply({ content: 'You have already claimed your share!', flags: 64 });
		}
		participants.set(interaction.user.id, interaction.user.username);
		await interaction.reply({ content: `You've successfully claimed your share of the airdrop! Wait until the timer ends to receive your ${currency}.`, flags: 64 });
		
		// Update embed
		const remaining = Math.ceil((endAt - Date.now()) / 1000);
		embed.setFields(
			{ name: 'Amount', value: `${amount} ${currency}`, inline: true },
			{ name: 'Participants', value: `${participants.size}`, inline: true },
			{ name: 'Time Left', value: `${remaining} seconds`, inline: true }
		);
		await msg.edit({ embeds: [embed], components: [row] });
	});

	collector.on('end', async () => {
		row.components.forEach((b) => b.setDisabled(true));
		await msg.edit({ components: [row] });
		const ids = Array.from(participants.keys());
		if (ids.length === 0) {
			const embed = new EmbedBuilder().setTitle('No Participants').setDescription('No one joined the airdrop.').setTimestamp(Date.now());
			return msg.reply({ embeds: [embed] });
		}
		const perUser = Math.floor(amount / ids.length);
		if (perUser <= 0) {
			const embed = new EmbedBuilder().setTitle('Insufficient Reward').setDescription(`Not enough total reward to split among ${ids.length} participants.`).setTimestamp(Date.now());
			return msg.reply({ embeds: [embed] });
		}
		for (const id of ids) {
			addBalance(message.guild.id, id, perUser);
		}
		const preview = Array.from(participants.values()).slice(0, 10).join(', ');
		const more = ids.length > 10 ? ` and ${ids.length - 10} more` : '';
		const embed = new EmbedBuilder()
			.setTitle('Airdrop Complete')
			.setDescription(`Distributed ${perUser} ${currency} to each of ${ids.length} participants: ${preview}${more}.`)
			.setTimestamp(Date.now());
		await msg.reply({ embeds: [embed] });
	});
} 