import { baseKeymap, toggleMark } from "prosemirror-commands";
import { dropCursor } from "prosemirror-dropcursor";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView, NodeViewConstructor } from "prosemirror-view";

import moment from "moment";

import { dev, z } from "@autoplay/utils";
import createLibraryLoggerProvider from "librarylog";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { Subscription } from "rxjs";
import xss from "xss";
import { defineItemSchema } from "./defineItemSchema";
import { defineMimeType } from "./MimeType";
import { buildTypedNodeSpec } from "./prosemirrorBuildNodeSpec";
import { textHTML } from "./textHTML.mimeType";

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
  .toDOM((node) => ["mintty-block", { "mintter-id": node.attrs.miid }])
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

export const PageWithTitle = defineItemSchema({
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
        },
      },
    },
  },
});

/** Take reference from {@link ProseMirrorBlockContainerHTML} */
const blockNodeView: (
  slots: typeof PageWithTitle["_slotWebTypes"]
) => NodeViewConstructor = (slots) => (node, view, getPos, decs, innerDecs) => {
  const attrs = blockSpec.attrs(node);
  const dom = trashHTML(`<div class="page-block" data-miid="${xss(
    /* hmm not an attr escape... 0/10? */
    attrs.miid
  )}">
  </div>`);

  const liblog = createLibraryLoggerProvider().getLogger();
  const mountedSub = new Subscription();
  const state = blockSpec.createState(
    node,
    liblog.downgrade.dev(),
    mountedSub,
    view,
    getPos
  );

  mountedSub.add(
    state.attrs$.indent.subscribe((value) => {
      dom.style.marginLeft = `${value}rem`;
    })
  );

  const found = slots.children.find((c) => c.miid === attrs.miid);
  if (!found) {
    console.error("missing slot info?", found);
    dom.textContent = dev`missing slot info? ${attrs}`.toDisplay();
    dom.style.whiteSpace = "pre";
    return { dom };
  }

  if (!found.mount) debugger;

  const mounted = found.mount({
    container: dom,
  });

  dom.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      console.warn(`TODO: Change indent of `, blockSpec.attrs(node));
      state.dispatchUpdateAttrs((attrs) => ({
        attrs: {
          indent: Math.min(
            6,
            Math.max(0, event.shiftKey ? attrs.indent - 1 : attrs.indent + 1)
          ),
        },
      }));
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  return {
    dom,
    update(node, decorations, innerDecorations) {
      return state.updateNode(node);
    },
    stopEvent(event) {
      return event.target !== dom;
    },
    destroy() {
      mounted.destroy();
    },
  };
};

/** this is stupid... just simple for vanilla js for now */
function trashHTML(input: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = input;
  return host.childNodes[0] as any;
}

export const ProseMirrorBlockContainerHTML = PageWithTitle.forHTML(
  ({ slots, values }) => {
    slots.comments.map((child) => child.html);
    return {
      css: `
.page-content { padding: 8px 0; }
.page-block { position: relative; white-space: normal; padding-left: 1rem; transition: all 0.2s;  }
.page-title { font-size: 36px; font-weight: bold; letter-spacing: -0.01pt; margin-bottom: 1rem; }
.comment-group { padding: 0.2rem; border: 1px solid #ddd }
.page-comment--meta { font-size: .85em; }
.reply-comment-list::before { content: "↪︎"; position: absolute; left: 1rem }
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
  ({ slots, values, save }) => {
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
        dropCursor({
          width: 3,
          color: "cornflowerblue",
        }),
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
                    // save({
                    //   title: {
                    //     "text/html": "New title"
                    //   }
                    // });
                  }
                },
              };
            },
          },
        },
      ],
    });

    let view: EditorView;

    return {
      // applyItemStandoff(values) {
      //   console.warn(dev`TODO: update page standoff values for ${values}`);
      // },
      // override current value from save
      apply(values) {
        console.warn("TODO: update page values from other source", { values });
        if (values.title === undefined) return;
        const frag = document.createElement("div");
        frag.innerHTML = values.title["text/html"];
        // const parsed = domParser.parse(frag);
        // const { nodeSize } = view.state.tr.doc;

        // TODO update directly to mountView

        // direct full state replacement
        // view.updateState(
        //   view.state.apply(view.state.tr.replaceWith(0, nodeSize, parsed))
        // );
      },
      mount({ container }) {
        // console.log("mounting block container", mountTo);
        const titleElt = document.createElement("h1");
        titleElt.innerHTML = values.title["text/html"];
        titleElt.contentEditable = "true";
        container.append(titleElt);
        const mountView = (view = new EditorView(container, {
          state,
          nodeViews: {
            block: blockNodeView(slots),
          },
        }));

        console.log("mounted container editor", container, mountView);
        mountView.dom.classList.add("page-content");

        return {
          destroy() {
            mountView.destroy();
            titleElt.remove();
          },
        };
      },
    };
  }
);
