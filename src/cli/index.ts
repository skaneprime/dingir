import { Command } from "commander";
import { env } from "../dingir";
import { systemLogger } from "../services/logger/system";

export const program = new Command("dingir").version(env.version);
export const enableDebugIfTrue = (options?: { debug?: string | boolean }) => {
	if (typeof options?.debug == "string" && options.debug.includes("saitama")) {
		Object.defineProperty(process.env, "SAITAMAS_SUPER_SECRET_DEBUG", {
			enumerable: false,
			configurable: false,
			value: true,
			writable: false,
		});
		systemLogger.enableLevel(1);
	}

	if (options?.debug == true || options?.debug != "satiama") {
		systemLogger.enableLevel(1);
	}
};

import "./run";
import "./build";
import "./update";
import "./publish";
import "./install";

program.parse(process.argv);
