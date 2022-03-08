import { enableDebugIfTrue, program } from ".";
import api from "../server/api";

program
	.command("install <library>")
	.description("Installs existing library from server")
	.option("--debug [mode]")
	.action(async (library: string, options: { debug?: boolean | string }) => {
		enableDebugIfTrue(options);

		const [lib, ver] = library.split("@");
		const fetchedLib = await api.libs.getLib(lib, ver);

		return console.log(fetchedLib);
	});
