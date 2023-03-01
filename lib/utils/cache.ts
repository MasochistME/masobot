import { ObjectId } from 'mongodb';
import { CommandObject, log } from 'arcybot';
import fs from 'fs';

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
			'dont_funny',
			'general',
			'other_stuff',
			'race_general',
			'rage-room',
			'shy_guys',
			'theme-rooms',
		];
		log.INFO('Fetching quotes dataset...');

		const quotes: string[] = [];

		const promises = colNames.map(async (colName, index) => {
			log.INFO(`-> dataset ${colName} (${index + 1}/${colNames.length})`);
			const collection = mongo.dbs[this.botDb].collection(colName);
			const cursor = collection.find();
			return await cursor.forEach(el => {
				quotes.push(el.content);
			});
		});

		await Promise.all(promises);

		log.INFO(`Dataset size: ${quotes.length}`);

		log.INFO('Building Markov corpus...');
		const markov = new Markov({ stateSize: 2 });
		markov.addData(quotes);

		const corpus = markov.export();
		fs.writeFile(`../corpus.json`, JSON.stringify(corpus), err => {
			if (err) console.log(err);
			else log.INFO('Corpus saved.');
		});
		log.INFO('Done!');

		return markov;
	}

	async update() {
		this.commandList = await getCommandsFromAPI();
		this.options = await getAllOptionsFromAPI();
		this.markov = await this.createMarkovCorpus();
	}
}
