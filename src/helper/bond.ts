import * as Utils from "../utils";

export function bond<T extends Utils.Class.Any | Utils.Function.Any>(obj: T) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return ((obj as any)?.bind(0) as T) || obj;
}
