import path from "path";
import { enableDebugIfTrue, program } from ".";
import api from "../server/api";

program
	.command("publish <libpath> <declfile>")
	.description("Will publish library to dingir.xyz")
	.option("-v, --version <version>")
	.option("-n, --name <name>")
	.option("--debug [mode]")
	.action(
		async (
			libpath: string,
			declpath: string,
			options: {
				debug?: boolean | string;
				name: string;
				version: string;
			},
		) => {
			enableDebugIfTrue(options);

			await api.libs.uploadLib(
				path.resolve(process.cwd(), libpath),
				path.resolve(process.cwd(), declpath),
				{ name: options.name, version: options.version },
			);
		},
	);
