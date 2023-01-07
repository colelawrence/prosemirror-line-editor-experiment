import { component$, useStyles$ } from "@builder.io/qwik";
import { ProseMirrorLineHTML } from "../ProseMirrorLine";
import { ProseMirrorBlockContainerHTML } from "../ProseMirrorBlockContainer";
import { unixSecsFrom } from "./unixSecsFrom";

export default component$<{ initialValues: any }>(({ initialValues }) => {
  const pageHTML = ProseMirrorBlockContainerHTML.html({
    values: {
      title: {
        "text/html": `Mintty Editor <sup>experiment</sup>`,
      },
    },
    slots: {
      children: [
        {
          miid: "MIID-LINE-001",
          ...ProseMirrorLineHTML.html({
            text: { "text/html": "Hello <strong>Mintter</strong>!" },
          }),
          standoffValues: {
            fractionalIndex: { "number/decimal": 0.01 },
            indentation: { "number/natural": 0 },
          },
        },
        {
          miid: "MIID-LINE-002",
          ...ProseMirrorLineHTML.html({
            text: { "text/html": "This is block 2." },
          }),
          standoffValues: {
            fractionalIndex: { "number/decimal": 0.5 },
            indentation: { "number/natural": 0 },
          },
        },
        {
          miid: "MIID-LINE-003",
          ...ProseMirrorLineHTML.html({
            text: { "text/html": "This is block 3." },
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
          ...ProseMirrorLineHTML.html({
            text: { "text/html": "A comment" },
          }),
          standoffValues: {
            targetId: { "mintter/item-id": "MIID-LINE-001" },
            postedAt: { "time/unix-secs": unixSecsFrom({ minutesAgo: 5 }) },
            postedBy: { "mintter/signer": "GITHUB.COM:colelawrence" },
          },
        },
        {
          miid: "MIID-COMMENT-002",
          ...ProseMirrorLineHTML.html({
            text: { "text/html": "Was this comment for testing?" },
          }),
          standoffValues: {
            targetId: { "mintter/item-id": "MIID-COMMENT-001" },
            postedAt: { "time/unix-secs": unixSecsFrom({ minutesAgo: 1 }) },
            postedBy: { "mintter/signer": "TWITTER.COM:hhg2288" },
          },
        },
        {
          miid: "MIID-COMMENT-003",
          ...ProseMirrorLineHTML.html({
            text: { "text/html": "Supports indentation?" },
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

  useStyles$(`
.page-container {
  padding: 1rem;
  border-radius: 4px;
  background-color: white;
  box-shadow: 0px 20px 30px rgba(0,0,0,0.4);
}
  `);

  return (
    <div>
      <h1>Mintter Experiment #1</h1>
      <p>Page container</p>
      <style>{pageHTML.css}</style>
      <div class="page-container" dangerouslySetInnerHTML={pageHTML.html}></div>
    </div>
  );
});
