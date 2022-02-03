import { Command } from "commander";

export const program = new Command("dingir").version("1.3.1");

import "./run";
import "./build";

program.parse(process.argv);
