import { baseKeymap, toggleMark } from "prosemirror-commands";
import { EditorState } from "prosemirror-state";
import { Schema, DOMParser, DOMSerializer } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { undo, redo, history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import prosemirrorStyles from "prosemirror-view/style/prosemirror.css?inline";

import { schema as basicSchema } from "prosemirror-schema-basic";
import { HTMLLine } from "./HTMLLine";
import xss from "xss";

/**
 * Minimal ProseMirror as a single line editor with marks from {@link import("prosemirror-schema-basic")}
 */
const schema = new Schema({
  nodes: {
    doc: {
      content: "inline*",
      // group: "block",
      parseDOM: [{ tag: "p" }],
    },
    // :: NodeSpec The text node.
    text: {
      group: "inline",
    },
  },
  // technically supports links
  marks: basicSchema.spec.marks,
});

export const ProseMirrorLineHTML = HTMLLine.forHTML(({ values }) => {
  const css = [
    prosemirrorStyles,
    `.mintty-line-editor {
  /* padding: 1rem; */
  background: whitesmoke;
}
.mintty-line-editor {
  margin: 0;
  line-height: 1.7;
}`,
  ].join("");

  let html = values.text["text/html"];
  if (!html) html = "<br/>";
  else html = xss(html);
  // // Add wrapping paragraph
  // const noParagraphs = !/\s*<p\b/.test(html);
  // if (noParagraphs) html = `<p>${html}</p>`;
  return {
    html: `<div class="mintty-line-editor">${html}</div>`,
    css,
  };
});

export const ProseMirrorLineWeb = HTMLLine.forWeb((values, mountTo) => {
  const frag = document.createElement("div");
  frag.innerHTML = values.text["text/html"];
  const domParser = DOMParser.fromSchema(schema);
  const domSerializer = DOMSerializer.fromSchema(schema);
  let state = EditorState.create({
    doc: domParser.parse(frag),
    schema,
    plugins: [
      history(),
      keymap({ "Mod-z": undo, "Mod-y": redo }),
      keymap(baseKeymap),
      keymap({
        "Mod-b": toggleMark(schema.marks.strong),
        "Mod-i": toggleMark(schema.marks.em),
      }),
      keymap({
        Enter: () => {
          console.log("Handled enter");
          return true;
        },
      }),
      {
        getState(state) {},
        props: {},
        spec: {
          view(view) {
            return {
              update(view, prevState) {
                if (!view.state.doc.eq(prevState.doc)) {
                  const frag = domSerializer.serializeFragment(
                    view.state.doc.content
                  );
                  const elt = document.createElement("div");
                  elt.append(frag);
                  // const html = Array.from(.children)
                  //   .map((elt) => elt.outerHTML)
                  //   .join("\n");
                  // console.log(frag, html);
                  mountTo.save({
                    text: {
                      "text/html": elt.innerHTML,
                    },
                  });
                }
              },
            };
          },
        },
      },
    ],
  });

  const view = new EditorView(mountTo.container, {
    state,
  });

  console.log("mounted line editor", mountTo.container, view);
  view.dom.classList.add("mintty-line-editor");

  return {
    // override current value from save
    apply(values) {
      if (values.text === undefined) return;
      const frag = document.createElement("div");
      frag.innerHTML = values.text["text/html"];
      const parsed = domParser.parse(frag);
      const { nodeSize } = view.state.tr.doc;
      // direct full state replacement
      view.updateState(
        view.state.apply(view.state.tr.replaceWith(0, nodeSize, parsed))
      );
    },
    destroy() {
      view.destroy();
    },
  };
});
