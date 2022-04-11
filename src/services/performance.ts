/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from "chalk";
import perf_hooks from "perf_hooks";
import * as Utils from "../utils";
import { seperator } from "./logger/base";

if (process.env.PERFORMANCE_CONSOLE_LOG == undefined) process.env.PERFORMANCE_CONSOLE_LOG = "false";

/** @public */
export function enableLog() {
	process.env.PERFORMANCE_CONSOLE_LOG = "true";
}

/** @public */
export function disableLog() {
	process.env.PERFORMANCE_CONSOLE_LOG = "false";
}

function log(fnname: string, startTime: number, type: "Function" | "AsyncFunction") {
	if (process.env.PERFORMANCE_CONSOLE_LOG == "true")
		console.log(
			`${chalk.cyan(
				`${chalk.gray("(DingirPerformance)")}${chalk.white(seperator)}[${type}: ${fnname}]`,
			)} execution time took ${Utils.Time.msToTime(perf_hooks.performance.now() - startTime)}`,
		);
}

/** @public */
export function func<T extends (...args: any[]) => any>(
	fn: T,
	...args: Parameters<T>
): ReturnType<T> {
	const startTime = perf_hooks.performance.now();
	const result = fn(...args);

	log(fn.name, startTime, "Function");

	return result as ReturnType<T>;
}

/** @public */
export async function asyncFunc<T extends (...args: any[]) => Promise<any>>(
	fn: T,
	...args: Parameters<T>
) {
	const startTime = perf_hooks.performance.now();
	const result = await fn(...args);

	log(fn.name, startTime, "AsyncFunction");

	return result as ReturnType<Utils.Promise.Result<T>>;
}

const labels = new Map<string, number>();

/** @public */
export function setLabel(label: string) {
	if (labels.has(label)) {
		return console.log(
			`${chalk.gray("(DingirPerformance)")}${chalk.white(seperator)}Label "${label}" already exist`,
		);
	}

	labels.set(label, performance.now());

	return () => endLabel(label);
}

/** @public */
export function endLabel(label: string) {
	const startTime = labels.get(label);

	if (startTime === undefined) {
		return console.log(
			`${chalk.gray("(DingirPerformance)")}${chalk.white(
				seperator,
			)}Label "${label}" does not exist`,
		);
	}

	if (process.env.PERFORMANCE_CONSOLE_LOG)
		console.log(
			`${chalk.gray("(DingirPerformance)")}${chalk.white(seperator)}${label} ${Utils.Time.msToTime(
				perf_hooks.performance.now() - startTime,
			)}`,
		);

	labels.delete(label);
}

/** @public */
export function wrapFunc<T extends (...args: any[]) => any>(fn: T) {
	return (...args: Parameters<T>): ReturnType<T> => {
		const startTime = perf_hooks.performance.now();
		const result = fn(...args);

		log(fn.name, startTime, "Function");

		return result as ReturnType<T>;
	};
}

/** @public */
export function wrapAsyncFunc<T extends (...args: any[]) => any>(fn: T) {
	return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
		const startTime = perf_hooks.performance.now();
		const result = await fn(...args);

		log(fn.name, startTime, "AsyncFunction");

		return result as ReturnType<T>;
	};
}
