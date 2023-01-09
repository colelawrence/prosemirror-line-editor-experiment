import { z } from "@autoplay/utils";
import { defineItemSchema } from "./defineItemSchema";
import { defineMimeType } from "./MimeType";
import { textHTML } from "./textHTML.mimeType";


export const SimpleImage = defineItemSchema({
  values: {
    imageSrc: {
      format: defineMimeType("data-uri", z.string()),
    },
    // used for caption
    title: {
      format: textHTML,
    },
    // // used for alt text
    // text: {
    //   format: textHTML,
    // },
  },
  slots: {
    // For annotation, you could overlay a whiteboard UI for example.
    // overlays: {
    //   multiple: true,
    //   itemStandoffValues: {
    //     values: {
    //     }
    //   }
    // }
  },
});
