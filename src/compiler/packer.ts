import { DGMetadata } from "./types";

const int32BE = 4;
function pack(metadata: DGMetadata, bytecode: Buffer) {
	const metaBuffer = Buffer.from(JSON.stringify(metadata));
	const fileBuffer = Buffer.alloc(int32BE + metaBuffer.byteLength + bytecode.byteLength);

	fileBuffer.writeInt32BE(metaBuffer.byteLength);
	metaBuffer.copy(fileBuffer, int32BE);
	bytecode.copy(fileBuffer, int32BE + metaBuffer.byteLength);

	return fileBuffer;
}

function unpack(pack: Buffer) {
	const metaSize = pack.slice(0, int32BE);
	const metaBuf = pack.slice(int32BE, metaSize.readInt32BE() + int32BE);
	const bytecode = pack.slice(int32BE + metaSize.readInt32BE(), pack.byteLength);
	console.log(metaBuf.toString());
	return {
		meta: JSON.parse(metaBuf.toString()) as DGMetadata,
		bytecode,
	};
}

export default { pack, unpack };
