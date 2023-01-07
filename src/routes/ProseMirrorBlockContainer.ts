import { baseKeymap, toggleMark } from "prosemirror-commands";
import { EditorState } from "prosemirror-state";
import { Schema, DOMParser, DOMSerializer } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { undo, redo, history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";

import moment from "moment";

import { schema as basicSchema } from "prosemirror-schema-basic";
import { buildTypedNodeSpec } from "./prosemirrorBuildNodeSpec";
import { defineContainerUI } from "./defineContainerUI";
import { textHTML } from "./textHTML";
import { defineMimeType } from "./MimeType";
import { dev, z } from "@autoplay/utils";
import xss from "xss";

const blockSpec = buildTypedNodeSpec("block", {
  atom: true,
  selectable: true,
  draggable: true,
  isolating: true,
  attrs: {
    miid: {
      // IDK
      // specifying the type of this default will ensure that the typed spec will work
      default: null as any as string,
    },
    indent: {
      // IDK
      // specifying the type of this default will ensure that the typed spec will work
      default: 0,
    },
    /** fractional index */
    fract: {
      // specifying the type of this default will ensure that the typed spec will work
      default: 0,
    },
  },
})
  .toDOM((node) => ["mintty-block", { "mintter-id": node.attrs.miid }, 0])
  // // Used for identifying pasting (this is not so important as we should manually manage pasting in Mintter
  // // using unified -> https://github.com/unifiedjs/unified)
  // .addParser({
  //    ...
  // })
  .finish();

/**
 * Minimal ProseMirror as a single line editor with marks from {@link import("prosemirror-schema-basic")}
 */
const schema = new Schema({
  nodes: {
    doc: {
      content: "block*",
      // group: "block",
      parseDOM: [{ tag: "p" }],
    },
    block: blockSpec.nodeSpec,
    // :: NodeSpec The text node.
    // This shouldn't ever actually exist in the editor...
    text: {
      group: "inline",
    },
  },
  // technically supports links
  marks: basicSchema.spec.marks,
});

const decimalNumberFormat = defineMimeType("number/decimal", {
  parse(input) {
    const num = typeof input === "number" ? input : Number(input);
    if (isNaN(num))
      throw dev`Unknown kind is not a number: \`${input}\``.asError();
    return num;
  },
});

const naturalNumberFormat = defineMimeType("number/natural", {
  parse(input) {
    const num = decimalNumberFormat.parser.parse(input);
    if (num < 0)
      throw dev`Number (\`${num}\`) cannot be natural if it's negative.`.asError();

    return num;
  },
});

const itemIDFormat = defineMimeType(
  "mintter/item-id",
  z.string({ description: "Mintter Item ID" }).min(6)
);

// Uhhh... Like a pub key attached to an authorized identity
const agentIdentityFormat = defineMimeType(
  "mintter/signer",
  z.string({ description: "Mintter Signing Identity" }).min(6)
);

const unixSecsFormat = defineMimeType("time/unix-secs", {
  parse(input) {
    const num = naturalNumberFormat.parser.parse(input);
    return num;
  },
});

export const PageWithTitle = defineContainerUI({
  values: {
    title: {
      format: textHTML,
    },
  },
  slots: {
    // slot is named "children"
    children: {
      multiple: true,
      itemStandoffValues: {
        values: {
          fractionalIndex: {
            format: decimalNumberFormat,
          },
          indentation: {
            format: naturalNumberFormat,
          },
        },
      },
    },
    /**
     * slot is named "comments" and will be positioned next to
     * the page. Because this is a slot, the actual comment ui
     * is agnostic of this hierarchy block.
     *
     * In fact, you could technically mix comment formats together
     * such as using an image block ui as a comment.
     */
    comments: {
      multiple: true,
      itemStandoffValues: {
        values: {
          postedAt: {
            format: unixSecsFormat,
          },
          postedBy: {
            format: agentIdentityFormat,
          },
          /** the subject of this comment (e.g. a block on the page) */
          targetId: {
            format: itemIDFormat,
          },
          // TODO: editedAt, editedBy, etc...
          // /** targeting another sibling comment */
          // replyToItemId: {
          //   format: itemIDFormat,
          // },
        },
      },
    },
  },
});

export const ProseMirrorBlockContainerHTML = PageWithTitle.forHTML(
  ({ slots, values }) => {
    return {
      css: `
.page-block { position: relative }
.page-title { font-size: 36px; font-weight: bold; letter-spacing: -0.01pt; margin-bottom: 1rem; }
.comment-group { padding: 0.2rem; border: 1px solid #ddd }
.page-comment--meta { font-size: .85em; }
.reply-comment-list::before { content: "↪︎"; position: absolute; left: 0 }
.reply-comment-list { padding-left: 1rem; }
`,
      // Absolute: .page-block-comment { position: absolute; top: 0px; right: 0px; z-index: 1; background: white }
      html: `
<div class="page-title">${xss(values.title["text/html"])}</div>
<div class="page-content">
  ${slots.children
    .map(
      (a) =>
        `
<div class="page-block" style="margin-left: ${
          a.standoffValues.indentation["number/natural"] + "rem"
        }" data-miid="${xss(
          /* hmm not an attr escape... */
          a.miid
        )}">
  <style>${a.css}</style>
  ${a.html}
  ${wrapCommentsHTML({
    class: "page-block-comment",
    comments: slots.comments
      .filter(
        (comment) =>
          comment.standoffValues.targetId["mintter/item-id"] === a.miid
      )
      .map((comment) => renderCommentHTML(comment, slots.comments)),
  })}
</div>`
    )
    .join("")}
  <div>
</div>
`,
    };
  }
);

