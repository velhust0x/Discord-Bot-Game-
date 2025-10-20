import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function loadCommands(client) {
	const commandsDir = path.resolve('src/commands');
	if (!fs.existsSync(commandsDir)) fs.mkdirSync(commandsDir, { recursive: true });
	const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.js'));
	for (const file of files) {
		const absPath = path.resolve(commandsDir, file);
		const mod = await import(pathToFileURL(absPath).href);
		if (mod.name && typeof mod.execute === 'function') {
			client.commands.set(mod.name, mod);
		}
	}
} 