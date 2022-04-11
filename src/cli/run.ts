import path from "path";
import chalk from "chalk";
import { promisify } from "util";
import { exec } from "child_process";
import cluster from "cluster";
import server from "../server";
import { NodeVM } from "vm2";
import { enableDebugIfTrue, program } from ".";
import { Dingir } from "..";
import { systemLogger } from "../services/logger/system";

void (async function runCluster() {
	if (cluster.isWorker && process.env.source) {
		if(process.env.IS_SERVER != "true") {
			cluster.worker?.process.channel?.unref();
		}

		if (process.env.debug) {
			systemLogger.enableLevel(Dingir.Logger.LogLevel.DEBUG);
		}

		require.extensions[".dg"] = (module, filename) => {
			module.exports = Dingir.Compiler.import(filename);
			module.loaded = true;
			return module;
		};

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
			},
			require: {
				builtin: ["*"],
				external: true,
				customRequire: require,
			},
			sourceExtensions: ["dg", "js", "ts"],
			console: "inherit",
		});

		dingirVM.run(
			`require(__TS_NODE_PATH__).register({ 
                compilerOptions: { 
                    target: "es6",
                    noImplicitAny: false,
                },
				${__filename.endsWith(".ts") ? "transpileOnly: true," : ""}
                files: true
            });`,
			"ts-node-register",
		);

		dingirVM.run(`require(__MAIN_FILE_PATH__)`, path.basename(process.env.source));
	}
})();

program
	.command("run <source>")
	.description("Run a DG or TS")
	.option("-d, --debug [mode]")
	.option("-P, --performance")
	.option("-S, --server")
	.option("-E, --externals [mod...]")
	.action(
		async (
			source: string,
			options: {
				debug?: string | boolean;
				server?: boolean;
				performance?: boolean;
				externals?: string[];
			},
		) => {
			if (options.externals) {
				await Dingir.Performance.asyncFunc(promisify(exec), `npm i ${options.externals.join(" ")}`);
			}

			enableDebugIfTrue(options);

			if (cluster.isPrimary) {
				await Dingir.Performance.asyncFunc(server.serve);

				const logLabel = Dingir.Performance.setLabel(
					`${chalk.cyan(`[Cluster: ${chalk.green(`"${source}"`)}]`)} execution time took`,
				);
				const worker = cluster.fork({ 
					source: source, 
					debug: options.debug,
					IS_SERVER: `${options.server}`
				});

				worker.on("exit", async (code) => {
					if (logLabel) {
						logLabel();
					}
					systemLogger.debug(`${chalk.cyanBright("[run]")} process finished with exit code`, code);

					await Dingir.Performance.asyncFunc(server.close);
				});
			}
		},
	);
