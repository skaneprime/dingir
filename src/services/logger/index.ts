import { LoggerService, LogLevel } from "./base";

export { LoggerService, LogLevel };
/** @public */
export function create(...args: ConstructorParameters<typeof LoggerService>) {
	return new LoggerService(...args);
}
