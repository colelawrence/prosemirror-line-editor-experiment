export type Parser<T> = ZodLikeParser<T>;
type ZodLikeParser<T> = {
  /** @throws {unknown} */
  parse(data: unknown): T;
};
export type InferParserValue<P> = P extends Parser<infer R> ? R : never;
