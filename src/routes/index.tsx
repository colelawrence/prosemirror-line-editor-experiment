import { component$, useStyles$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { Link } from '@builder.io/qwik-city';

import { baseKeymap, toggleMark } from 'prosemirror-commands';
import { schema } from 'prosemirror-schema-basic';
import { EditorState } from 'prosemirror-state';
import { DOMParser } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { undo, redo, history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import prosemirrorStyles from 'prosemirror-view/style/prosemirror.css?inline';
import { useClientEffect$ } from '@builder.io/qwik';

export default component$(() => {
  useStyles$(prosemirrorStyles);
  useStyles$(`
#my-line-editor {
  padding: 1rem;
  background: whitesmoke;
}
  `);
  const contentDOMValue = `
Hello <strong>Mintter</strong>!
  `;
  // useClientMount$
  useClientEffect$(async () => {
    const frag = document.createElement('div');
    frag.innerHTML = contentDOMValue;
    let state = EditorState.create({
      doc: DOMParser.fromSchema(schema).parse(frag),
      schema,
      plugins: [
        history(),
        keymap({ 'Mod-z': undo, 'Mod-y': redo }),
        keymap(baseKeymap),
        keymap({
          'Mod-b': toggleMark(schema.marks.strong),
          'Mod-i': toggleMark(schema.marks.em),
        }),
        keymap({
          Enter: () => {
            console.log('Handled enter');
            return true;
          },
        }),
      ],
    });
    const dom = document.getElementById('my-line-editor');
    console.log('mounting line editor', dom, schema);
    let view = new EditorView(dom, {
      state,
    });
  });

  return (
    <div>
      <h1>Mintter Experiment #1</h1>
      <p>
        A ProseMirror setup + some interfaces for extensible data storage in{' '}
        <code>src/routes/index.tsx</code>
      </p>

      <div id="my-line-editor" dangerouslySetInnerHTML={contentDOMValue}></div>
      {/* <Link class="mindblow" href="/flower/">
        Blow my mind 🤯
      </Link> */}
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
    for: ('web.editable' | 'web.readable' | 'web.static' | 'email.static')[];
    use: ID<'plugin/ui'>;
  }[];
  val: {
    [key: ID<'key'>]: {
      /** edit timestamp */
      fmt: {
        /**
         * multiple formats enforce the schema
         *
         * The ID points to a JSON schema...
         */
        [format: ID<'schema'>]: {
          json: JSON;
          /** derived from */
          knd: 'der' | 'src';
          // if derived
          der?: {
            /** last write of this value */
            ets: number;
            /** Q: should srcs also point to content address of original JSON? */
            srcs: { key: ID<'key'>; fmt: ID<'schema'> }[];
            wth: ID<'plugin/ui'> | ID<'plugin/tool'>;
          };
          // if source
          src?: {
            /** last edit of this format value's timestamp */
            ets: number;
            /** last edit by agent */
            eby: ID<'agent'>;
            /** edit made by ui or tool */
            wth: ID<'plugin/ui'> | ID<'plugin/tool'>;
          };
        };
      };
    };
  };
};

const ex: Stored = {
  ui: [
    {
      for: ['web.editable'],
      use: id`plugins.mintter.com/markdown-editor:ui`,
    },
    {
      for: ['web.static'],
      use: id`plugins.mintter.com/markdown-html:ui`,
    },
  ],
  val: {
    [id`content`]: {
      fmt: {
        [id`plugins.mintter.com/markdown:schema`]: {
          knd: 'src',
          src: {
            eby: id`auth.mintter.com/acct/cole`,
            ets: Date.now(),
            wth: id`plugins.mintter.com/markdown-editor:ui@v0.1.0`,
          },
          json: 'Hello **Mintter**!',
        },
        // holding onto derived data ensures that we can render this even if
        // we no longer have the original ui editor that was used to
        // construct this block.
        [id`plugins.mintter.com/html:schema`]: {
          knd: 'der',
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
          json: 'Hello <strong>Mintter</strong>!',
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

export const head: DocumentHead = {
  title: 'Mintter Experiment',
  meta: [
    {
      name: 'description',
      content: 'Site description',
    },
  ],
};
