import "./services/events/unhandleds";
import * as dingir from "./dingir";

Object.defineProperty(global, "Dingir", {
	enumerable: true,
	writable: false,
	configurable: false,
	value: dingir,
});

export { dingir as Dingir };

import "./cli";
