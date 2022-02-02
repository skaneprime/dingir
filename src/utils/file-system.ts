import fs from "fs";
import path from "path";

/** @public */
export function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);

  if (fs.existsSync(dirname)) {
    return true;
  }

  fs.mkdirSync(dirname);
}
