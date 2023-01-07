import {
  AttributeSpec,
  DOMOutputSpec,
  Fragment,
  Mark,
  Node as PMNode,
  NodeSpec,
  NodeType,
  ParseRule,
} from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { BehaviorSubject, Observable, Subscription } from "rxjs";

import { invariant, invariantEq } from "@autoplay/utils";
import { IUtilLogger } from "librarylog";

import { deepEqual } from "./deepEqual";
import { deepDiff } from "./deepDiff";

type ToDOM<Attrs> = {
  toDOM: (
    toDOMFn: (
      node: Omit<PMNode, "attrs"> & {
        /** TODO: Double check that we can guarantee that the attrs are not partial */
        attrs: Attrs;
      }
    ) => DOMOutputSpec
  ) => NodeSpecAddParsers<Attrs>;
};

type NodeSpecAddParsers<Attrs> = {
  addParser: <N extends Node>(
    options: Omit<ParseRule, "getAttrs"> & {
      getAttrs(dom: N): Attrs;
    }
  ) => NodeSpecAddParsers<Attrs>;
  finish(): {
    nodeSpec: NodeSpec;
    /**
     * Create a state to manage changes to the node.
     *
     * This is specifically designed to make it easier to create custom node-views.
     */
    createState(
      node: PMNode,
      log: IUtilLogger,
      subscription: Subscription,
      view: EditorView,
      getPos: () => number
    ): {
      attrs$: {
        [P in keyof Attrs]: Observable<Attrs[P]>;
      };
      // TODO: Double check usefulness of this
      dispatchUpdateAttrs(
        attrsToUpdate:
          | { attrs: Partial<Attrs> }
          | ((attrs: Attrs) => {
              attrs: Partial<Attrs>;
            })
      ): void;
      /** @return true if the update was able to be applied to the state */
      updateNode(node: PMNode): boolean;
    };
    /** invariant that this node is of the correct type */
    attrs(node: PMNode): Attrs;
    attrsUnchecked(node: Attrs): Attrs;
    createNode(
      nodeType: NodeType,
      attrs: Partial<Attrs>,
      content?: PMNode | PMNode[] | Fragment,
      marks?: Mark[]
    ): PMNode;
    createNodeJSON(attrs: Partial<Attrs>, content?: any[], marks?: Mark[]): any;
  };
};

const INVALID_CHANGED_ATTRS = new Set(["uid", "uidCopied"]);

// type OmitAnyEntries<T> = {
//   [P in keyof T as string extends P ? never : P]: T[P]
// }
type NonStringKeys<T> = keyof {
  [P in keyof T as string extends P ? never : P]: T[P];
};
/** Remove `[key: string]: any;` from a type */
type OmitAnyEntries<T> = Pick<T, NonStringKeys<T>>;

