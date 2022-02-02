import fs from "fs";
import path from "path";
import bytenode from "bytenode";
import { Module } from "module";
import ncc from "../../helper/ncc";
import { env } from "../../dingir";
import bufCoder from "../coder/buffer";
import { packDG } from "../packer";
import { compileTS } from "./build";
import { extractApi } from "./extract-api";

/** @public */
export interface CompileOptions {
  externals?: string[];
  declaration?: boolean;
  minify?: boolean;
  out?: string;
  ver?: string;
}

/** @public */
export async function compileToDG(entry: string, options: CompileOptions) {
  const tempDir = compileTS(entry);
  const bundle = await bundleWithNCC(tempDir, options);
  const bytecode = compileToBytecode(bundle.code);

  if (!bytecode) return System.fatal("Failed to compile");

  const pack = packDG(
    {
      dgv: env.version,
      ver: options.ver || "1.0.0",
      externals: options.externals || [],
    },
    bytecode,
  );
  const outPath = getOutPath(options.out || entry, options.ver);

  fs.createWriteStream(outPath).write(pack);

  const declarationMainFilePath = path.resolve(
    tempDir,
    path.basename(entry).slice(0, path.basename(entry).length - 3) + ".d.ts",
  );
  await fs.promises.copyFile(
    path.resolve(process.cwd(), __filename.endsWith(".ts") ? "./bin/dingir.d.ts" : "./dingir.d.ts"),
    path.resolve(tempDir, "./dingir.d.ts"),
  );
  await fs.promises.writeFile(
    declarationMainFilePath,
    `import './dingir';\n${await fs.promises.readFile(declarationMainFilePath, "utf8")}`,
  );

  if (options.declaration) {
    buildDeclaration(declarationMainFilePath, outPath);
  }
  // cleanup
  fs.rmSync(tempDir, { recursive: true });
}

function getOutPath(entry: string, ver?: string) {
  return `${entry.slice(0, entry.length - 3)}${ver ? `@${ver}` : ""}.dg`;
}

async function bundleWithNCC(entry: string, options: CompileOptions) {
  System.debug(`[ncc] called`);

  const output = await ncc(path.resolve(entry), {
    ...options,
    cache: false,
    v8cache: false,
    quiet: true,
    debugLog: false,
    externals: ["@vercel/ncc", ...(options.externals || [])],
    // Somehow include Namepace Dingir
    // pre compile ts to js
  });

  System.info(`[ncc] compiled in ${(output.stats?.endTime || 0) - (output.stats?.startTime || 0)}ms`);

  return output;
}

function compileToBytecode(code: string) {
  const bytecode = bytenode.compileCode(Module.wrap(code));
  const encoded = bufCoder.encode(bytecode);
  const decodable = Buffer.compare(bytecode, bufCoder.decode(encoded)) === 0;

  if (!decodable) return System.error(`DGE001: Can't compile file to dg. Undecodable code`);

  return encoded;
}

function buildDeclaration(entry: string, out: string) {
  return extractApi(path.resolve(entry), path.resolve(`${out.slice(0, out.length - 3)}.d.ts`));
}
