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

		require.extensions[".dg"] = (module, filename) => {
			module.exports = Dingir.Compiler.import(filename);
			module.loaded = true;
			console.log("REQUIRING DG", module, filename);
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
				__DECLARATION_PATH__: __filename.endsWith(".ts")
					? path.resolve(process.cwd(), "bin", "dingir.d.ts")
					: path.resolve(process.cwd(), "dingir.d.ts"),
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
			"typesript-node",
		);

		dingirVM.run(`require(__MAIN_FILE_PATH__)`, path.basename(process.env.source));
	}
})();

program
	.command("run <source>")
	.description("Run a DG or TS")
	.option("-d, --debug [mode]")
	.action(async (source: string, options: { debug?: string | boolean }) => {
		if (typeof options?.debug == "string" && options.debug.includes("saitama")) {
			Object.defineProperty(process.env, "SAITAMAS_SUPER_SECRET_DEBUG", {
				enumerable: false,
				configurable: false,
				value: true,
				writable: false,
			});
			systemLogger.enableLevel(1);
		}

		if (options.debug == true || options?.debug != "satiama") {
			systemLogger.enableLevel(1);
		}

		if (cluster.isPrimary) {
			await server.serve();
			const worker = cluster.fork({ source, debug: options.debug });

			worker.on("exit", async (code) => {
				systemLogger.debug(`${chalk.cyanBright("[run]")} process finished with exit code`, code);
				await server.close();
			});
		}
	});
