import { GET_SECRET_KEY } from "./key";

export function decode(buffer: Buffer, key = GET_SECRET_KEY()) {
  let keyI = 0;
  return Buffer.from(
    buffer.map((val) => {
      if (keyI == key.length - 1) keyI = 0;

      return val - key[keyI++];
    }),
  );
}

export function encode(buffer: Buffer, key = GET_SECRET_KEY()) {
  let keyI = 0;
  return Buffer.from(
    buffer.map((val) => {
      if (keyI == key.length - 1) keyI = 0;

      return val + key[keyI++];
    }),
  );
}

export default { encode, decode };