function renderCommentHTML(
  comment: typeof PageWithTitle["_slotHTMLTypes"]["comments"][0],
  allComments: typeof PageWithTitle["_slotHTMLTypes"]["comments"]
  // // prevent recursive loop, maybe?
  // parents: string[],
): string {
  const signer = comment.standoffValues.postedBy["mintter/signer"];
  return `
<div class="page-comment" data-miid="${xss(
    /* hmm not an attr escape... */
    comment.miid
  )}">
  <style>${comment.css}</style>
  <div class="page-comment--body" data-mount-target>${comment.html}</div>
  <div class="page-comment--meta">
  <byline class="page-comment--poster">${
    signer.split(":")[1] ?? signer
  }</byline>&nbsp;
  <time class="page-comment--time">${moment(
    comment.standoffValues.postedAt["time/unix-secs"] * 1000
  ).fromNow()}</time>
  </div>
  ${
    // insert comment replies
    wrapCommentsHTML({
      class: "reply-comment-list",
      comments: allComments
        .filter(
          (nested) =>
            nested.miid !== comment.miid &&
            nested.standoffValues.targetId["mintter/item-id"] === comment.miid
        )
        .map((reply) => renderCommentHTML(reply, allComments)),
    })
  }
</div>`;
}

function wrapCommentsHTML(props: {
  class?: string;
  comments: string[];
}): string {
  if (props.comments.length > 0) {
    return `<div class="${props.class} comment-group">${props.comments.join(
      ""
    )}</div>`;
  }
  return "";
}

export const ProseMirrorBlockContainerWeb = PageWithTitle.forWeb(
  ({ slots, values, mountTo }) => {
    const titleElt = document.createElement("div");
    titleElt.innerHTML = values.title["text/html"];
    titleElt.contentEditable = "true";

    // const domParser = DOMParser.fromSchema(schema);
    // const domSerializer = DOMSerializer.fromSchema(schema);
    let state = EditorState.create({
      doc: schema.nodeFromJSON({
        type: "doc",
        attrs: {},
        content: slots.children.map((child) =>
          blockSpec.createNodeJSON({
            miid: child.miid,
            fract: child.standoffValues.fractionalIndex["number/decimal"],
            indent: child.standoffValues.indentation["number/natural"],
          })
        ),
      }),
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
                    console.warn("TODO: Figure out which nodes were moved");
                    // const frag = domSerializer.serializeFragment(
                    //   view.state.doc.content
                    // );
                    // const html = Array.from(frag.children)
                    //   .map((elt) => elt.outerHTML)
                    //   .join("\n");
                    // // console.log(frag, html);
                    // mountTo.save({
                    //   text: {
                    //     "text/html": html,
                    //   },
                    // });
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

    console.log("mounted container editor", mountTo.container, view);
    view.dom.classList.add("mintty-container-editor");

    return {
      applyItemStandoff(values) {
        console.warn(dev`TODO: update page standoff values for ${values}`);
      },
      // override current value from save
      apply(values) {
        console.warn("TODO: update page values from other source", { values });
        if (values.title === undefined) return;
        const frag = document.createElement("div");
        frag.innerHTML = values.title["text/html"];
        // const parsed = domParser.parse(frag);
        // const { nodeSize } = view.state.tr.doc;
        // direct full state replacement
        // view.updateState(
        //   view.state.apply(view.state.tr.replaceWith(0, nodeSize, parsed))
        // );
      },
      destroy() {
        view.destroy();
      },
    };
  }
);
