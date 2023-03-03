import { ObjectId } from 'mongodb';
import { CommandObject } from 'arcybot';

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

	async update() {
		this.markov = new Markov({ stateSize: 3 });
		this.commandList = await getCommandsFromAPI();
		this.options = await getAllOptionsFromAPI();
		// log.INFO('Importing corpus...');
		// const corpus = await importCorpus();
		// console.log(corpus);
		// log.INFO('Corpus recreated!');
		// this.markov.import(corpus);
	}
}

// const importCorpus = async () => {
// return new Promise((resolve, reject) => {
// 	const filePath = '../corpus.json';
// 	const chunks: string[] = [];
// 	const readStream = fs.createReadStream(filePath);
// 	readStream.on('data', (chunk: any) => {
// 		chunks.push(chunk.toString());
// 	});
// 	readStream.on('end', async () => {
// 		const body = chunks.join('');
// 		console.log(body.substring(body.length - 100));
// 		const parsed = await bigjson.parse({ body });
// 		resolve(parsed);
// 	});
// 	readStream.on('error', err => {
// 		console.log(err);
// 	});
// });
// };
