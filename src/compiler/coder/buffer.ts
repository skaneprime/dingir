import { getSecretKey } from "./key";

function decode(buffer: Buffer, key = getSecretKey()) {
	let keyI = 0;
	return Buffer.from(
		buffer.map((val) => {
			if (keyI == key.length - 1) keyI = 0;

			return val - key[keyI++];
		}),
	);
}

function encode(buffer: Buffer, key = getSecretKey()) {
	let keyI = 0;
	return Buffer.from(
		buffer.map((val) => {
			if (keyI == key.length - 1) keyI = 0;

			return val + key[keyI++];
		}),
	);
}

export default { encode, decode };
