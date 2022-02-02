import { env, Utils } from "../../dingir";
import { bond } from "../../helper/bond";

export const GET_SECRET_KEY = bond(() => {
  const hash = `${env.version}-${process.versions.node}`;

  return `${Utils.String.hashCode(hash)}`.split("").map(Number);
});
