import path from 'path';
import chalk from 'chalk';
import cluster from 'cluster';
import { NodeVM } from 'vm2';
import { program } from './commander';
import { Close, Serve } from '../server';
import process from 'process';

if (cluster.isWorker) {
  cluster.worker?.process.channel?.unref();
  void (async function () {
    if (!process.env.source) return;

    System.debug = !!process.env.debug;

    const DingirVM = new NodeVM({
      compiler(code, filename) {
        System.Debug(`${chalk.cyanBright('[run]')} executing ${chalk.green(`"${filename}"`)}`);
        return code;
      },
      sandbox: {
        Dingir,
        __MAIN_FILE_PATH__: process.env.source,
        __TS_NODE_PATH__: __filename.endsWith('.ts') ? 'ts-node' : `${__dirname}../../node_modules/ts-node`,
        __PATH_TO_DECLARATION__: path.resolve(process.cwd(), 'dingir.d.ts'),
      },
      require: { builtin: ['*'], external: true },
      sourceExtensions: ['js', 'ts'],
      console: 'inherit',
    });

    DingirVM.run(
      `
				require(__TS_NODE_PATH__).register({ 
					transpileOnly: ${__filename.endsWith('.ts')},
					compilerOptions: { target: "es6" }, 
					${__filename.endsWith('.ts') ? '' : `files: [__PATH_TO_DECLARATION__]`} 
				});
			`,
      'ts-node',
    );

    DingirVM.run(
      `
				__MAIN_FILE_PATH__.endsWith(".dg") 
				? Dingir.Compiler.ImportDG(__MAIN_FILE_PATH__) 
				: require(__MAIN_FILE_PATH__)
			`,
      path.basename(process.env.source),
    );
  })();
}

program
  .command('run <source>')
  .description('Run a DG or TS')
  .option('-d, --debug')
  .action(async (source: string, options: { debug?: boolean }) => {
    if (cluster.isPrimary) {
      System.debug = options.debug || false;

      await Serve();
      const worker = cluster.fork({ source, debug: System.debug });

      worker.on('exit', async (code) => {
        System.Debug(`${chalk.cyanBright('[run]')} process finished with exit code`, code);
        await Close();
      });
    }
  });
/**
    if(filename.endsWith(".tsz")) {
        const transpiled = ts.transpile(code, { 
            module: ts.ModuleKind.Node12,
            target: ts.ScriptTarget.ES5,
            sourceMap: true,
            inlineSourceMap: true
        }, filename);
        console.log(transpiled)
        System.Debug(`${chalk.magentaBright("[tvm]")} transpiling ${chalk.green(`"${filename}"`)}`);
        return transpiled;
    }
*/
