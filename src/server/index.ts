import chalk from "chalk";
import express from "express";
import { Server } from "http";
import { systemLogger } from "../services/logger/system";

const app = express();
let httpServer: Server;

export function serve() {
	return new Promise<void>((resolve) => {
		httpServer = app.listen(() => {
			const address = httpServer.address();
			const port = typeof address === "string" ? address : address?.port;
			systemLogger.debug(`${chalk.cyanBright("[InternalServer]")} Listening to`, port);
			resolve();
		});
	});
}
export function close() {
	return new Promise<void>((resolve) => {
		httpServer.close(() => {
			systemLogger.debug(`${chalk.cyanBright("[InternalServer]")} Closed`);
			resolve();
		});
	});
}

export default { serve, close };
