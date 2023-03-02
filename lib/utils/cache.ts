import { ObjectId } from 'mongodb';
import { CommandObject, log } from 'arcybot';
import fs from 'fs';
import bigjson from 'big-json';

import { mongo } from 'masobot';
import { getCommandsFromAPI, getAllOptionsFromAPI } from 'api';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Markov = require('markov-strings').default;

type CacheConfig = {
	botDb?: string;
	masochistDb?: string;
};

export interface CacheOption {
	_id: ObjectId;
	option: string;
	value: any;
}

export class Cache {
	public botDb: string;
	public options: CacheOption[] = [];
	public commandList: CommandObject[] = [];
	public markov: typeof Markov | null = null;

	constructor(config: CacheConfig) {
		this.botDb = config.botDb ?? '';
	}

	private async createMarkovCorpus() {
		const colNames = [
			// 'dont_funny',
			// 'general',
			'other_stuff',
			'race_general',
			// 'rage-room',
			// 'shy_guys',
			// 'theme-rooms',
		];
		log.INFO('Fetching quotes dataset...');

		// Fetch all the quotes from all DBs.
		const datasetPromises = colNames.map(async (colName, index) => {
			log.INFO(`-> dataset ${colName} (${index + 1}/${colNames.length})`);
			const collection = mongo.dbs[this.botDb].collection(colName);
			const cursor = collection.find();
			const quotes: string[] = [];

			await cursor.forEach(el => {
				quotes.push(el.content);
			});

			return quotes;
		});
		const datasets = await Promise.all(datasetPromises);

		const markov = new Markov({ stateSize: 3 });

		log.INFO('Preprocessing datasets...');
		datasets.forEach((dataset, index) => {
			log.INFO(`-> dataset (${index + 1}/${colNames.length})`);
			const quotesPreprocessed = preprocessing(dataset);
			log.INFO(`---> final dataset size: ${quotesPreprocessed.length}`);
			log.INFO('---> adding to corpus...');

			markov.addData(quotesPreprocessed);
		});

		log.INFO('Stringifying the corpus...');
		const corpus = markov.export();

		const writeStream = fs.createWriteStream('../corpus.json');
		const stringifyStream = bigjson.createStringifyStream({
			body: corpus,
		});

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
		return markov;
	}

	async update() {
		this.commandList = await getCommandsFromAPI();
		this.options = await getAllOptionsFromAPI();
		this.markov = await this.createMarkovCorpus();
	}
}

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
