import fs from "fs";
import path from "path";
import util from "util";
import chalk from "chalk";
import moment from "moment";
import { performance } from "perf_hooks";
import { Utils } from "../../dingir";

/** @public */
export enum LogLevel {
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
export const seperator = boldSep;

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
	private timeLabels = new Map<string, number>();

	private get time() {
		return chalk.bold.hex(this.theme.time.color)(moment().format(this.theme.time.format));
	}

	private colorizeLvl(lvl: LogLevel) {
		return chalk.bold.hex(this.theme.level[lvl])(
			LogLevel[lvl].length < 5 ? LogLevel[lvl] + " " : LogLevel[lvl],
		);
	}

	private seperate(...args: unknown[]) {
		return args.join(seperator);
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
			this.file?.write(`${Utils.String.stripAnsi(output)}\n`);
		}
	}

	constructor(
		private options?: {
			stdout?: NodeJS.WriteStream & { fd: 1 };
			logs?: boolean;
			logFilePath?: string;
			label?: string;
		},
	) {
		this.stdout = options?.stdout || this.stdout;

		const streamFilePath = options?.logFilePath
			? path.resolve(options.logFilePath)
			: path.resolve(process.cwd(), "logs", moment().format("YYYY-MM-DD") + ".log");

		if(options?.logFilePath || options?.logs) {
			Utils.fs.ensureDirectoryExistence(streamFilePath);
			this.file = fs.createWriteStream(streamFilePath, { flags: "a" });
		}
	}

	public enableLevel(level: LogLevel) {
		this.showableLevels.add(level);
		return this;
	}
	public disableLevel(level: LogLevel) {
		this.showableLevels.delete(level);
		return this;
	}

	private wrap = (level: LogLevel) => {
		return Object.assign((...args: unknown[]) => this.write(level, args), {
			time: (label?: string) => {
				if (label) {
					this.timeLabels.set(label, performance.now());
					return;
				}

				const now = performance.now();

				return (...args: unknown[]) => {
					this.write(level, [...args, `${performance.now() - now}ms`]);
				};
			},
			timeEnd: (label: string, ...args: unknown[]) => {
				const time = this.timeLabels.get(label);

				if (time != undefined) {
					this.write(level, [...args, `${performance.now() - time}ms`]);
				}
			},
			timeFunc: <T extends (...args: unknown[]) => void>(callback: T) => {
				return callback;
			},
		});
	};

	public trace = this.wrap(LogLevel.TRACE);
	public debug = this.wrap(LogLevel.DEBUG);
	public info = this.wrap(LogLevel.INFO);
	public warn = this.wrap(LogLevel.WARN);
	public error = this.wrap(LogLevel.ERROR);
	public fatal = this.wrap(LogLevel.FATAL);
}

// Log With Time
// MAKE PERFORMANCE MANAGER FOR FUNCTION AND LABELED CODE SPACES
