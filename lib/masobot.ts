import * as dotenv from 'dotenv';
import { GatewayIntentBits, Partials } from 'discord.js';
import { Arcybot, log } from 'arcybot';

import { Cache, Database } from 'utils';
import { commandsFunctions, customCommands } from 'commands';

dotenv.config();

/************************
 *        CONFIG        *
 ************************/

const botDb = 'masobot';
export const mongo = new Database([{ symbol: botDb, url: process.env['DB'] }]);
export const cache = new Cache({ botDb });

/************************
 *      BOT CONFIG      *
 ************************/

export let bot: Arcybot;

const init = async () => {
	await mongo.init();
	await cache.update();

	const config = {
		discordToken: process.env.DISCORD_TOKEN,
		botId: process.env.BOT_ID,
		intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
		partials: [Partials.Message, Partials.Channel, Partials.Reaction],
	};

	bot = new Arcybot(
		config,
		cache.commandList,
		commandsFunctions,
		customCommands,
	);

	bot.start('Most Masochistic Bot is working.');

	bot.botClient
		.on('error', async error => {
			log.DEBUG('Discord bot error detected');
			console.log(error);
		})
		.on('warn', async (message: string) => {
			log.DEBUG('Discord bot warning detected');
			console.log(message);
		});
};

init();
