import { CommandFn } from 'arcybot';

import { corpus } from './corpus/logic';
import { fetch } from './fetch/logic';
import { speak } from './speak/logic';

export const commandsFunctions: CommandFn[] = [corpus, fetch, speak];
