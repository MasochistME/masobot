import { cache } from 'masobot';

export * from './cache';
export * from './db';

export const getOption = <T>(key: string): T =>
	cache.options.find(option => option.option === key)?.value;
