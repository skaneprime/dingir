import child_process from "child_process";
import { writeFile } from "fs/promises";
import path from "path";
import { enableDebugIfTrue, program } from ".";
import api from "../server/api";

program
	.command("update [version]")
	.description("Updates dingir or lib")
	.option("--debug [mode]")
	.option("-V, --versions")
	.action(
		async (
			version: string | undefined,
			options: {
				debug?: boolean | string;
				versions?: boolean;
			},
		) => {
			enableDebugIfTrue(options);
			if (options.versions) {
				return console.log(Object.keys(await api.versions.getVersions()).join(", "));
			}

			if (version) {
				// CREATE CHILD PROCESS OR SOME OTHER WAY CAUSE RESOURCE IS BUSY
				await api.versions.downloadVersion(version);
			} else {
				await api.versions.downloadLatest();
			}

			const code = `import os
import time
import signal
import zipfile

execPath = "${process.execPath.replace(/\\/g, "/")}";
execFolder = "${path.dirname(process.execPath).replace(/\\/g, "/")}";
zipFilePath = "${path.dirname(process.execPath).replace(/\\/g, "/")}/${version || "latest"}.zip"

try:
	os.kill(${process.pid}, signal.SIGTERM)
except OSError:
	print("Oops")

os.chmod(execPath, 0o777)

while True:
    try:
        with open(execPath, 'w') as _:
            break
    except IOError:
        time.sleep(3)

os.remove(execPath)
os.remove("${path.dirname(process.execPath).replace(/\\/g, "/")}/unpack.py")

with zipfile.ZipFile(zipFilePath, 'r') as zip_ref:
	zip_ref.extractall("${path.dirname(process.execPath).replace(/\\/g, "/")}")

os.remove(zipFilePath)`;

			await writeFile(`${path.dirname(process.execPath).replace(/\\/g, "/")}/unpack.py`, code);

			try {
				child_process.spawn(
					"python",
					[`${path.dirname(process.execPath).replace(/\\/g, "/")}/unpack.py`],
					{ detached: true },
				);

				setInterval(() => {
					console.log("Waiting to be killed by updater");
				}, 1000);
			} catch (error) {
				console.log(error);
			}
		},
	);
