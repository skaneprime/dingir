import './modules';

import * as Dingir from './dingir';
export { Dingir }; // For API Gen

declare global {
  // eslint-disable-next-line no-var
  var Dingir: unknown;
}
global.Dingir = Dingir;

import './cli';
