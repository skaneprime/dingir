import { getSecretKey } from "./key";

function encode(str: string, key = getSecretKey()) {
	let keyIndex = 0;
	let string = "";

	for (let i = 0; i < str.length; i++) {
		string += String.fromCharCode(str[i].charCodeAt(0) + key[keyIndex]);
		keyIndex++;

		if (keyIndex === key.length) keyIndex = 0;
	}

	return string;
}

function decode(str: string, key = getSecretKey()) {
	let keyIndex = 0;
	let string = "";

	for (let i = 0; i < str.length; i++) {
		string += String.fromCharCode(str[i].charCodeAt(0) - key[keyIndex]);
		keyIndex++;

		if (keyIndex === key.length) keyIndex = 0;
	}

	return string;
}

export default { encode, decode };
