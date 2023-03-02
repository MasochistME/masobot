import { TextBasedChannel, Message } from 'discord.js';
import { DiscordInteraction, log } from 'arcybot';
import { mongo, cache } from 'masobot';

/**
 * Fetches all messages from the channel where this command was invoked.
 * @param interaction DiscordInteraction
 * @return void
 */
export const fetch = async (interaction: DiscordInteraction): Promise<void> => {
	const { channel } = interaction;
	if (interaction.member?.user.id !== '165962236009906176') {
		interaction.reply('Only Arcy can do this.');
		return;
	}

	if (!channel) {
		interaction.reply(
			'Something weont wrong. Apparently this channel does not exist what, for reasons obvious, is not true.',
		);
		return;
	}

	interaction.reply('The test has started, please wait for a while.');
	getMessages(interaction, channel);
};

const getMessages = async (
	interaction: DiscordInteraction,
	channel: TextBasedChannel | null,
	prevLastMsg?: Message,
) => {
	console.log(`Next batch started - 100 msgs before ${prevLastMsg?.id}...`);
	const messagesRaw = await channel?.messages.fetch({
		limit: 100,
		...(prevLastMsg?.id && { before: prevLastMsg.id }),
	});

	const lastMsg = messagesRaw?.at(messagesRaw.size - 1);
	const messages = (messagesRaw ?? [])
		// @ts-ignore
		.filter(
			// @ts-ignore
			message =>
				message &&
				message.content?.length &&
				!message.author?.bot &&
				!message.content.startsWith('!'),
		)
		// @ts-ignore
		.map(message => ({
			content: message.content,
			from: message.author?.id ?? null,
		}));

	if (messages.length)
		await mongo.dbs[cache.botDb].collection('general').insertMany(messages);
	else {
		log.INFO('Finished fetching messages from this channel');
		interaction.editReply('The test has concluded.');
		return;
	}

	if (lastMsg) {
		setTimeout(() => {
			getMessages(interaction, channel, lastMsg);
		}, 1000);
	}
};
