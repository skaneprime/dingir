import "./modules";

import * as _Dingir from "./dingir";
export { _Dingir as Dingir }; // For API Gen

declare global {
  // eslint-disable-next-line no-var
  var Dingir: typeof _Dingir;
}
global.Dingir = _Dingir;

import "./cli";
