import { component$, useStyles$ } from "@builder.io/qwik";
import { ProseMirrorLineHTML } from "../ProseMirrorLine";
import {
  PageWithTitle,
  ProseMirrorBlockContainerHTML,
} from "../ProseMirrorBlockContainer";
import { unixSecsFrom } from "./unixSecsFrom";
import { HTMLLine } from "../HTMLLine";
import { dev } from "@autoplay/utils";

export default component$<{ initialValues: any }>(({ initialValues }) => {
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

  const htmlForBlockContainer = pageTestData.forHTML({
    pickHTMLUI({ itemTestData }) {
      if (typeof itemTestData.values["text"]?.["text/html"] === "string") {
        console.debug("picked ProseMirrorLineHTML ui", itemTestData);
        return ProseMirrorLineHTML.html;
      }

      console.warn("unknown slot item UI", itemTestData);
      return ProseMirrorLineHTML.html;
    },
  });
  // console.log(dev`${htmlForBlockContainer}`._display);
  const pageHTML = ProseMirrorBlockContainerHTML.html(htmlForBlockContainer);

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
      <div class="page-container" dangerouslySetInnerHTML={pageHTML.html}></div>
    </div>
  );
});
