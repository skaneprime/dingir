import chalk from 'chalk';
import express from 'express';
import { Server } from 'http';

const app = express();
let httpServer: Server;

export function Serve() {
  return new Promise<void>((resolve) => {
    httpServer = app.listen(() => {
      const address = httpServer.address();
      const port = typeof address == 'string' ? address : `${address?.port}`;

      System.Debug(`${chalk.cyanBright('[Server]')} Listening to port ${chalk.yellow(port)}`);
      resolve();
    });
  });
}

export function Close() {
  return new Promise<void>((resolve) => {
    httpServer?.close((error) => {
      if (error) {
        System.Error(`${chalk.cyanBright('[Server]')} Failed to close server`, error);
      } else System.Debug(`${chalk.cyanBright('[Server]')} Closed`);
      resolve();
    });
  });
}
