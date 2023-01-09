import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

import { ProseMirrorLineHTML, ProseMirrorLineWeb } from "./ProseMirrorLine.UI";
import { MinttyPage } from "../components/MinttyPage";
import { MinttyBlock } from "../components/MinttyBlock";

// hmm... I have to use lookups in order to create enough indirection for both
// server side components and client mounted to be serializable
export const editors = [ProseMirrorLineHTML, ProseMirrorLineWeb];

export const MintterLines = component$(() => {
  return (
    <div>
      <p>
        A ProseMirror setup + some interfaces for extensible data storage in{" "}
        <code>src/routes/index.tsx</code>
      </p>
      <hr />

      {/* A series of editors next to each other */}
      <MinttyBlock
        html={0}
        web={1}
        initialValues={{
          text: {
            "text/html": "Hello <strong>Mintter</strong>!",
          },
        }}
      />
      <MinttyBlock
        html={0}
        web={1}
        initialValues={{
          text: {
            "text/html": "This is block 2.",
          },
        }}
      />
      <MinttyBlock
        html={0}
        web={1}
        initialValues={{
          text: {
            "text/html": "This is block 3.",
          },
        }}
      />
    </div>
  );
});
export default component$(() => {
  return (
    <div>
      <MintterLines />
      <hr />
      <MinttyPage />
      <hr />
      {/* <Link class="mindblow" href="/flower/">
        Blow my mind 🤯
      </Link> */}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Mintter Experiment",
  meta: [
    {
      name: "description",
      content: "Site description",
    },
  ],
};
