import { baseKeymap, toggleMark } from "prosemirror-commands";
import { schema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { DOMParser } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { undo, redo, history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import prosemirrorStyles from "prosemirror-view/style/prosemirror.css?inline";
import { defineUI } from "./defineUI";
import { textHTML } from "./textHTML";

const ProseMirrorLine = defineUI({
  values: {
    text: {
      format: textHTML,
    },
  },
});

export const ProseMirrorLineHTML = ProseMirrorLine.forHTML((values) => {
  const css = [
    prosemirrorStyles,
    `.mintty-line-editor {
  padding: 1rem;
  background: whitesmoke;
}`,
  ].join("");
  return {
    html: `<div class="mintty-line-editor">${
      values.text["text/html"] || "<br/>"
    }</div>`,
    css,
  };
});

export const ProseMirrorLineWeb = ProseMirrorLine.forWeb((values, mountTo) => {
  const frag = document.createElement("div");
  frag.innerHTML = values.text["text/html"];
  const domParser = DOMParser.fromSchema(schema);
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
