import { program } from ".";
import { Compiler } from "../dingir";
import { systemLogger } from "../services/logger/system";

program
	.command("build <source> [destination]")
	.description("Build a DG (compiled bytecode of transpile typescript) from TS")
	.option("-d, --declaration")
	.option("-v, --ver <version>")
	.option("--debug [mode]")
	.option("-m, --minify")
	.option("-e, --externals [mod...]")
	.action(
		async (
			source: string,
			out: string | undefined,
			options: {
				debug?: boolean | string;
				declaration?: boolean;
				minify?: boolean;
				externals?: string[];
				ver?: string;
				supersecretdebug?: boolean;
			},
		) => {
			if (typeof options?.debug == "string" && options.debug.includes("saitama")) {
				Object.defineProperty(process.env, "SAITAMAS_SUPER_SECRET_DEBUG", {
					enumerable: false,
					configurable: false,
					value: true,
					writable: false,
				});
				systemLogger.enableLevel(1);
			}

			if (options.debug == true || options.debug != "satiama") {
				systemLogger.enableLevel(1);
			}

			await Compiler.compile(source, { ...options, out });
		},
	);
