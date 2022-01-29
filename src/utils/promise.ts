/** @public */
export type Result<T> = T extends PromiseLike<infer U> ? U : T;
