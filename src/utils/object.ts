import { camelCase } from "lodash";
import * as String from "./string";

/** @public */
export function mergeProp<T, S>(target: T, prop: S): T & S {
	//target is destination, prop is source
	for (const key in prop) {
		if (typeof prop[key] === "object") {
			if (!target[key as unknown as keyof T]) {
				target[key as unknown as keyof T] = {} as T[keyof T];
			}
			mergeProp(target[key as unknown as keyof T], prop[key]);
		} else if (
			Object.prototype.hasOwnProperty.call(prop, key) &&
			!Object.prototype.hasOwnProperty.call(target, key)
		) {
			target[key as unknown as keyof T] = prop[key] as unknown as T[keyof T];
		}
	}

	return target as T & S;
}
/** @public */
export function mergeProps<T extends object, S extends object[]>(target: T, ...sources: S[]) {
	for (let i = 0; i < sources.length; i++) {
		target = mergeProp(target, sources[i]);
	}
	return target as T & S;
}
/** @public */
export type KeysToCamelCase<T> = {
	[K in keyof T as String.CamelCase<string & K>]: T[K];
};
/** @public */
export function keysToCamelCase<T extends Record<string, unknown>>(obj: T) {
	const newObj = {} as Record<String.CamelCase<string>, unknown>;

	for (const key in obj) {
		newObj[camelCase(key) as String.CamelCase<string>] = obj[key as keyof T];
	}

	return newObj as KeysToCamelCase<T>;
}
