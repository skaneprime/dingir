import fs from "fs";
import path from "path";
import bytenode from "bytenode";
import coder from "./coder";
import packer from "./packer";
import { env } from "../dingir";
import { systemLogger } from "../services/logger/system";

/** @public */
export function dgImport(entry: string) {
	try {
		entry = require.resolve(entry, { paths: [process.cwd()] });
	} catch (error) {
		systemLogger.error(`Can't find file:`, error);
	}

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
			const externalPath = require.resolve(unpacked.meta.externals[i], {
				paths: [process.cwd(), `${process.cwd()}/node_modules`],
			});
			require(externalPath);
		} catch (error) {
			systemLogger.fatal(error);
			requireFailed = true;
		}
	}

	if (requireFailed) {
		return systemLogger.fatal("Failed to require externals");
	}

	function pseudoRequire(id: string) {
		const externalPath = require.resolve(id, {
			paths: [process.cwd(), `${process.cwd()}/node_modules`],
		});
		return require(externalPath);
	}

	Object.defineProperties(pseudoRequire, {
		extensions: { value: require.extensions },
		resolve: { value: require.resolve },
		cache: { value: require.cache },
		main: { value: require.main },
	});

	const bytecode = coder.buffer.decode(unpacked.bytecode);
	const mod = { exports: {} };

	bytenode.runBytecode(bytecode)(mod.exports, pseudoRequire, mod, entry, path.dirname(entry));
	return mod.exports as Record<string, unknown>;
}

/**
 *
 * ISSUE IN IMPORT FIX DEEP REQUIRE
 */
