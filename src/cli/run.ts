import path from "path";
import chalk from "chalk";
import cluster from "cluster";
import server from "../server";
import { NodeVM } from "vm2";
import { program } from ".";
import { Dingir } from "..";
import { systemLogger } from "../services/logger/system";

void (async function runCluster() {
	if (cluster.isWorker && process.env.source) {
		cluster.worker?.process.channel?.unref();

		const dingirVM = new NodeVM({
			compiler(code, filename) {
				systemLogger.debug(
					`${chalk.cyanBright("[run]")} executing ${chalk.green(`"${filename}"`)}`,
				);
				return code;
			},
			sandbox: {
				Dingir: Dingir,
				__MAIN_FILE_PATH__: process.env.source,
				__TS_NODE_PATH__: __filename.endsWith(".ts")
					? `${process.cwd()}/node_modules/ts-node`
					: `${__dirname}../../node_modules/ts-node`,
				__DECLARATION_PATH__: __filename.endsWith(".ts")
					? path.resolve(process.cwd(), "bin", "dingir.d.ts")
					: path.resolve(process.cwd(), "dingir.d.ts"),
			},
			require: { builtin: ["*"], external: true },
			sourceExtensions: ["dg", "js", "ts"],
			console: "inherit",
		});

		dingirVM.run(
			`require(__TS_NODE_PATH__).register({ 
                compilerOptions: { 
                    target: "es6",
                    noImplicitAny: false,
                }, 
				transpileOnly: true,
                files: true
            });`,
			"typesript-node",
		);

		require.extensions[".dg"] = (module, filename) => {
			module.exports = Dingir.compiler.import(filename);
			return module;
		};

		dingirVM.run(`require(__MAIN_FILE_PATH__)`, path.basename(process.env.source));
	}
})();

program
	.command("run <source>")
	.description("Run a DG or TS")
	.option("-d, --debug")
	.action(async (source: string, options: { debug?: boolean }) => {
		if (cluster.isPrimary) {
			await server.serve();
			const worker = cluster.fork({ source, debug: options.debug });

			worker.on("exit", async (code) => {
				systemLogger.debug(`${chalk.cyanBright("[run]")} process finished with exit code`, code);
				await server.close();
			});
		}
	});
