import { DiscordInteraction } from 'types';

export const foo = async (interaction: DiscordInteraction): Promise<void> => {
	const date = new Date().toLocaleDateString();
	interaction.reply(`Current date is: ${date}`);
};
