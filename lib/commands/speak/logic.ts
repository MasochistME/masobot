import { DiscordInteraction, log } from 'arcybot';
import { cache } from 'masobot';

/**
 * Sends a meme to the channel.
 * @param interaction DiscordInteraction
 * @return void
 */
export const speak = async (interaction: DiscordInteraction): Promise<void> => {
	if (interaction.member?.user.id !== '165962236009906176') {
		interaction.reply('Only Arcy can do this.');
		return;
	}

	const options = {
		maxTries: 100, // Give up if I don't have a sentence after 20 tries (default is 10)
		// If you want to get seeded results, you can provide an external PRNG.
		prng: Math.random, // Default value if left empty
		// You'll often need to manually filter raw results to get something that fits your needs.
		filter: (result: any) => {
			const length = result.string.split(' ').length;
			return length < 10 && length > 4;
		},
	};

	try {
		// Generate a sentence
		if (cache.markov) {
			const result = cache.markov?.generate(options);
			const text = `${result.string
				.substring(0, 1)
				.toUpperCase()}${result.string.substring(1)}.`;
			interaction.reply(text);
			return;
		}
		interaction.reply(
			'The test has failed - could not generate Markov corpus.',
		);
	} catch (err) {
		interaction.reply('The test has failed - could not generate a sentence.');
	}
};
