import path from "path";
import child_process from "child_process";
import api from "../server/api";
import { writeFile } from "fs/promises";
import { enableDebugIfTrue, program } from ".";

function codenizeFinalizer(version?: string) {
	return (
		`# Finalizer` +
		`import os\n` +
		`import time\n` +
		`import signal\n` +
		`import zipfile\n` +
		`execPath = "${process.execPath.replace(/\\/g, "/")}"\n` +
		`execFolder = "${path.dirname(process.execPath).replace(/\\/g, "/")}"\n` +
		`zipFilePath = "${path.dirname(process.execPath).replace(/\\/g, "/")}/${
			version || "latest"
		}.zip"\n` +
		`try: os.kill(${process.pid}, signal.SIGTERM)\n` +
		`except OSError: print("Oops")\n` +
		`os.chmod(execPath, 0o777)\n` +
		`while True:\n` +
		`	try: with open(execPath, 'w') as _: break\n` +
		`	except IOError: time.sleep(3)\n` +
		`os.remove(execPath)\n` +
		`os.remove("${path.dirname(process.execPath).replace(/\\/g, "/")}/unpack.py")\n` +
		`with zipfile.ZipFile(zipFilePath, 'r') as zip_ref:\n` +
		`	zip_ref.extractall("${path.dirname(process.execPath).replace(/\\/g, "/")}")\n` +
		`os.remove(zipFilePath)`
	);
}

program
	.command("update [version]")
	.description("Updates dingir or lib")
	.option("--debug [mode]")
	.option("--versions")
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
				return console.log(
					"latest:",
					await api.versions.getLatest(),
					"\n",
					"\bversions:",
					Object.keys(await api.versions.getVersions()).join(", "),
				);
			}

			if (version) {
				await api.versions.downloadVersion(version);
			} else {
				await api.versions.downloadLatest();
			}

			await writeFile(
				`${path.dirname(process.execPath).replace(/\\/g, "/")}/unpack.py`,
				codenizeFinalizer(version),
			);

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
