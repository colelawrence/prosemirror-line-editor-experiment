import {
  ProseMirrorLineHTML,
  ProseMirrorLineWeb,
} from "../routes/ProseMirrorLine.UI";
import {
  ProseMirrorBlockContainerHTML,
  ProseMirrorBlockContainerWeb,
} from "../routes/ProseMirrorBlockContainer.UI";
import type { PickUIFn } from "../routes/defineItemSchema";
import { SimpleImageHTML, SimpleImageWeb } from "~/routes/SimpleImage.UI";

/** Configure which UI to pick based on what the item data has in it */
export const pickUIFn: PickUIFn = ({ itemTestData }) => {
  if (typeof itemTestData.values["text"]?.["text/html"] === "string") {
    console.debug("picked ProseMirrorLine ui", itemTestData);
    return {
      html: ProseMirrorLineHTML.html,
      web: ProseMirrorLineWeb.web,
    };
  }
  if (
    typeof itemTestData.values["title"]?.["text/html"] === "string" &&
    itemTestData.slots["children"] &&
    itemTestData.slots["comments"]
  ) {
    console.debug("picked ProseMirrorContainer ui", itemTestData);
    return {
      html: ProseMirrorBlockContainerHTML.html,
      web: ProseMirrorBlockContainerWeb.web,
    };
  }
  if (typeof itemTestData.values["imageSrc"]?.["data-uri"] === "string") {
    console.debug("picked SimpleImage ui", itemTestData);
    return {
      html: SimpleImageHTML.html,
      web: SimpleImageWeb.web,
    };
  }
  console.warn("unknown slot item UI", itemTestData);
  return {
    html: ProseMirrorLineHTML.html,
    web: ProseMirrorLineWeb.web,
  };
};
