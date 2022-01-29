import { Logger, Theme } from './base';

export { Theme };
export type { Logger };
/** @public */
export function Create(settings?: ConstructorParameters<typeof Logger>[0]) {
  return new Logger({
    ...settings,
    label: settings?.label?.substring(0, 6).toUpperCase() || ' '.repeat(6),
  });
}
