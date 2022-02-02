import fs from "fs";
import path from "path";
import bytenode from "bytenode";
import bufCoder from "./coder/buffer";
import { unpackDG } from "./packer";
import { env } from "../dingir";

/** @public */
export function importDG(entry: string) {
  if (!entry.endsWith(".dg")) return System.error(`"${entry}" can't import non .dg file`);

  const unpackedDG = unpackDG(fs.readFileSync(path.resolve(entry)));

  System.debug(unpackedDG.meta);

  const failedExternalImports = unpackedDG.meta.externals
    .map((external) => {
      try {
        require(external);
      } catch (error) {
        return [external, error] as [string, Error];
      }
    })
    .filter((s) => s) as [string, Error][]; // removing undefined

  if (unpackedDG.meta.dgv !== env.version) {
    System.warn(
      `"${entry}" is built with DGV-${unpackedDG.meta.dgv} but current is DGV-${env.version}. It may cause bugs or some issues. Please use valid version or update the module`,
    );
  } else {
    System.debug(`"${entry}" DGV is compatible`);
  }

  if (failedExternalImports.length > 0) {
    const fails = failedExternalImports
      .map(([external, error]) => {
        return `${external} -> ${error.name}: ${error.message}`;
      })
      .join("\n");
    return System.error(`Failed to import "${entry}"\nFailed to import externals:\n${fails}`);
  }

  const exports = {},
    mod = { exports: {} };

  bytenode.runBytecode(bufCoder.decode(unpackedDG.bytecode))(exports, require, mod, entry, path.dirname(entry));

  return { ...mod.exports, ...exports };
}