/** See https://gist.github.com/colelawrence/f76d8937d3fddfa1ca53d67a31a29ff7 for example usage */
export function buildTypedNodeSpec<T extends Record<string, AttributeSpec>>(
  keyName: string,
  spec: Omit<OmitAnyEntries<NodeSpec>, "attrs" | "toDOM" | "parseDOM"> & {
    attrs: T;
  }
): ToDOM<{
  [P in keyof T]: T[P]["default"];
}> {
  type Attrs = {
    [P in keyof T]: T[P]["default"];
  };
  return {
    toDOM: function toDomBuilder(toDOMFn, rules: ParseRule[] = []) {
      return {
        addParser({ getAttrs, ...parseRule }) {
          return toDomBuilder(toDOMFn, [
            ...rules,
            {
              ...parseRule,
              getAttrs(dom) {
                try {
                  return getAttrs(dom as any);
                } catch {
                  return false;
                }
              },
            },
          ]);
        },
        finish() {
          return {
            attrs(node) {
              invariantEq(
                node.type.name,
                keyName,
                "expected node to be of key"
              );
              return node.attrs as any;
            },
            attrsUnchecked(attrs) {
              return attrs;
            },
            createNode(nodeType, attrs, content, marks) {
              return nodeType.createChecked(attrs, content, marks);
            },
            createNodeJSON(attrs, content, marks) {
              return {
                type: keyName,
                attrs,
                content,
                marks,
              };
            },
            nodeSpec: {
              ...spec,
              toDOM: toDOMFn as (gnode: PMNode) => DOMOutputSpec,
              parseDOM: rules,
            },
            createState(node, log, sub, view, getPos) {
              log = log.named("node state");
              const nodeType = view.state.schema.nodes[keyName];
              invariant(
                nodeType,
                "expected that the node type is keyed in the schema for createState",
                {
                  schema: view.state.schema,
                  keyName,
                }
              );
              const $attrs$ = objMap(
                spec.attrs,
                (_val, key) =>
                  // @ts-ignore - necessary since P of attrs isn't enforced as a string
                  new BehaviorSubject(node.attrs[key])
              );
              /** takes behaviors into consideration */
              const getLatestAttrs = (partial: Partial<Attrs>) =>
                objMap($attrs$, ($beh$, key) =>
                  key in partial ? partial[key] : $beh$.value
                );

              // defensive clean-up
              sub.add(() => {
                for (const key in $attrs$) {
                  $attrs$[key].complete();
                }
              });

              return {
                attrs$: objMap($attrs$, (val) => val.asObservable()),
                updateNode(updatedNode) {
                  if (updatedNode.type !== nodeType) return false;
                  const updatedAttrs = updatedNode.attrs;

                  for (const attrName in updatedAttrs) {
                    const updateNodeAttrValue = updatedAttrs[attrName];
                    const $attr$ = $attrs$[attrName];
                    if (!deepEqual(updateNodeAttrValue, $attr$.value)) {
                      // don't handle "uid" changed automatically
                      // since that will usually result in some pubsub being wrong
                      if (INVALID_CHANGED_ATTRS.has(attrName)) {
                        log.warn(
                          "Unexpected attribute changed with updateNode",
                          { attrName }
                        );
                        return false;
                      }

                      // doesn't feel super safe, but we're relying on ProseMirror to do a good job
                      log.trace(`updated ${attrName}`, {
                        with: updateNodeAttrValue,
                      });
                      $attr$.next(updateNodeAttrValue);
                    }
                  }

                  const latestAttrs = getLatestAttrs({});
                  const attrsUpdatedDiff = deepDiff(updatedAttrs, latestAttrs);
                  const attrsUpdated = Object.keys(attrsUpdatedDiff).length > 0;

                  if (attrsUpdated) {
                    log.trace(
                      "will re-render since attrs updated",
                      attrsUpdatedDiff
                    );
                  }

                  // if there are extras we couldn't apply, we want prosemirror to re-render the whole node view
                  return !attrsUpdated;
                },
                dispatchUpdateAttrs(partialOrUpdateFn) {
                  const { attrs: partial /* overrideUIOperation */ } =
                    typeof partialOrUpdateFn === "function"
                      ? partialOrUpdateFn(
                          objMap($attrs$, (val) => val.getValue())
                        )
                      : partialOrUpdateFn;

                  let tr = view.state.tr.setNodeMarkup(
                    getPos(),
                    undefined,
                    getLatestAttrs(partial)
                  );
                  // TODO: Some way to make it easy to mark the operation as handled before sending over to author sync
                  // if (overrideUIOperation) {
                  //   tr = uiOperationUpdateMeta.set(tr, overrideUIOperation);
                  // }
                  // dispatch create transaction
                  view.dispatch(tr);
                },
              };
            },
          };
        },
      };
    },
  };
}

function objMap<T extends Record<string, any>, U>(
  template: T,
  eachKey: <P extends keyof T>(value: T[P], name: P) => U
): { [P in keyof T]: U } {
  // @ts-ignore
  return Object.fromEntries(
    Object.entries(template).map(([name, value]) => {
      // @ts-ignore
      return [name, eachKey(value, name)];
    })
  );
}
