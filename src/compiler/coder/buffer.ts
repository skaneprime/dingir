import { GET_SECRET_KEY } from './key';

export function Decode(buffer: Buffer, key = GET_SECRET_KEY()) {
  let keyI = 0;
  return Buffer.from(
    buffer.map((val) => {
      if (keyI == key.length - 1) keyI = 0;

      return val - key[keyI++];
    }),
  );
}

export function Encode(buffer: Buffer, key = GET_SECRET_KEY()) {
  let keyI = 0;
  return Buffer.from(
    buffer.map((val) => {
      if (keyI == key.length - 1) keyI = 0;

      return val + key[keyI++];
    }),
  );
}

export default { Encode, Decode };
