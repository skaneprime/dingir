/** @public */
export type Any<T extends unknown[] = unknown[], R = unknown> = (...args: T) => R;
/** @public */
export function extend<F extends Any, D, M = { [P in keyof D]: D[P] }>(Function: F, DataMap?: M) {
	return Object.assign(Function, DataMap);
}
