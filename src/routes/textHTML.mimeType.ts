import { defineMimeType } from "./MimeType";

export const textHTML = defineMimeType("text/html", {
  parse(input: unknown) {
    if (typeof input !== "string")
      throw TypeError("Expect text/html to be stored as string");
    return input;
  },
});
