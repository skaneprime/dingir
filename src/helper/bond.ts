import * as utils from "../utils";

export function bond<T extends utils.class.Any | utils.function.Any>(obj: T) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return ((obj as any)?.bind(0) as T) || obj;
}
