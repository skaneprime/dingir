import { env, Utils } from '../../dingir';
import { Bond } from '../../helper/bond';

export const GET_SECRET_KEY = Bond(() =>
  Array.from(`${Utils.String.hashCode(env.version)}-AttackOnTitan-ErenYeager`).map(Number),
);
