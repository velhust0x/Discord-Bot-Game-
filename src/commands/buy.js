import items from '../data/items.js';
import { getCurrencyName } from '../lib/settings.js';
import { getBalance, subtractBalance } from '../lib/economy.js';
import { EmbedBuilder } from 'discord.js';

export const name = 'buy';

export async function execute(message, args) {
	const itemName = args.join(' ');
	if (!itemName) {
		const embed = new EmbedBuilder().setTitle('Usage').setDescription('!buy <item name>').setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}
	const item = items.find((i) => i.name.toLowerCase() === itemName.toLowerCase());
	if (!item) {
		const embed = new EmbedBuilder().setTitle('Item Not Found').setDescription('Please choose an item from !shop.').setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}

	// Role that matches item name (case-insensitive)
	const role = message.guild.roles.cache.find((r) => r.name.toLowerCase() === item.name.toLowerCase());
	if (!role) {
		const embed = new EmbedBuilder().setTitle('Role Missing').setDescription(`Role "${item.name}" does not exist on this server.`).setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}

	// One-time purchase: if user already has this role, block
	if (message.member.roles.cache.has(role.id)) {
		const embed = new EmbedBuilder().setTitle('Already Owned').setDescription(`You already own ${item.name}.`).setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}

	// Enforce progression: must own all cheaper items' roles
	const sorted = [...items].sort((a, b) => a.price - b.price);
	const idx = sorted.findIndex((i) => i.name.toLowerCase() === item.name.toLowerCase());
	const required = sorted.slice(0, idx);
	const missing = required.filter((req) => {
		const reqRole = message.guild.roles.cache.find((r) => r.name.toLowerCase() === req.name.toLowerCase());
		return !reqRole || !message.member.roles.cache.has(reqRole.id);
	});
	if (missing.length > 0) {
		const list = missing.map((m) => m.name).join(', ');
		const embed = new EmbedBuilder()
			.setTitle('Prerequisites Not Met')
			.setDescription(`You must own previous roles before buying ${item.name}: ${list}`)
			.setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}

	// Balance check
	const bal = getBalance(message.guild.id, message.author.id);
	if (bal < item.price) {
		const embed = new EmbedBuilder().setTitle('Insufficient Balance').setDescription(`Price: ${item.price} ${getCurrencyName()}. Your balance: ${bal} ${getCurrencyName()}.`).setTimestamp(Date.now());
		return message.reply({ embeds: [embed] });
	}

	// Deduct and grant role
	subtractBalance(message.guild.id, message.author.id, item.price);
	try { await message.member.roles.add(role); } catch {}

	const embed = new EmbedBuilder()
		.setTitle('Purchase Successful')
		.addFields(
			{ name: 'Item', value: item.name, inline: true },
			{ name: 'Price', value: `${item.price} ${getCurrencyName()}`, inline: true },
			{ name: 'Granted Role', value: `<@&${role.id}>`, inline: true }
		)
		.setTimestamp(Date.now());
	await message.reply({ embeds: [embed] });
} 