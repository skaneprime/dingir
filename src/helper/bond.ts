import { Class, Function } from '../utils';

export function Bond<T extends Class.Any | Function.Any>(obj: T) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((obj as any)?.bind(0) as T) || obj;
}
