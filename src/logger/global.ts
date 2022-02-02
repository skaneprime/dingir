import chalk from "chalk";
import StackTracey from "stacktracey";
import { Logger } from "./base";

declare global {
  // eslint-disable-next-line no-var
  var System: Logger;
}

export function globalizeSystemLogger() {
  global.System = new Logger({ label: "DINGIR" });
}

export function printError(error: Error) {
  const stack = new StackTracey(error);
  const [main, ...rest] = stack.items;
  const punc = chalk.gray(":");

  if (!stack.items.length) {
    return System.fatal(error);
  }

  if (main.fileName === "dingir.js") {
    System.fatal(
      `${chalk.red("[Uncaught Exception]")} ${chalk.cyan(main.callee)} throwed ${chalk.red(error.name)}: ${
        error.message
      }`,
      `\n${chalk.gray("If you see this message. Please create issue on github with this error message")}`,
    );
  } else {
    System.fatal(
      `${chalk.red("[Uncaught Exception] ", error.name)}: ${error.message}`,
      `\n\tat ${chalk.cyan(main.callee)} (${chalk.green(
        `"${main.file.length == 0 ? "node" : main.file}${punc}${chalk.yellow(main.line || 0)}${punc}${chalk.yellow(
          main.column || 0,
        )}"`,
      )})\n`,
      rest
        .map((item) => {
          const filePath = `${punc}${chalk.yellow(item.line || 0)}${punc}${chalk.yellow(item.column || 0)}`;
          return `\tat ${chalk.cyan(item.callee)} (${chalk.green(
            `"${item.file.length == 0 ? "node" : item.file}${filePath}"`,
          )})`;
        })
        .join("\n"),
    );
  }
}

export function handleErrorsBeatifully() {
  process.on("unhandledRejection", printError).on("uncaughtException", (err) => {
    printError(err);
    process.exit(1);
  });
}
