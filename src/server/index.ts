import chalk from "chalk";
import express from "express";
import { Server } from "http";

const app = express();
let httpServer: Server;

export function serve() {
  return new Promise<void>((resolve) => {
    httpServer = app.listen(() => {
      const address = httpServer.address();
      const port = typeof address == "string" ? address : `${address?.port}`;

      System.debug(`${chalk.cyanBright("[Server]")} Listening to port ${chalk.yellow(port)}`);
      resolve();
    });
  });
}

export function close() {
  return new Promise<void>((resolve) => {
    httpServer?.close((error) => {
      if (error) {
        System.error(`${chalk.cyanBright("[Server]")} Failed to close server`, error);
      } else System.debug(`${chalk.cyanBright("[Server]")} Closed`);
      resolve();
    });
  });
}
