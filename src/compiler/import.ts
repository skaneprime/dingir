import fs from "fs";
import path from "path";
import bytenode from "bytenode";
import coder from "./coder";
import packer from "./packer";
import { env } from "../dingir";
import { systemLogger } from "../services/logger/system";

/** @public */
export function dgImport(entry: string) {
	if (!entry.endsWith(".dg")) {
		return systemLogger.error(`"${entry}" can't import non .dg file`);
	}

	const unpacked = packer.unpack(fs.readFileSync(path.resolve(entry)));

	if (unpacked.meta.dgv !== env.version) {
		systemLogger.warn(
			`"${entry}" is built with DGV-${unpacked.meta.dgv} but current is DGV-${env.version}. It may cause bugs or some issues. Please use valid version or update the module`,
		);
	} else {
		systemLogger.debug(`"${entry}" DGV is compatible`);
	}
	let requireFailed = false;
	for (let i = 0; i < unpacked.meta.externals.length; i++) {
		try {
			require(`${process.cwd()}/node_modules/${unpacked.meta.externals[i]}`);
		} catch (error) {
			systemLogger.fatal(error);
			requireFailed = true;
		}
	}

	if (requireFailed) {
		return systemLogger.fatal("Failed to require externals");
	}

	const mod = { exports: {} };
	console.log(entry);
	bytenode.runBytecode(coder.buffer.decode(unpacked.bytecode))(
		mod.exports,
		(str: string) => {
			/** INVESTIGATE ME. TEMPORAL FIX
			 * // DEEP DG REQUIRE RESULT IN FAIL (2 LVL)
			 * FILE1.DG -> FILE2.DG -> CANVAS = FAILED TO REQUIRE
			 */
			let mod = {};
			try {
				return (mod = require(str));
			} catch (error) {
				if (error instanceof Error && error.message.includes("Cannot find module")) {
					const nodePath = path.relative(`${path.dirname(entry)}`, str);
					const modName = path.basename(str).replace(path.extname(str), "");
					const pathToModule = `${process.cwd()}/node_modules/${modName}/${nodePath}`;
					// INVALID WAY TO REQUIRE NODE_MODULE
					console.log(pathToModule);
					return (mod = require(pathToModule));
				}
				return mod;
			}
		},
		mod,
		entry,
		path.dirname(entry),
	);

	return mod.exports as Record<string, unknown>;
}
