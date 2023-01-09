import { PageWithTitle } from "../routes/ProseMirrorBlockContainer.UI";
import { unixSecsFrom } from "./utils/unixSecsFrom";
import { HTMLLine } from "../routes/HTMLLine.ItemSchema";
import { SimpleImage } from "~/routes/SimpleImage.ItemSchema";

export const PAGE_TEST_DATA = PageWithTitle.testData({
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
        miid: "MIID-IMAGE-001",
        linkedBlockData: SimpleImage.testData({
          slots: {},
          values: {
            imageSrc: {
              "data-uri": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'  width='40' height='40' viewport='0 0 100 100' style='fill:black;font-size:24px;'><text y='50%'>🥰</text></svg>",
            },
            title: { "text/html": "I love it!" },
          },
        }),
        standoffValues: {
          fractionalIndex: { "number/decimal": 0.2 },
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
      {
        miid: "MIID-COMMENT-004",
        linkedBlockData: SimpleImage.testData({
          slots: {},
          values: {
            imageSrc: {
              "data-uri": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'  width='40' height='40' viewport='0 0 100 100' style='fill:black;font-size:24px;'><text y='50%'>🤯</text></svg>",
            },
            title: { "text/html": "Caption <em>on image</em>." },
          },
        }),
        standoffValues: {
          targetId: { "mintter/item-id": "MIID-LINE-003" },
          postedAt: { "time/unix-secs": unixSecsFrom({ minutesAgo: 100 }) },
          postedBy: { "mintter/signer": "GITHUB.COM:colelawrence" },
        },
      },
    ],
  },
});
