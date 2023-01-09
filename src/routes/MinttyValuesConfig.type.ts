import type { MimeType } from "./MimeType";
import type { InferParserValue } from "./Parser.type";

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
