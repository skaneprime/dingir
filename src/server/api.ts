import * as stream from "stream";
import { promisify } from "util";
import axios from "axios";
import FormData from "form-data";
import { createReadStream, createWriteStream } from "fs";
import { systemLogger } from "../services/logger/system";
import { SERVER_ADDRESS } from "./constants";
import path from "path";

const versions = {
	async getVersions() {
		return (await axios.get(`${SERVER_ADDRESS}/versions`)).data;
	},

	async downloadVersion(version: string) {
		// file
		const finished = promisify(stream.finished);
		const file = await axios({
			method: "get",
			url: `${SERVER_ADDRESS}/versions/${version}`,
			responseType: "stream",
		});
		const fileStream = createWriteStream(`${path.dirname(process.execPath)}/${version}.zip`);

		file.data.pipe(fileStream);

		return finished(fileStream);
	},

	async downloadLatest() {
		// file
		const finished = promisify(stream.finished);
		const file = await axios({
			method: "get",
			url: `${SERVER_ADDRESS}/versions/latest`,
			responseType: "stream",
		});

		const fileStream = createWriteStream(`${path.dirname(process.execPath)}/latest.zip`);

		file.data.pipe(fileStream);

		return finished(fileStream);
	},
};

const libs = {
	async getLibs() {
		return (await axios.get(`${SERVER_ADDRESS}/libs`)).data;
	},

	async getLibVersions(name: string) {
		return (await axios.get(`${SERVER_ADDRESS}/libs/${name}`)).data;
	},

	async getLib(name: string, version?: string) {
		const url = `${SERVER_ADDRESS}/libs/${name}${version ? `/${version}` : ""}`;
		let lib = (await axios.get(url)).data;

		if (!version) {
			lib = {
				...lib.versions.find((ver: { version: string }) => ver.version === lib.latest),
				latest: true,
			};
		}

		const file = (await axios.get(`${url}/download`)).data;
		const decl = (await axios.get(`${url}/declaration`)).data;

		return { ...lib, file: Buffer.from(file.data), decl: Buffer.from(decl.data) };
	},

	async uploadLib(
		filepath: string,
		declpath: string,
		meta: {
			name: string;
			version: string;
		},
	) {
		const form = new FormData();

		form.append("file", createReadStream(filepath));
		form.append("decl", createReadStream(declpath));

		const result = await axios({
			method: "post",
			url: `${SERVER_ADDRESS}/libs/${meta.name}/${meta.version}`,
			data: form,
			headers: { ...form.getHeaders() },
		});

		systemLogger.info(result.data);
	},
};

export default { versions, libs };
