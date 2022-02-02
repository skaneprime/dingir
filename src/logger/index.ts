import { Logger, Theme } from "./base";

export { Theme };
export { Logger as LoggerClass };
/** @public */
export function create(settings?: ConstructorParameters<typeof Logger>[0]) {
  return new Logger({
    ...settings,
    label: settings?.label?.substring(0, 6).toUpperCase() || " ".repeat(6),
  });
}
