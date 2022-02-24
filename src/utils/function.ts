/* eslint-disable @typescript-eslint/no-explicit-any */

/** @public */
export type Any<T extends any[] = any[], R = any> = (...args: T) => R;
/** @public */
export type Unknown<T extends unknown[] = unknown[], R = unknown> = (...args: T) => R;
/** @public */
export function extend<F extends Any, D, M = { [P in keyof D]: D[P] }>(Function: F, DataMap?: M) {
	return Object.assign(Function, DataMap);
}
/** @public */
export function combiner(...combinerArgs: any[]) {
	return (...funcs: Any[]) => {
		return (...args: any[]) =>
			funcs.forEach(async (func) => {
				await func(...combinerArgs, ...args);
			});
	};
}
