import { mkdir, writeFile } from "fs/promises";
import { enableDebugIfTrue, program } from ".";
import { systemLogger } from "../services/logger/system";
import api from "../server/api";
import { existsSync } from "fs";

program
	.command("install <library>")
	.description("Installs existing library from server")
	.option("--debug [mode]")
	.action(async (library: string, options: { debug?: boolean | string }) => {
		const libFolder = `${process.cwd()}/dingir_libs`;
		enableDebugIfTrue(options);

		systemLogger.debug(`[install lib]: searching ${library}`);

		const [lib, ver] = library.split("@");
		const fetchedLib = await api.libs.getLib(lib, ver);

		systemLogger.debug(`[install lib]: found ${lib}@${fetchedLib.version}`);

		if (!existsSync(libFolder)) {
			systemLogger.debug(`[install lib]: creating lib folder`);
			await mkdir(libFolder);
		}

		if (fetchedLib.file) {
			systemLogger.debug(`[install lib]: writing ${lib}@${fetchedLib.version}.dg`);
			await writeFile(`${libFolder}/${lib}@${fetchedLib.version}.dg`, fetchedLib.file);
		}

		if (fetchedLib.decl) {
			systemLogger.debug(`[install lib]: writing ${lib}@${fetchedLib.version}.d.ts`);
			await writeFile(`${libFolder}/${lib}@${fetchedLib.version}.d.ts`, fetchedLib.decl);
		}

		systemLogger.info(`[install lib]: ${lib}@${fetchedLib.version} was installed!`);
	});
