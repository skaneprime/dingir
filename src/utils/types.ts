import * as Function from "./function";
import * as Class from "./class";

/** @public */
export type ReturnOrInstance<T extends Function.Any | Class.Any> = T extends Function.Any
	? ReturnType<T>
	: T extends Class.Any
	? InstanceType<T>
	: unknown;
/** @public */
export type ParamsOrClassParams<T> = T extends Function.Any
	? Parameters<T>
	: T extends Class.Any
	? ConstructorParameters<T>
	: unknown;
/** @public */
export type IsFunction<T> = T extends Function.Any ? true : false;
/** @public */
export type JSONValue =
	| string
	| number
	| boolean
	| null
	| JSONValue[]
	| { [key: string]: JSONValue };
/** @public */
export function defineStatic<T>() {
	return <U extends T>(constructor: U) => constructor;
}
/** @public */
export type Exactly<T, U> = {
	[K in keyof U]: K extends keyof T ? T[K] : never;
};
