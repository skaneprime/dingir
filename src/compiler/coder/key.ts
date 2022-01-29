import { env, Utils } from '../../dingir';
import { Bond } from '../../helper/bond';

export const GET_SECRET_KEY = Bond(() => {
  const hash = `${env.version}-${process.versions.node}`;

  return `${Utils.String.hashCode(hash)}`.split('').map(Number);
});
