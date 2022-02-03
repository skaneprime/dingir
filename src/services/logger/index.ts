import { LoggerService } from "./base";

export { LoggerService };
/** @public */
export function create(...args: ConstructorParameters<typeof LoggerService>) {
	return new LoggerService(...args);
}
