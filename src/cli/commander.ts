import { env } from '../dingir';
import { Command } from 'commander';

export const program = new Command('dingir').version(env.version);
