import { DiscordInteraction, log } from 'arcybot';
import fs from 'fs';
// import bigjson from 'big-json';
import { default as JSONStream } from 'JSONStream';

import { cache, mongo } from 'masobot';

/**
 * Sends a meme to the channel.
 * @param interaction DiscordInteraction
 * @return void
 */
export const corpus = async (
	interaction: DiscordInteraction,
): Promise<void> => {
	if (interaction.member?.user.id !== '165962236009906176') {
		interaction.reply('Only Arcy can do this.');
		return;
	}
	const dupa = false;

	if (dupa) {
		interaction.reply('Believe me, you DONT want to do this.');
		return;
	}

	await createMarkovCorpus();

	interaction.reply('Corpus creation initiated. This will take about 5 hours.');
};

const createMarkovCorpus = async () => {
	// Sorted by database size - the biggest the corpus the longer building it takes,
	// so it makes the most sense to start from the small datasets
	const colNames = [
		'race_general',
		// 'shy_guys',
		// 'other_stuff',
		// 'theme-rooms',
		// 'dont_funny',
		// 'rage-room',
		// 'general',
	];
	log.INFO('Fetching quotes dataset...');

	// Fetch all the quotes from all DBs.
	const datasetPromises = colNames.map(async (colName, index) => {
		log.INFO(`-> dataset ${colName} (${index + 1}/${colNames.length})`);
		const collection = mongo.dbs[cache.botDb].collection(colName);
		const cursor = collection.find();
		const quotes: string[] = [];

		await cursor.forEach(el => {
			quotes.push(el.content);
		});

		return quotes;
	});
	const datasets = await Promise.all(datasetPromises);

	log.INFO('Preprocessing datasets...');
	datasets.forEach((dataset, index) => {
		log.INFO(`-> dataset (${index + 1}/${colNames.length})`);
		const quotesPreprocessed = preprocessing(dataset);
		log.INFO(`---> final dataset size: ${quotesPreprocessed.length}`);
		log.INFO('---> adding to corpus...');

		cache.markov.addData(quotesPreprocessed);
	});

	log.INFO('Stringifying the corpus...');
	const corpus = cache.markov.export();

	const stringifyStream = JSONStream.stringifyStream(corpus);
	const writeStream = fs.createWriteStream('../corpus.json');

	stringifyStream.on('data', (strChunk: string) => {
		writeStream.write(strChunk, 'utf-8');
	});

	stringifyStream.on('finish', () => {
		log.INFO('Done!');
	});

	writeStream.on('finish', () => {
		log.INFO('Corpus saved.');
	});

	log.INFO('Done...?');
};

const preprocessing = (arr: string[]) => {
	const preprocessed = arr
		.map(
			(text: string) =>
				text
					.toLowerCase() // everything to lowercase
					.replace(/\n/g, '') // remove newlines
					.replace(/(?=http)(.*?)( |$)/g, '') // remove all links
					.replace(/(?=<:)(.*?)(>|$)/g, '') // remove all emojis
					.trim() // remove leftover whitespaces
					.replace(/\. |\?|!|“|”|"|,/g, '#') // replace all endline symbols with # so it's easier
					.split('#'), // split sentences by endline character
		)
		.flat() // flatten sentences if they were split by endline character
		.map(text => text.replace('#', '').trim()) // remove endline character replacement
		.filter(text => text?.length); // remove quotes with length 0
	return preprocessed;
};
