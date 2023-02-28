import { DiscordInteraction } from 'arcybot';

/**
 * Sends a meme to the channel.
 * @param interaction DiscordInteraction
 * @return void
 */
export const talk = async (interaction: DiscordInteraction): Promise<void> => {
	interaction.reply(`_dupa_`);
};
