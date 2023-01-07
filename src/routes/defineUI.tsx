import { MimeType } from "./MimeType";
import { InferParserValue } from "./Parser";

export interface MinttyValuesConfig {
  values: {
    [key: string]: {
      /** lossless format that this editor uses */
      format: MimeType<string, any>;
    };
  };
}
/**
 * Slots
 *
 * Progress 0/10:
 *  * I want to be able to statically say "I can render these children if they..."
 *  * Those children could be whiteboard elements or they could be line items, or
 *    to-do list tasks.
 *  * Example: If the children were to-do list tasks, then the parent
 *    could have its own UI for filtering whether to show the items which are done
 *    or not.
 * 
 * See Slot Props in Vue.js https://youtu.be/emi436qg9mg?t=431
 */
export interface MinttySlotsConfig {
  slots: {
    [slotName: string]: {
      item: MinttyValuesConfig;
      // Assume a slot can always hold multiple
      // /** can hold multiple */
      // multiple: boolean,
    };
  }
}
export type InferValues<Config extends MinttyValuesConfig> = {
  [P in keyof Config["values"]]: Record<
    Config["values"][P]["format"]["id"],
    InferParserValue<Config["values"][P]["format"]["parser"]>
  >;
};

export interface MinttyHTMLUI<Values extends MinttyValuesConfig> {
  values: Values;
  html: MinttyHTMLFn<Values>;
}

export interface MinttyHTMLFn<Values extends MinttyValuesConfig> {
  (values: InferValues<Values>): {
    css?: string;
    html: string;
  };
}

export interface MinttyWebFn<Values extends MinttyValuesConfig> {
  (
    values: InferValues<Values>,
    mountTo: {
      container: HTMLElement;
      save(values: Partial<InferValues<Values>>): Promise<void>;
    }
  ): {
    destroy(): void;
    apply(values: Partial<InferValues<Values>>): void;
  };
}
export interface MinttyWebUI<Values extends MinttyValuesConfig> {
  values: Values;
  web: MinttyWebFn<Values>;
}
export function defineUI<Values extends MinttyValuesConfig>(values: Values) {
  return {
    forHTML(html: MinttyHTMLFn<Values>): MinttyHTMLUI<Values> {
      return {
        values,
        html,
      };
    },
    forWeb(web: MinttyWebFn<Values>): MinttyWebUI<Values> {
      return {
        values,
        web,
      };
    },
  };
}
