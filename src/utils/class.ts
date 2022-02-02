/** @public */
export type Any<T extends unknown[] = unknown[], I = unknown> = new (...args: T) => I;
/** @public */
export function isClass(obj: unknown) {
  return /^\s*class[^\w]+/.test(obj + "");
}
