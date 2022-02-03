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
			require(unpacked.meta.externals[i]);
		} catch (error) {
			systemLogger.fatal(error);
			requireFailed = true;
		}
	}

	if (requireFailed) {
		return systemLogger.fatal("Failed to require externals");
	}

	const mod = { exports: {} };
	bytenode.runBytecode(coder.buffer.decode(unpacked.bytecode))(
		mod.exports,
		require,
		mod,
		entry,
		path.dirname(entry),
	);

	return mod.exports;
}
