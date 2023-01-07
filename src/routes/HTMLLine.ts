import { defineContainerUI } from "./defineContainerUI";
import { textHTML } from "./textHTML";

export const HTMLLine = defineContainerUI({
  values: {
    text: {
      format: textHTML,
    },
  },
  slots: {}
});
