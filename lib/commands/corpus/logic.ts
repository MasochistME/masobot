import { DiscordInteraction, log } from 'arcybot';
import fs from 'fs';
import { JsonStreamStringify } from 'json-stream-stringify';

import { cache, mongo } from 'masobot';
import { collections } from './utils';

/**
 * Create a Markov corpus.
 * @param interaction DiscordInteraction
 * @return void
 */
export const corpus = async (
	interaction: DiscordInteraction,
): Promise<void> => {
	await interaction.deferReply();
	if (interaction.member?.user.id !== '165962236009906176') {
		interaction.editReply('Only Arcy can do this.');
		return;
	}

	// Disabling function to not overwrite stuff by mistake
	const isDisabled = false;
	if (isDisabled) {
		interaction.editReply('Believe me, you DONT want to do this.');
		return;
	}

	interaction.editReply(
		'Corpus creation initiated. This will take about 5 hours.',
	);
	await createMarkovCorpus();
};

/**
 * Actual creation of the Markov corpus.
 */
const createMarkovCorpus = async () => {
	log.INFO('Fetching quotes dataset...');

	// Fetch all the quotes from all DBs, promisified.
	const datasetPromises = collections.map(async (colName, index) => {
		log.INFO(`-> dataset ${colName} (${index + 1}/${collections.length})`);
		const collection = mongo.dbs[cache.botDb].collection(colName);
		const cursor = collection.find();
		const quotes: string[] = [];

		await cursor.forEach(el => {
			quotes.push(el.content);
		});

		return quotes;
	});

	const datasets = await Promise.all(datasetPromises);

	/**
	 * Preprocessing every quote collection separately.
	 */
	log.INFO('Preprocessing datasets...');
	datasets.forEach((dataset, index) => {
		log.INFO(`-> dataset (${index + 1}/${collections.length})`);
		const quotesPreprocessed = preprocessing(dataset);
		log.INFO(`---> final dataset size: ${quotesPreprocessed.length}`);
		log.INFO('---> adding to corpus...');
		cache.markov.addData(quotesPreprocessed);
	});

	log.INFO('Stringifying the corpus...');
	const corpus = cache.markov.export();
	const writeStream = fs.createWriteStream('../corpus.json');
	const jsonStream = new JsonStreamStringify(
		Promise.resolve(Promise.resolve(corpus)),
	);
	jsonStream.pipe(writeStream);
	jsonStream.on('end', () => {
		log.INFO('Done...?');
	});

	writeStream.on('finish', () => {
		log.INFO('Corpus saved.');
	});
};

const preprocessing = (arr: string[]) => {
	const preprocessed = arr
		.map((text: string) =>
			text
				// everything to lowercase
				.toLowerCase()
				// remove newlines
				.replace(/\n/g, '')
				// remove all links
				.replace(/(?=http)(.*?)( |$)/g, '')
				// remove all emojis
				.replace(/(?=<:)(.*?)(>|$)/g, '')
				// remove leftover whitespaces
				.trim()
				// replace all endline symbols with # so it's easier
				.replace(/\. |\?|!|“|”|"|,/g, '#')
				// split sentences by endline character
				.split('#'),
		)
		// flatten sentences if they were split by endline character
		.flat()
		// remove endline character replacement
		.map(text => text.replace('#', '').trim())
		// remove quotes with length 0
		.filter(text => text?.length);
	return preprocessed;
};
