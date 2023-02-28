import { ObjectId } from 'mongodb';
import { CommandObject } from 'arcybot';

import { getCommandsFromAPI, getAllOptionsFromAPI } from 'api';

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

	constructor(config: CacheConfig) {
		this.botDb = config.botDb ?? '';
	}

	async update() {
		this.commandList = await getCommandsFromAPI();
		this.options = await getAllOptionsFromAPI();
	}
}
