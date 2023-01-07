import { component$, useClientEffect$, useStyles$ } from "@builder.io/qwik";
import {
  ProseMirrorLineHTML,
  ProseMirrorLineWeb,
} from "../routes/ProseMirrorLine";
import {
  PageWithTitle,
  ProseMirrorBlockContainerHTML,
  ProseMirrorBlockContainerWeb,
} from "../routes/ProseMirrorBlockContainer";
import { unixSecsFrom } from "./utils/unixSecsFrom";
import { HTMLLine } from "../routes/HTMLLine";
import { dev } from "@autoplay/utils";
import {
  PickUIFn,
  renderContainerForHTML,
  createUIStateForWeb,
} from "../routes/defineContainerUI";

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
  console.warn("unknown slot item UI", itemTestData);
  return {
    html: ProseMirrorLineHTML.html,
    web: ProseMirrorLineWeb.web,
  };
};

export const MinttyPage = component$(() => {
  const pageHTMLID = "c-" + Math.random().toString(36).slice(2);
  const pageTestData = PageWithTitle.testData({
    values: {
      title: {
        "text/html": `Mintty Editor <sup>experiment</sup>`,
      },
    },
    slots: {
      children: [
        {
          miid: "MIID-LINE-001",
          linkedBlockData: HTMLLine.testData({
            slots: {},
            values: {
              text: { "text/html": "Hello <strong>Mintter</strong>!" },
            },
          }),
          standoffValues: {
            fractionalIndex: { "number/decimal": 0.01 },
            indentation: { "number/natural": 0 },
          },
        },
        {
          miid: "MIID-LINE-002",
          linkedBlockData: HTMLLine.testData({
            slots: {},
            values: {
              text: { "text/html": "This is block 2." },
            },
          }),
          standoffValues: {
            fractionalIndex: { "number/decimal": 0.5 },
            indentation: { "number/natural": 1 },
          },
        },
        {
          miid: "MIID-LINE-003",
          linkedBlockData: HTMLLine.testData({
            slots: {},
            values: {
              text: { "text/html": "This is block 3." },
            },
          }),
          standoffValues: {
            fractionalIndex: { "number/decimal": 5 },
            indentation: { "number/natural": 1 },
          },
        },
      ],
      comments: [
        {
          miid: "MIID-COMMENT-001",
          linkedBlockData: HTMLLine.testData({
            slots: {},
            values: {
              text: { "text/html": "A comment" },
            },
          }),
          standoffValues: {
            targetId: { "mintter/item-id": "MIID-LINE-001" },
            postedAt: { "time/unix-secs": unixSecsFrom({ minutesAgo: 5 }) },
            postedBy: { "mintter/signer": "GITHUB.COM:colelawrence" },
          },
        },
        {
          miid: "MIID-COMMENT-002",
          linkedBlockData: HTMLLine.testData({
            slots: {},
            values: {
              text: { "text/html": "Was this comment for testing?" },
            },
          }),
          standoffValues: {
            targetId: { "mintter/item-id": "MIID-COMMENT-001" },
            postedAt: { "time/unix-secs": unixSecsFrom({ minutesAgo: 1 }) },
            postedBy: { "mintter/signer": "TWITTER.COM:hhg2288" },
          },
        },
        {
          miid: "MIID-COMMENT-003",
          linkedBlockData: HTMLLine.testData({
            slots: {},
            values: {
              text: { "text/html": "Supports indentation?" },
            },
          }),
          standoffValues: {
            targetId: { "mintter/item-id": "MIID-LINE-003" },
            postedAt: { "time/unix-secs": unixSecsFrom({ minutesAgo: 1 }) },
            postedBy: { "mintter/signer": "GITHUB.COM:colelawrence" },
          },
        },
      ],
    },
  });

  const htmlForBlockContainer = renderContainerForHTML({
    data: pageTestData,
    pickUI: pickUIFn,
  });

  // console.log(dev`${htmlForBlockContainer}`._display);
  const pageHTML = ProseMirrorBlockContainerHTML.html(htmlForBlockContainer);

  useClientEffect$(() => {
    const web = createUIStateForWeb({
      data: pageTestData,
      pickUI: pickUIFn,
      TODO_Save: null,
      // mountTo: {
      //   container: document.getElementById(pageHTMLID) as HTMLElement,
      //   async save(values) {
      //     console.warn(
      //       dev`TODO: save prosemirror container values: ${values}`._display
      //     );
      //   },
      // },
    });

    console.log("page web", web);

    const mounted = web.mount({
      container: document.getElementById(pageHTMLID) as HTMLElement,
    });
    console.log("page mounted", mounted);
  });

  useStyles$(`
.page-container {
  padding: 1rem;
  border-radius: 4px;
  box-shadow: 0px 20px 40px rgba(20,30,140,0.2);
}
  `);

  return (
    <div>
      <p>Page container renders embedded editors with HTML</p>
      <hr />
      <style>{pageHTML.css}</style>
      <div
        class="page-container"
        dangerouslySetInnerHTML={pageHTML.html}
        id={pageHTMLID}
      ></div>
    </div>
  );
});
