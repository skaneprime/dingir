import { dgCompile } from "./compile";
import { dgImport } from "./import";
import { wrapFunc, wrapAsyncFunc } from "../services/performance";

/** @public */
const wrappedDgImport = wrapFunc(dgImport);
/** @public */
const wrappedDgCompile = wrapAsyncFunc(dgCompile);

export { wrappedDgImport as import, wrappedDgCompile as compile };
