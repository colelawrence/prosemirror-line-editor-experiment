import type { Parser } from "./Parser.type";

export interface MimeType<ID extends string, JSON> {
  id: ID;
  // technically: would need to split into encode and decode for either JSON, strings, or binary
  parser: Parser<JSON>;
}
export function defineMimeType<ID extends string, JSON>(
  id: ID,
  parser: Parser<JSON>
): MimeType<ID, JSON> {
  return {
    id,
    parser,
  };
}
