import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, Collection, Events, EmbedBuilder } from 'discord.js';
import { ensureDatabase } from './lib/db.js';
import { getPrefix, getAllowedChannelIds, getGreetingChannelId, getGreetingTime } from './lib/settings.js';
import { loadCommands } from './lib/loader.js';

await ensureDatabase();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessageReactions
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();
await loadCommands(client);

function scheduleDailyGreeting() {
	const channelId = getGreetingChannelId();
	if (!channelId) return;
	const [hh, mm] = getGreetingTime().split(':').map((v) => Number(v));
	function msUntilNext() {
		const now = new Date();
		const next = new Date();
		next.setHours(hh, mm, 0, 0);
		if (next <= now) next.setDate(next.getDate() + 1);
		return next.getTime() - now.getTime();
	}
	async function postGreeting() {
		try {
			const channel = await client.channels.fetch(channelId);
			const embed = new EmbedBuilder()
				.setTitle('Good Morning')
				.setDescription('Gneko fam, wish you all have a good day! Dont forget to !gneko to get $NEKO daily banger')
				.setTimestamp(Date.now());
			await channel.send({ content: '@everyone', embeds: [embed], allowedMentions: { parse: ['everyone'] } });
		} catch (e) {
			console.error('Greeting error', e);
		}
		setTimeout(postGreeting, 24 * 60 * 60 * 1000);
	}
	setTimeout(postGreeting, msUntilNext());
}

client.once(Events.ClientReady, (c) => {
	console.log(`Logged in as ${c.user.tag}`);
	scheduleDailyGreeting();
});

client.on(Events.MessageCreate, async (message) => {
	if (message.author.bot || !message.guild) return;
	const prefix = getPrefix();
	if (!message.content.startsWith(prefix)) return;

	const allowed = getAllowedChannelIds();
	if (allowed.length > 0 && !allowed.includes(message.channel.id)) {
		return; // silently ignore commands outside allowed channels
	}

	const args = message.content.slice(prefix.length).trim().split(/\s+/);
	const commandName = args.shift()?.toLowerCase();
	const command = client.commands.get(commandName);
	if (!command) return;
	try {
		await command.execute(message, args, client);
	} catch (err) {
		console.error(err);
		await message.reply('An error occurred while executing that command.');
	}
});

client.login(process.env.DISCORD_TOKEN); 