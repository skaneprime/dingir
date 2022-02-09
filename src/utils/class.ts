/** @public */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Any<T extends any[] = any[], I = any> = new (...args: T) => I;
/** @public */
export type Unknown<T extends unknown[] = unknown[], I = unknown> = new (...args: T) => I;
/** @public */
export function isClass(obj: unknown) {
	return /^\s*class[^\w]+/.test(obj + "");
}
