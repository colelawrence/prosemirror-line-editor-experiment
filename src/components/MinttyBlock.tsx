import { component$ } from "@builder.io/qwik";
import { useClientEffect$ } from "@builder.io/qwik";
import type {
  MinttyHTMLContainerUI,
  MinttyWebContainerUI,
} from "~/routes/defineItemSchema";
import { editors } from "../routes/index";

export const MinttyBlock = component$<{
  initialValues: any;
  html: number;
  web: number;
}>(({ initialValues, html, web }) => {
  const randId = "block-" + Math.random().toString(36).slice(2);
  const htmlOf = editors[html] as MinttyHTMLContainerUI<any>;
  const staticWebUI = htmlOf.html({ values: initialValues, slots: {} });

  useClientEffect$(async () => {
    const webOf = editors[web] as MinttyWebContainerUI<any>;
    const editorElt = document.getElementById(randId)!;
    editorElt.innerHTML = "";
    const webState = webOf.web({
      values: initialValues,
      slots: {},
      async save(values: any) {
        console.log("save", values);
      },
    });
    const mounted = webState.mount({
      container: editorElt,
    });

    return () => mounted.destroy();
  });

  return (
    <div>
      <style>{staticWebUI.css}</style>
      <div id={randId} dangerouslySetInnerHTML={staticWebUI.html}></div>
    </div>
  );
});
// todo: super JSON?
type JSON = number | string | JSON[] | { [key: string]: JSON };
const named = Symbol();
type ID<Name> = string & {
  [named]: Name;
};
function id<Name extends string = any>(key: TemplateStringsArray): ID<Name> {
  return String.raw(key) as any;
}
type Stored = {
  /** List of UI components */
  ui: {
    for: ("web.editable" | "web.readable" | "web.static" | "email.static")[];
    use: ID<"plugin/ui">;
  }[];
  val: {
    [key: ID<"key">]: {
      /** edit timestamp */
      fmt: {
        /**
         * multiple formats enforce the schema
         *
         * The ID points to a JSON schema...
         */
        [format: ID<"schema">]: {
          json: JSON;
          /** derived from */
          knd: "der" | "src";
          // if derived
          der?: {
            /** last write of this value */
            ets: number;
            /** Q: should srcs also point to content address of original JSON? */
            srcs: { key: ID<"key">; fmt: ID<"schema"> }[];
            wth: ID<"plugin/ui"> | ID<"plugin/tool">;
          };
          // if source
          src?: {
            /** last edit of this format value's timestamp */
            ets: number;
            /** last edit by agent */
            eby: ID<"agent">;
            /** edit made by ui or tool */
            wth: ID<"plugin/ui"> | ID<"plugin/tool">;
          };
        };
      };
    };
  };
};
const ex: Stored = {
  ui: [
    {
      for: ["web.editable"],
      use: id`plugins.mintter.com/markdown-editor:ui`,
    },
    {
      for: ["web.static"],
      use: id`plugins.mintter.com/markdown-html:ui`,
    },
  ],
  val: {
    [id`content`]: {
      fmt: {
        [id`plugins.mintter.com/markdown:schema`]: {
          knd: "src",
          src: {
            eby: id`auth.mintter.com/acct/cole`,
            ets: Date.now(),
            wth: id`plugins.mintter.com/markdown-editor:ui@v0.1.0`,
          },
          json: "Hello **Mintter**!",
        },
        // holding onto derived data ensures that we can render this even if
        // we no longer have the original ui editor that was used to
        // construct this block.
        [id`plugins.mintter.com/html:schema`]: {
          knd: "der",
          der: {
            wth: id`plugins.mintter.com/markdown:schema`,
            ets: Date.now(),
            srcs: [
              {
                fmt: id`plugins.mintter.com/markdown:schema`,
                key: id`content`,
              },
            ],
          },
          json: "Hello <strong>Mintter</strong>!",
        },
      },
    },
  },
};
// some common interface for returning different capabilities between
function defineEditable$<
  Config extends {
    web: {
      readable?: {
        mount$(dom: HTMLElement): { destroy(): void };
      };
      writable?: {
        mount$(dom: HTMLElement): { destroy(): void };
      };
      static?: {};
    };
    email?: {
      static?: {};
    };
  }
>(config: Config) {
  return config;
}
const markdownEditor = defineEditable$({
  web: {
    readable: {
      mount$(dom) {
        console.log(dom);
        return {
          destroy() {},
        };
      },
    },
    static: {},
  },
});
