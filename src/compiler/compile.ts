import fs from 'fs';
import path from 'path';
import bytenode from 'bytenode';
import { Module } from 'module';
import ncc from '../helper/ncc';
import BufCoder from './coder/buffer';
import { env } from '../dingir';
import { ExtractApi } from './api-extractor';
import { PackDG } from './packer';

export interface MetaDataInterface {
  dgv: string;
  ver: string;
  externals: string[];
}
/** @public */
export interface CompileOptions {
  externals?: string[];
  declaration?: boolean;
  minify?: boolean;
  out?: string;
  ver?: string;
}
/** @public */
export async function CompileToDGL(entry: string, options: CompileOptions) {
  const output = await ncc(path.resolve(entry), {
    ...options,
    cache: false,
    v8cache: false,
    quiet: true,
    debugLog: false,
    externals: ['@vercel/ncc', ...(options.externals || [])],
  });

  System.Info(`"${entry}" was compiled in ${(output.stats?.endTime || 0) - (output.stats?.startTime || 0)}ms`);

  const bytecode = bytenode.compileCode(Module.wrap(output.code));
  const encoded = BufCoder.Encode(bytecode);
  const decodable = Buffer.compare(bytecode, BufCoder.Decode(encoded)) === 0;

  if (!decodable) return System.Error(`DGE001: Can't compile "${entry}" to dg. Undecodable code`);

  const packed = PackDG(
    {
      // dgls: Object.keys((global as any).DINGIR_IMPORT_CACHE || {}), // Imported Dg Libs Пока что useless
      dgv: env.version,
      ver: options.ver || '1.0.0',
      externals: options.externals || [],
    },
    encoded,
  );
  const out = options.out || entry;
  const outPath = `${out.slice(0, out.length - 3)}${options.ver ? `@${options.ver}` : ''}.dg`;

  fs.createWriteStream(outPath).write(packed);

  if (options.declaration) {
    ExtractApi(
      path.resolve(entry),
      options.out
        ? path.resolve(`${options.out?.slice(0, options.out.length - 3)}${options.ver ? `@${options.ver}` : ''}.d.ts`)
        : undefined,
    );
  }
}
