import { MetaDataInterface } from "./types";
import strCoder from "./coder/string";

const INT_32_BE = 4;
export function packDG(meta: MetaDataInterface, bytecode: Buffer) {
  const metaBuffer = Buffer.from(strCoder.encode(JSON.stringify(meta)));
  const fileBuffer = Buffer.alloc(INT_32_BE + metaBuffer.byteLength + bytecode.byteLength);

  fileBuffer.writeInt32BE(metaBuffer.byteLength);
  metaBuffer.copy(fileBuffer, INT_32_BE);
  bytecode.copy(fileBuffer, INT_32_BE + metaBuffer.byteLength);

  return fileBuffer;
}

export function unpackDG(buf: Buffer) {
  const metaSize = buf.slice(0, INT_32_BE);
  const metaBuf = buf.slice(INT_32_BE, metaSize.readInt32BE() + INT_32_BE);
  const bytecode = buf.slice(INT_32_BE + metaSize.readInt32BE(), buf.byteLength);

  return {
    meta: JSON.parse(strCoder.decode(metaBuf.toString())) as MetaDataInterface,
    bytecode,
  };
}
