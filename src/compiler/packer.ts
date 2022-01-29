import { MetaDataInterface } from './compile';
import StrCoder from './coder/string';

const INT_32_BE = 4;
export function PackDG(meta: MetaDataInterface, bytecode: Buffer) {
  const metaBuffer = Buffer.from(StrCoder.Encode(JSON.stringify(meta)));
  const fileBuffer = Buffer.alloc(INT_32_BE + metaBuffer.byteLength + bytecode.byteLength);

  fileBuffer.writeInt32BE(metaBuffer.byteLength);
  metaBuffer.copy(fileBuffer, INT_32_BE);
  bytecode.copy(fileBuffer, INT_32_BE + metaBuffer.byteLength);

  return fileBuffer;
}

export function UnpackDG(buf: Buffer) {
  const metaSize = buf.slice(0, INT_32_BE);
  const metaBuf = buf.slice(INT_32_BE, metaSize.readInt32BE() + INT_32_BE);
  const bytecode = buf.slice(INT_32_BE + metaSize.readInt32BE(), buf.byteLength);

  return {
    meta: JSON.parse(StrCoder.Decode(metaBuf.toString())) as MetaDataInterface,
    bytecode,
  };
}
