import fs from "fs";
import path from "path";
import { build } from "tsc-prog";
import { randomBytes } from "crypto";

export function compileTS(entry: string) {
  const tempDir = `${process.cwd()}/.temp-dingir-build-${randomBytes(10).toString("hex")}`;
  const oldConsole = console;
  console = new console.Console(new fs.WriteStream(Buffer.from([]))); // Disabiling console cause build log's it's own anyway

  build({
    basePath: process.cwd(),
    configFilePath: `${process.cwd()}/tsconfig.json`,
    compilerOptions: {
      declaration: true,
      outDir: tempDir,
      declarationDir: tempDir,
    },
    include: [`${process.cwd()}/dingir.d.ts`, `${path.dirname(entry)}/**/*`],
  });

  console = oldConsole;
  return tempDir;
}
