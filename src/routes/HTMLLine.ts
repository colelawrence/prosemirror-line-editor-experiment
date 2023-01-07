import { defineUI } from "./defineUI";
import { textHTML } from "./textHTML";

export const HTMLLine = defineUI({
  values: {
    text: {
      format: textHTML,
    },
  },
});
