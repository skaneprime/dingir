import { env, utils } from "../../dingir";
import { bond } from "../../helper/bond";

export const getSecretKey = bond(() => {
	const hash = `${env.version}-${process.versions.node}`;
	return `${Math.abs(utils.string.hashCode(hash))}`.split("").map(Number);
});
