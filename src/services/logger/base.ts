import fs from "fs";
import path from "path";
import util from "util";
import chalk from "chalk";
import moment from "moment";
import { utils } from "../../dingir";

enum LogLevel {
	"TRACE",
	"DEBUG",
	"INFO",
	"WARN",
	"ERROR",
	"FATAL",
}

// const sep = " │ ";
const boldSep = " ┃ ";

/** @public */
export class LoggerService {
	public theme = {
		level: {
			[LogLevel.TRACE]: "#9c9c9c",
			[LogLevel.DEBUG]: "#c034eb",
			[LogLevel.INFO]: "#6beb34",
			[LogLevel.WARN]: "#ebd834",
			[LogLevel.ERROR]: "#eb6134",
			[LogLevel.FATAL]: "#eb3434",
		} as Record<LogLevel, string>,
		time: {
			color: "#1ce1ff",
			format: "YYYY/MM/DD hh:mm:ss",
		},
	};
	private file?: fs.WriteStream;
	private stdout = process.stdout;
	private showableLevels: Set<LogLevel> = new Set([
		LogLevel.INFO,
		LogLevel.WARN,
		LogLevel.ERROR,
		LogLevel.FATAL,
	]);

	private get time() {
		return chalk.bold.hex(this.theme.time.color)(moment().format(this.theme.time.format));
	}

	private colorizeLvl(lvl: LogLevel) {
		return chalk.bold.hex(this.theme.level[lvl])(
			LogLevel[lvl].length < 5 ? LogLevel[lvl] + " " : LogLevel[lvl],
		);
	}

	private seperate(...args: unknown[]) {
		return args.join(boldSep);
	}

	private write(level: LogLevel, args: unknown[]) {
		const formattedArgs = util.formatWithOptions(
			{
				colors: true,
			},
			...args,
		);
		const output = this.seperate(
			this.time,
			this.colorizeLvl(level),
			this.options?.label
				? chalk.bold.hex("#999999")(this.options.label.substring(0, 6).toUpperCase()) +
						(6 - this.options.label.length < 1 ? "" : " ".repeat(6 - this.options.label.length))
				: " ".repeat(6),
			formattedArgs,
		);

		if (this.showableLevels.has(level)) {
			this.stdout.write(`${output}\n`);
			this.file?.write(`${utils.string.stripAnsi(output)}\n`);
		}
	}

	constructor(
		private options?: {
			stdout?: NodeJS.WriteStream & { fd: 1 };
			logFilePath?: string;
			label?: string;
		},
	) {
		this.stdout = options?.stdout || this.stdout;

		const streamFilePath = options?.logFilePath
			? path.resolve(options.logFilePath)
			: path.resolve(process.cwd(), "logs", moment().format("YYYY-MM-DD") + ".log");

		utils.fs.ensureDirectoryExistence(streamFilePath);
		this.file = fs.createWriteStream(streamFilePath, { flags: "a" });
	}

	public enableLevel(level: LogLevel) {
		this.showableLevels.add(level);
	}
	public disableLevel(level: LogLevel) {
		this.showableLevels.delete(level);
	}

	public trace = (...args: unknown[]) => this.write(LogLevel.TRACE, args);
	public debug = (...args: unknown[]) => this.write(LogLevel.DEBUG, args);
	public info = (...args: unknown[]) => this.write(LogLevel.INFO, args);
	public warn = (...args: unknown[]) => this.write(LogLevel.WARN, args);
	public error = (...args: unknown[]) => this.write(LogLevel.ERROR, args);
	public fatal = (...args: unknown[]) => this.write(LogLevel.FATAL, args);
}
