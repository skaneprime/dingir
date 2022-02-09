/** @public */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Any<T extends any[] = any[], R = any> = (...args: T) => R;
/** @public */
export type Unknown<T extends unknown[] = unknown[], R = unknown> = (...args: T) => R;
/** @public */
export function extend<F extends Any, D, M = { [P in keyof D]: D[P] }>(Function: F, DataMap?: M) {
	return Object.assign(Function, DataMap);
}
