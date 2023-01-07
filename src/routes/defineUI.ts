import type { InferSlotItemValues } from "./defineContainerUI";
import type { MimeType } from "./MimeType";
import type { InferParserValue } from "./Parser";

export interface MinttyValuesConfig {
  values: {
    [key: string]: {
      /** lossless format that this editor uses */
      format: MimeType<string, any>;
    };
  };
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

/** @deprecated for MinttyHTMLContainerFn */
export interface MinttyHTMLFn<Values extends MinttyValuesConfig> {
  (options: { values: InferValues<Values> }): {
    css?: string;
    html: string;
  };
}
/** @deprecated for MinttyWebContainerFn */
export interface MinttyWebFn<Values extends MinttyValuesConfig> {
  (options: {
    values: InferValues<Values>;
    // slots: InferSlotsForWeb<Config>;
    save(values: Partial<InferValues<Values>>): Promise<void>;
  }): {
    apply(values: Partial<InferValues<Values>>): void;
    mount: MinttyMountFn;
  };
}

/** IDEA: It would be cool to have some kind of Promise loading state for while the editor loads... */
export interface MinttyMountFn {
  (mountTo: { container: HTMLElement }): {
    destroy(): void;
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
    testData(
      options: {
        slots: {};
        values: InferValues<Values>;
      }
      // /** other blocks could be mixed with this */
      // mergeIn: { values: InferValues<any> }[]
    ) {
      return options;
    },
  };
}
