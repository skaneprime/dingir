import { enableDebugIfTrue, program } from ".";
import { Compiler } from "../dingir";

program
	.command("build <source> [destination]")
	.description("Build a DG (compiled bytecode of transpile typescript) from TS")
	.option("-d, --declaration")
	.option("-v, --ver <version>")
	.option("--debug [mode]")
	.option("-P, --performance")
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
			enableDebugIfTrue(options);

			await Compiler.compile(source, { ...options, out });
		},
	);
