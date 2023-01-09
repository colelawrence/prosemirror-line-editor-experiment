import { defineItemSchema } from "./defineItemSchema";
import { textHTML } from "./textHTML.mimeType";

export const HTMLLine = defineItemSchema({
  values: {
    text: {
      format: textHTML,
    },
  },
  slots: {}
});
