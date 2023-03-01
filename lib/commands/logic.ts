import { CommandFn } from 'arcybot';

import { fetch } from './fetch/logic';
import { speak } from './speak/logic';

export const commandsFunctions: CommandFn[] = [fetch, speak];
