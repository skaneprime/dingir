import { GET_SECRET_KEY } from "./key";

export function encode(str: string, key = GET_SECRET_KEY()) {
  let keyIndex = 0,
    string = "";

  for (let i = 0; i < str.length; i++) {
    string += String.fromCharCode(str[i].charCodeAt(0) + key[keyIndex]);
    keyIndex++;

    if (keyIndex === key.length) keyIndex = 0;
  }

  return string;
}

export function decode(str: string, key = GET_SECRET_KEY()) {
  let keyIndex = 0,
    string = "";

  for (let i = 0; i < str.length; i++) {
    string += String.fromCharCode(str[i].charCodeAt(0) - key[keyIndex]);
    keyIndex++;

    if (keyIndex === key.length) keyIndex = 0;
  }

  return string;
}

export default { encode, decode };
