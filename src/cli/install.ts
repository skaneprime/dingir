import { mkdir, writeFile, readFile } from "fs/promises";
import { enableDebugIfTrue, program } from ".";
import { systemLogger } from "../services/logger/system";
import api from "../server/api";
import { existsSync } from "fs";

const readPkgJson = () => readFile(`${process.cwd()}/package.json`, "utf8");

async function readLibsFromPKGJson() {
	const packageJsonFile = await readPkgJson();
	const json = JSON.parse(packageJsonFile);

	return json?.dingir?.libraries as
		| {
				[key: string]: string;
		  }
		| undefined;
}

program
	.command("install [library]")
	.description("Installs existing library from server or from package.json")
	.option("--debug [mode]")
	.action(async (library: string | undefined, options: { debug?: boolean | string }) => {
		const libraries: string[] = library ? [library] : [];
		const libFolder = `${process.cwd()}/dingir_libs`;

		if (!library) {
			const pkgLibs = await readLibsFromPKGJson();
			for (const libName in pkgLibs) {
				libraries.push(`${libName}@${pkgLibs[libName]}`);
			}
		}

		enableDebugIfTrue(options);

		for (const library of libraries) {
			systemLogger.debug(`[Install Lib]: searching ${library}`);

			const [lib, ver] = library.split("@");
			const fetchedLib = await api.libs.getLib(lib, ver);

			systemLogger.debug(`[Install Lib]: found ${lib}@${fetchedLib.version}`);

			if (!existsSync(libFolder)) {
				systemLogger.debug(`[Install Lib]: creating lib folder`);
				await mkdir(libFolder);
			}

			if (fetchedLib.file) {
				systemLogger.debug(`[Install Lib]: writing ${lib}@${fetchedLib.version}.dg`);
				await writeFile(`${libFolder}/${lib}@${fetchedLib.version}.dg`, fetchedLib.file);
			}

			if (fetchedLib.decl) {
				systemLogger.debug(`[Install Lib]: writing ${lib}@${fetchedLib.version}.d.ts`);
				await writeFile(`${libFolder}/${lib}@${fetchedLib.version}.d.ts`, fetchedLib.decl);
			}

			systemLogger.info(`[Install Lib]: ${lib}@${fetchedLib.version} was installed!`);
			const pkgJson = JSON.parse(await readPkgJson());

			if (pkgJson.dingir)
				if (pkgJson.dingir.libraries) pkgJson.dingir.libraries[lib] = fetchedLib.version;
				else pkgJson.dingir.libraries = { [lib]: fetchedLib.versions };
			else
				pkgJson.dingir = {
					libraries: {
						[lib]: fetchedLib.version,
					},
				};

			await writeFile(`${process.cwd()}/package.json`, JSON.stringify(pkgJson, null, "  "));
			systemLogger.debug(`[Install Lib]: package.json was updated`);
		}
	});
