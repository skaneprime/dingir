import { Command } from "commander";
import { env } from "../dingir";

export const program = new Command("dingir").version(env.version);

import "./run";
import "./build";

program.parse(process.argv);
