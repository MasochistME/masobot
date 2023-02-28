import * as dotenv from 'dotenv';

import { Arcybot } from 'arcybot';

import { mock as commandsObject } from './commands/mock';
import { foo } from './commands/commands';

dotenv.config();

const commandsFunctions = [foo];

const bot = new Arcybot(
	{
		discordToken: process.env.DISCORD_TOKEN,
		botId: process.env.BOT_ID,
	},
	commandsObject,
	commandsFunctions,
);

bot.start('Bot started!');
