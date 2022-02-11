import { env, Utils } from "../../dingir";
import { bond } from "../../helper/bond";

export const getSecretKey = bond(() => {
	const hash = `${env.version}-${process.versions.node}`;
	return `${Math.abs(Utils.String.hashCode(hash))}`.split("").map((v) => Number(v) || 0);
});
