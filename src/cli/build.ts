import { program } from './commander';
import * as Compiler from '../compiler';

program
  .command('build <source> [destination]')
  .description('Build a DG (compiled bytecode of transpile typescript) from TS')
  .option('-d, --declaration')
  .option('-v, --ver <version>')
  .option('--debug')
  .option('-m, --minify')
  .option('-e, --externals [mod...]')
  .action(
    async (
      source: string,
      out: string | undefined,
      options: {
        debug?: boolean;
        declaration?: boolean;
        minify?: boolean;
        externals?: string[];
        ver?: string;
      },
    ) => {
      System.debug = options.debug || false;
      await Compiler.CompileToDGL(source, { ...options, out });
    },
  );
