import chalk from "chalk";
import StackTracey from "stacktracey";
import { systemLogger } from "../logger/system";

function printPrettyError(error: Error) {
	const stack = new StackTracey(error);
	const [main, ...rest] = stack.items;

	if (!stack.items.length) {
		return systemLogger.fatal(error);
	}

	if (main?.fileName?.endsWith("dingir.js")) {
		systemLogger.fatal(
			`${chalk.red("[Uncaught Exception]")} ${chalk.cyan(main.callee)} throwed ${chalk.red(
				error.name,
			)}: ${error.message}`,
			`\n${chalk.gray(
				"If you see this message. Please create issue on github with this error message",
			)}`,
		);
	} else {
		systemLogger.fatal(
			// Refactor Logging Later
			`${chalk.red("[Uncaught Exception] ", error.name)}: ${error.message}`,
			`\n\tat ${chalk.cyan(main.callee)} (${chalk.green(
				`"${main.file.length == 0 ? "internal" : main.file}:${chalk.yellow(
					main.line || "",
				)}:${chalk.yellow(main.column || "")}"`,
			)})\n`,
			rest
				.map((item) => {
					const filePath = `:${chalk.yellow(item.line || "")}:${chalk.yellow(item.column || "")}`;
					return `\tat ${chalk.cyan(item.callee)} (${chalk.green(
						`"${item.file.length == 0 ? "internal" : item.file}${filePath}"`,
					)})`;
				})
				.join("\n"),
		);
	}
}

process.on("uncaughtException", printPrettyError);
process.on("unhandledRejection", printPrettyError);
